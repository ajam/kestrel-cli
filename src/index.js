var fs          = require('fs'),
		octonode    = require('octonode'),
		path        = require('path'),
		child       = require('child_process'),
		pkg_config  = require('config-tree'),
		colors			= require('colors');

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
function gitInit(current_dir, cb){
	child.exec( sh_commands.init(config.github.login_method, config.github.account_name, current_dir), cb );
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
	gitInit(current_dir, function(err1, stdout, stderr){
		if (err1) {
			console.log('Step 1/3: Warning:'.yellow + ' Git remote origin already set. You should manually run `' + 'git remote set-url origin '.yellow + sh_commands.init(config.github.login_method, config.github.account_name, current_dir).split('origin ')[1].yellow + '`');
		} else {
			console.log('Step 1/3: Git init\'ed and origin set!'.green);
		} 
		
		createGitHubRepo(current_dir, function(err2, response){
			if (err2) { 
				console.log('Step 2/3: GitHub repo creation failed!'.red + ' `Validation Failed` could mean it already exists.'.yellow + '\nCheck here: ' + 'https://github.com/'.cyan+config.github.account_name.cyan+'/'.cyan+current_dir.cyan+'\nStated reason:', err2.message);
			} else {
				console.log('Step 2/3: GitHub repo created!'.green);
			}
			createGitHubHook(current_dir, function(err3){
				if (err3) { 
					console.log('Step 3/3: GitHub hook creation failed!'.red + ' `Validation Failed` could mean it already exists.'.yellow + '\nCheck here: ' + 'https://github.com/'.cyan+config.github.account_name.cyan+'/'.cyan+current_dir.cyan+'/settings/hooks'.cyan+'\nStated reason:', err3.message); 
				} else {
					console.log('Step 3/3: GitHub hook created.'.green + ' Once you push you can preview it at:\n  ' + config.server.url.split(':').slice(0,2).join(':') + ':3000/' + current_dir);
				}
			});

		});
	});
}

function initHook(){
	setConfig(true);
	var current_dir = path.basename(path.resolve('./'));
	createGitHubHook(current_dir, function(err){
		(err) ? console.log('Step 1/1: GitHub hook creation failed!'.red + ' `Validation Failed` could mean it already exists.'.yellow + '\nCheck here: ' + 'https://github.com/'.cyan+config.github.account_name.cyan+'/'.cyan+current_dir.cyan+'/settings/hooks'.cyan+'\nStated reason:', err.message) : console.log('Step 1/1: GitHub hook created.'.green + ' Once you push you can preview it at:\n  ' + config.server.url.split(':').slice(0,2).join(':') + ':3000/' + current_dir);
	});
}


/*    D E P L O Y   C O M M A N D S   */
function checkGitStatus(gitStatus){
	gitStatus = gitStatus.trim();
	var ahead_regex = new RegExp('ahead'),
			behind_regex = new RegExp('behind');

	// If the status has more than one line, we have uncommitted changes
	if (gitStatus.split('\n').length > 1) return 'uncommitted';
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
	var current_dir   = path.resolve('./');

	var trigger_commit_msg  = bucket_environment + '::' + trigger + '::' + local_path + '::' + remote_path + '::' + when.replace(/ /g,'T');

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
		if (branch_status == 'clean') {
			// Add the trigger as a commit message and push
			console.log('Pushing to GitHub...'.blue.inverse);
			child.exec( sh_commands.makeEmptyCommitMsg(trigger_commit_msg), function(err1, stdout1, stderr1){
				if (!err1){
					push = child.spawn( spawnPush[0], spawnPush[1], {stdio: 'inherit'} );
				} else {
					console.log('Error commiting!'.red);
				}

				// When done
				push.on('close', function(code){
					if (code != 0){
						// On error, erase the commit that has the trigger because the trigger push didn't go through
						child.exec( sh_commands.revertToPreviousCommit(), function(err2, stdout2, stderr2){
							if (err2) {
								console.log('Error pushing AND error scrubbing the push commit. You might want to grab the SHA of the last commit you made and run `git rest --soft INSERT-SHA-HERE` in order to manually remove Kestrel\'s deploy commit.'.red);
								console.log('Once you do that, please check our internet connection and try again'.yellow);
								throw stderr2 + '\nAND\n' + err2;
							} else {
								console.log('Push failed. Please try again. Error code: '.red + code.toString().red);
								console.log('If your error is 128, `fatal: unable to access` your internet connection might simply be down.'.yellow);
							}
						});
					} else {
						// Otherwise, things went great!
						console.log('Push successful!'.green);
					}
				});
			});


		} else {
			if (branch_status == 'uncommitted') throw 'Error!'.red + ' You have uncommitted changes on this branch.' + ' Please commit your changes before attempting to deploy.'.yellow;
			if (branch_status == 'ahead_and_behind') throw 'Error'.red + ' You have unpushed commits on this branch and your local branch is behind your remote.' + ' Please pull and then push your changes before attempting to deploy.'.yellow;
			// EDIT: It's okay if they haven't push their commits. Like the edit above to the scrub push, removing this step will result in fewer pushes for the server to respond to. This alert is currently not being triggered because the branch status no longer as a condition where it is set to ahead.
			// if (branch_status == 'ahead') throw 'Error!'.red + ' You have unpushed commits on this branch.' + ' Please push your changes before attempting to deploy.'.yellow;
			if (branch_status == 'behind') throw 'Error!'.red + ' Your local branch is behind your remote.' + ' Please pull, merge and push before attempting to deploy.'.yellow;
		}
	});
}

/*    C R E A T E  A R C H I V E  B R A N C H   */
function addToArchive(branches){
  setConfig(true);
  var repo_name = path.basename(path.resolve('./')),
  		archive_push = sh_commands.archive(config.github.login_method, config.github.account_name, config.archive.repo_name, branches);
	console.log('Pushing to GitHub...'.blue.inverse);
	child.spawn( archive_push[0], archive_push[1], {stdio: 'inherit'} )
	  .on('close', function(code){
	  	if (code != 0){
				console.log('Archive failed. Please try again. Error code: '.red + code.toString().red);
				console.log('If your error is 128, `fatal: unable to access` your internet connection might simply be down.'.yellow);
	  	} else {
	  		console.log('Success!'.green + ' `' + branches.split(':')[0] + '` branch of `' + repo_name + '` archived as `' + branches.split(':')[1] + '` on the `' + config.archive.repo_name + '` repo.\n  https://github.com/' + config.github.account_name + '/' + config.archive.repo_name + '/tree/' + branches.split(':')[1] + '\n' + 'Note:'.cyan + ' Your existing repo has not been deleted. Please do that manually through GitHub:\n  https://github.com/' + config.github.account_name + '/' + repo_name + '/settings')
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
	hook: initHook,
	archive: addToArchive,
	unschedule: deployLastCommit
}
