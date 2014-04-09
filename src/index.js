var fs          = require('fs'),
		octonode    = require('octonode'),
		path        = require('path'),
		child       = require('child_process'),
		pkg_config  = require('config-tree');

// Github authentication
var config,
		gh_client,
		gh_entity;

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
	child.exec('git init && git remote add origin https://github.com/' + config.github.account_name + '/' + current_dir + '.git', cb);
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
		if (error !== null) throw stderr;
		createGitHubRepo(current_dir, function(err){
			if (err) reportError(err, 'GitHub repo creation failed!');
			console.log('GitHub repo created...');

			createGitHubHook(current_dir, function(err){
				if (err) reportError(err, 'GitHub hook failed');
				console.log('GitHub hook created. Preview at ' + config.server.url.split(':')[0] + ':3000/' + current_dir);
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
function deployLastCommit(trigger_type, trigger){
	var current_dir         = path.resolve('./'),
			new_commit_msg      = trigger,
			scrubbed_commit_msg = '::published:' + trigger_type + '::';

	// Add the trigger as a commit message and push
	child.exec('cd ' + current_dir + ' && git commit -m "' + new_commit_msg + '" --allow-empty && git push origin master', function(error, stdout, stderr){
		if (error !== null) throw stderr;
		console.log('Push successful!', stdout.trim());

		// Replace the trigger in the commit message with a scrubbed message saying that it was published and with what message
		child.exec('cd ' + current_dir + ' && git commit --amend -m "' + scrubbed_commit_msg + '" --allow-empty && git push origin master -f', function(err, stdo, stdr){
			if (err !== null) throw stdr;
			console.log('Scrub push successful!', stdo.trim());
		});
	});
}

function reportError(err, msg){
	throw new Error(err);
	console.log(msg);
}

module.exports = {
	config: configClient,
	init: initAll,
	deploy: deployLastCommit,
	hook: initHook
}