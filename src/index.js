var fs          = require('fs'),
		octonode    = require('octonode'),
		path        = require('path'),
		child       = require('child_process'),
		pkg_config  = require('config-tree'),
		chalk			  = require('chalk');

// Github authentication
var config,
		gh_client,
		gh_entity;

var sh_commands = require('./sh-commands.js');

/*    I N I T  C O M M A N D S   */
function configClient(){
	var dir = path.dirname(__dirname);
	pkg_config.sprout(dir, 'kestrel');
}

/*    C R E A T I O N  C O M M A N D S   */
function setGitHubOrgType(gh_c){
	if (config.github.type == 'org'){
		return gh_c.org(config.github.account_name);
	} else if (config.github.type == 'individual'){
		return gh_c.me();
	}
}
function kestrelInit(cb){
	child.exec( sh_commands.kestrelInit(), cb );
}
function gitInit(current_dir, cb){
	child.exec( sh_commands.gitInit(config.github.login_method, config.github.account_name, current_dir), cb );
}
function createGitHubRepo(repo_name, cb){
	gh_entity.repo({
	  "name": repo_name,
	  "private": config.github.private_repos
	}, function(err, response){
		cb(err, response);
	}); 
}
function createGitHubHook(repo_name, cb){
	var gh_repo = gh_client.repo(config.github.account_name + '/' + repo_name);

	gh_repo.hook({
	  "name": "web",
	  "active": true,
	  "events": ["push", "status"],
	  "config": {
	    "url": config.server.url
	  }
	}, function(err, response){
		cb(err, response);
	}); 
}
function setConfig(set_gh){
  var home_dir = process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE,
  		conf_dir_path = home_dir + '/.conf',
  		config_path = home_dir + '/.conf/kestrel-config.json',
  		conf_dir_exists = fs.existsSync( conf_dir_path ),
  		config_exists = fs.existsSync( config_path );

  if (!conf_dir_exists) throw '~/.conf folder not found. Please run `swoop config`.'
  if (!config_exists) throw '~/.conf/kestrel-config.json not found. Please run `swoop config`.'

  config = config || require(config_path);
	if (set_gh){
		gh_client = gh_client || octonode.client(config.github.access_token);
		gh_entity = gh_entity || setGitHubOrgType(gh_client);
	}
	return config;
}
function initAll(){
	setConfig(true);
	var current_dir = path.basename(path.resolve('./'));
	kestrelInit(function(err0, stdout0, stderr1){
		if (err0){
			console.log( chalk.yellow('Step 1/4: Skipping. .kestrel folder already exists.') );
		} else {
			console.log(chalk.green('Step 1/4: `.kestrel` folder created!'));
		}

		gitInit(current_dir, function(err1, stdout, stderr){
			if (err1) {
				console.log(chalk.yellow('Step 2/4: Warning:') + ' Git remote origin already set. You should manually run ' + chalk.bold('git remote set-url origin ' + sh_commands.gitInit(config.github.login_method, config.github.account_name, current_dir).split('origin ')[1]) );
			} else {
				console.log(chalk.green('Step 2/4: Git init\'ed and origin set!'));
			} 
			
			createGitHubRepo(current_dir, function(err2, response){
				if (err2) { 
					console.log(chalk.red('Step 3/4: GitHub repo creation failed!') + ' `Validation Failed` could mean it already exists.' + '\nCheck here: ' + chalk.cyan('https://github.com/' + config.github.account_name + '/' + current_dir) + '\nStated reason:', err2.message);
				} else {
					console.log(chalk.green('Step 3/4: GitHub repo created!'));
				}

				createGitHubHook(current_dir, function(err3){
					if (err3) { 
						console.log(chalk.red('Step 4/4: GitHub hook creation failed!') + ' `Validation Failed` could mean it already exists.' + '\nCheck here: ' + chalk.cyan('https://github.com/' + config.github.account_name + '/' + current_dir + '/settings/hooks') + '\nStated reason:', err3.message); 
					} else {
						console.log(chalk.green('Step 4/4: GitHub hook created.') + ' Once you push you can preview it at:\n  ' + chalk.bold(config.server.url.split(':').slice(0,2).join(':') + ':3000/' + current_dir) );
					}
				});

			});
		});

	});
}


/*    D E P L O Y   C O M M A N D S   */
function checkGitStatus(gitStatus){
	gitStatus = gitStatus.trim();
	// These could also be `.indexOf` and avoid escaping
	var ahead_regex = new RegExp('ahead'),
			behind_regex = new RegExp('behind'),
			kestrel_init_regex = new RegExp('\.kestrel\/'),
			deploy_settings_regex = new RegExp('\.kestrel\/deploy-settings\.json'),
			git_status_lines = gitStatus.split('\n');

	// If it's just two lines and the second line describes a change to `.kestrel/deploy-settings.json` then we're okay.
	// It should also ignore the creation of the `.kestrel` folder
	if (git_status_lines.length == 2 && ( deploy_settings_regex.exec(git_status_lines[1]) || kestrel_init_regex.exec(git_status_lines[1])) ) return 'clean_with_deploy_change';
	// If the status has more than one line, we have uncommitted changes
	if (git_status_lines.length > 1) return 'uncommitted';
	// If the status has the word ahead and behind then we have to pull and push
	if (ahead_regex.exec(gitStatus) && behind_regex.exec(gitStatus)) return 'ahead_and_behind';
	// Allow for deployment if we are ahead
	if (ahead_regex.exec(gitStatus)) return 'clean';
	// if (ahead_regex.exec(gitStatus)) return 'ahead';
	// Don't allow for deployment if we are behind. This condition will rarely be triggered and will also be caught by git itself when your push fails
	if (behind_regex.exec(gitStatus)) return 'behind';
	return 'clean';
}

