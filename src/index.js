var fs          = require('fs'),
		octonode    = require('octonode'),
		path        = require('path'),
		child       = require('child_process'),
		pkg_config  = require('config-tree');

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
	gitInit(current_dir, function(error, stdout, stderr){
		(error !== null) ? console.error(stderr): console.log('1/1 Git init\'ed and origin set');
		createGitHubRepo(current_dir, function(err){
			if (err) reportError(err, 'GitHub repo creation failed!');
			console.log('1/2 GitHub repo created!');

			createGitHubHook(current_dir, function(err){
				if (err) reportError(err, 'GitHub hook failed');
				console.log('2/2 GitHub hook created. Once you push you can preview it at:\n\t' + config.server.url.split(':').slice(0,2).join(':') + ':3000/' + current_dir);
			});

		});
	});
}

function initHook(){
	setConfig();
	var current_dir = path.basename(path.resolve('./'));
	createGitHubHook(current_dir, function(err){
		if (err) reportError(err, 'GitHub hook failed');
		console.log('GitHub hook created. Preview at ' + config.server.url.split(':')[0] + ':3000/' + current_dir);
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
		console.log('Push successful!', stdout.trim());

		// Replace the trigger in the commit message with a scrubbed message saying that it was published and with what message
		child.exec( sh_commands.scrubLastCommit(current_dir, scrubbed_commit_msg), function(err, stdo, stdr){
			if (err !== null) throw stdr;
			console.log('Scrub push successful!', stdo.trim());
		});
	});
}

/*    C R E A T E  A R C H I V E  B R A N C H   */
function addToArchive(branches){
	child.exec( sh_commands.archive(config.github.login_method, config.github.account_name, config.archive.repo_name, branches), function(err, stdout, stderr){
		console.log('Archive to ' + config.archive.repo_name + ' / ' + branches.split(':')[1] + 'successful!')
	});

}

function reportError(err, msg){
	throw err;
	console.log(msg);
}

module.exports = {
	config: configClient,
	init: initAll,
	deploy: deployLastCommit,
	hook: initHook,
	archive: addToArchive
}