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
	pkg_config.sprout(dir);
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
function setConfig(){
  config  = config || require('../config.json');
	gh_client = gh_client || octonode.client(config.github.access_token);
	gh_entity = gh_entity || setGitHubOrgType(gh_client);
}
function initAll(){
	setConfig();
	var current_dir = path.basename(path.resolve('./'));
	gitInit(current_dir, function(err1, stdout, stderr){
		(err1) ? console.log('Step 1/3: Warning:'.yellow + ' Git remote origin already set. You should manually run `' + 'git remote set-url origin ' + sh_commands.init(config.github.login_method, config.github.account_name, current_dir).split('origin ')[1] + '`') : console.log('Step 1/3: Git init\'ed and origin set!'.green);
		
		createGitHubRepo(current_dir, function(err2, response){
			(err2) ? console.log('Step 2/3: GitHub repo creation failed!'.red + ' `Validation Failed` could mean it already exists.'.yellow, '\nStated reason:', err2.message) : console.log('Step 2/3: GitHub repo created!'.green);
			
			createGitHubHook(current_dir, function(err3){
				(err3) ? console.log('Step 3/3: GitHub hook creation failed!'.red + ' `Validation Failed` could mean it already exists.'.yellow, '\nStated reason:', err3.message) : console.log('Step 3/3: GitHub hook created.'.green + ' Once you push you can preview it at:\n  ' + config.server.url.split(':').slice(0,2).join(':') + ':3000/' + current_dir);
			});

		});
	});
}

function initHook(){
	setConfig();
	var current_dir = path.basename(path.resolve('./'));
	createGitHubHook(current_dir, function(err){
		if (err) reportError(err, 'Step 1/1: GitHub hook failed'.red);
		console.log('Step 1/1: GitHub hook created.'.green + ' Once you push you can preview it at:\n  ' + config.server.url.split(':').slice(0,2).join(':') + ':3000/' + current_dir);
	});
}

/*    C R E A T I O N  C O M M A N D S   */
function deployLastCommit(trigger_type, trigger, sub_dir_path){
	var current_dir         = path.resolve('./'),
			sub_dir_path        = sub_dir_path || '',
			trigger_commit_msg  = trigger + '::' + sub_dir_path,
			scrubbed_commit_msg = '::published:' + trigger_type + '::';

	// Add the trigger as a commit message and push
	child.exec( sh_commands.deployLastCommit(current_dir, trigger_commit_msg), function(error, stdout, stderr){
		if (error !== null) throw stderr;
		console.log('Push successful!'.green, stdout.trim());

		// Replace the trigger in the commit message with a scrubbed message saying that it was published and with what message
		child.exec( sh_commands.scrubLastCommit(current_dir, scrubbed_commit_msg), function(err, stdo, stdr){
			if (err !== null) throw stdr;
			console.log('Scrub push successful!'.green, stdo.trim());
		});
	});
}

/*    C R E A T E  A R C H I V E  B R A N C H   */
function addToArchive(branches){
  config = config || require('../config.json');
  var repo_name = path.basename(path.resolve('./'));
	child.exec( sh_commands.archive(config.github.login_method, config.github.account_name, config.archive.repo_name, branches), function(err, stdout, stderr){
		(err) ? console.log('Archive failed!'.red, 'Stated reason:' + err.message) : console.log('Success!'.green + ' `' + branches.split(':')[0] + '` branch of `' + repo_name + ' `archived as `' + branches.split(':')[1] + '` on the `' + config.archive.repo_name + '` repo.\n  https://github.com/' + config.archive.repo_name + '/archive/tree/' + branches.split(':')[1] + '\n' + 'Note:'.yellow + ' Your existing repo has not been deleted. Please do that manually through GitHub:\n  https://github.com/ajam/' + repo_name + '/settings')
	});

}

function reportError(err, msg){
	console.log(msg, '\nReason:');
	throw err;
}

module.exports = {
	config: configClient,
	init: initAll,
	deploy: deployLastCommit,
	hook: initHook,
	archive: addToArchive
}