function deployLastCommit(bucket_environment, trigger_type, trigger, local_path, remote_path, when){
  setConfig(true);
	var current_dir = path.resolve('./');

	var trigger_commit_msg  = bucket_environment + '::' + trigger + '::' + local_path + '::' + remote_path + '::' + when;

	// Make sure the working branch has no outstanding commits and is neither ahead or behind
	// Normally outstanding commits wouldn't be a problem, but the push flag allows for an empty commit
	// So if we had untracked or uncommitted files, it would just push the last commit.
	child.exec( sh_commands.status(), function(err0, stdout0, stderr0){
		if (err0 !== null) throw stderr1;
		var branch_status = checkGitStatus(stdout0),
				push,
				erred_out = false,
				spawnPush = sh_commands.spawnPush();

		// If stdout is blank, we have nothing to commit
		if (branch_status == 'clean' || branch_status == 'clean_with_deploy_change') {
			// Add the trigger as a commit message and push
			console.log(chalk.bgBlue('Pushing to GitHub...'));
			child.exec( sh_commands.makeEmptyCommitMsg(trigger_commit_msg), function(err1, stdout1, stderr1){
				if (!err1){
					push = child.spawn( spawnPush[0], spawnPush[1], {stdio: 'inherit'} );
				} else {
					console.log(chalk.red('Error commiting!'));
				}

				// When done
				push.on('close', function(code){
					if (code != 0){
						// On error, erase the commit that has the trigger because the trigger push didn't go through
						child.exec( sh_commands.revertToPreviousCommit(), function(err2, stdout2, stderr2){
							if (err2) {
								console.log(chalk.red('Error pushing AND error scrubbing the push commit. You might want to grab the SHA of the last commit you made and run `git rest --soft INSERT-SHA-HERE` in order to manually remove Kestrel\'s deploy commit.'));
								console.log(chalk.yellow('Once you do that, please check our internet connection and try again'));
								throw stderr2 + '\nAND\n' + err2;
							} else {
								if (code == 128){
									console.log(chalk.red('Failed!'))
									console.log(chalk.yellow('Reason: Your internet connection appears down'));
								} else if (code == 1){
									console.log(chalk.red('Failed!'))
									console.log(chalk.yellow('Reason: Please pull before pushing.'));
								} else {
									console.log(chalk.red('Failed! Error code: ' + code.toString()), 'Try Googling this reason code to find out more.');
								}
							}
						});
					} else {
						// Otherwise, things went great!
						// Print the commands that got us to this auspicious moment.
						// Add a `_` for the `when` value because that needs to be one single string for the cli arg reader
						console.log(chalk.cyan('Settings: ') + 'swoop deploy -e ' + bucket_environment + ' -m ' + trigger_type + ' -l ' + local_path + ' -r ' + remote_path + ' -w ' + when.replace(' ', '_'));
						console.log(chalk.green('Push successful!'));
					}
				});
			});


		} else {
			if (branch_status == 'uncommitted') throw chalk.red('Error!') + chalk.yellow(' You have uncommitted changes on this branch.' + ' Please commit your changes before attempting to deploy.')
			if (branch_status == 'ahead_and_behind') throw chalk.red('Error!') + chalk.yellow(' You have unpushed commits on this branch and your local branch is behind your remote.' + ' Please pull and then push your changes before attempting to deploy.')
			// EDIT: It's okay if they haven't push their commits. Like the edit above to the scrub push, removing this step will result in fewer pushes for the server to respond to. This alert is currently not being triggered because the branch status no longer as a condition where it is set to ahead.
			// if (branch_status == 'ahead') throw chalk.red('Error!') + ' You have unpushed commits on this branch.' + ' Please push your changes before attempting to deploy.'.yellow;
			if (branch_status == 'behind') throw chalk.red('Error!') + chalk.yellow(' Your local branch is behind your remote.' + ' Please pull, merge and push before attempting to deploy.')
		}
	});
}

/*    C R E A T E  A R C H I V E  B R A N C H   */
function addToArchive(deploySettings){
	var local_branch = deploySettings.local_branch,
			remote_branch = deploySettings.remote_branch;

  setConfig(true);
  var repo_name = path.basename(path.resolve('./')),
  		archive_push = sh_commands.archive(config.github.login_method, config.github.account_name, config.archive.repo_name, local_branch, remote_branch);
	console.log(chalk.bgBlue('Pushing to GitHub...'));
	child.spawn( archive_push[0], archive_push[1], {stdio: 'inherit'} )
	  .on('close', function(code){
	  	if (code != 0){
				console.log(chalk.red('Archive failed. Error code: ' + code.toString()));
				if (code == 128){
					console.log(chalk.red('Reason: Your internet connection appears down'));
				}
	  	} else {
	  		console.log(chalk.green('Success!') + ' `' + local_branch + '` branch of `' + repo_name + '` archived as `' + remote_branch + '` on the `' + config.archive.repo_name + '` repo.\n  https://github.com/' + config.github.account_name + '/' + config.archive.repo_name + '/tree/' + remote_branch + '\n' + chalk.cyan('Note:') + ' Your existing repo has not been deleted. Please do that manually through GitHub:\n  https://github.com/' + config.github.account_name + '/' + repo_name + '/settings')
	  	}
	  })
}


function reportError(err, msg){
	console.log(msg, '\nReason:');
	throw err;
}

module.exports = {
	setConfig: setConfig,
	config: configClient,
	init: initAll,
	deploy: deployLastCommit,
	archive: addToArchive,
	unschedule: deployLastCommit
}
