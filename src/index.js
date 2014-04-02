var octonode = require('octonode'),
		path     = require('path'),
		sh       = require('execSync');

var config  = require('../config.json');

// Github authentication
var gh_client = octonode.client(config.github.access_token),
		gh_entity = setGitHubOrgType(gh_client);

/*    I N I T  C O M M A N D S   */
function configClient(){

}

/*    C R E A T I O N  C O M M A N D S   */
function setGitHubOrgType(gh_c){
	if (config.github.type == 'org'){
		return gh_c.org(config.github.account)
	} else if (config.github.type == 'individual'){
		return gh_c.me()
	}
}
function gitInit(current_dir, cb){
	var git_init  = sh.run('git init && git remote add origin https://github.com/' + config.github.account + '/' + current_dir + '.git');
}
function createGitHubRepo(repo_name, cb){
	gh_entity.repo({
	  "name": repo_name,
	  "private": config.github.private_repos
	}, function(err, response){
		cb(err, response)
	}); 
}
function createGitHubHook(repo_name, cb){
	var gh_repo = gh_client.repo(config.github.account + '/' + repo_name);

	gh_repo.hook({
	  "name": "web",
	  "active": true,
	  "events": ["push", "status"],
	  "config": {
	    "url": config.server.url
	  }
	}, function(err, response){
		cb(err, response)
	}); 
}
function initAll(){
	var current_dir = path.basename(path.resolve('./'));
	gitInit(current_dir);

	createGitHubRepo(current_dir, function(err){
		if (err) reportError(err, 'GitHub repo creation failed!');
		console.log('GitHub repo created...')

		createGitHubHook(current_dir, function(err){
			if (err) reportError(err, 'GitHub hook failed');
			console.log('GitHub hook created. Preview at ' + config.server.url.split(':')[0] + ':3000/' + current_dir);
		});

	});
}


function reportError(err, msg){
	throw new Error(err);
	console.log(msg);
}

module.exports = {
	config: configClient,
	init: initAll
}