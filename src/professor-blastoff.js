var fs      = require('fs'),
		request = require('request'),
		path    = require('path'),
		child   = require('child_process');

var config  = require('../config.json');

function gitInit(cb){
	var git_init  = child.exed('git init && git remote set-url origin https://github.com/' + config.github_account + '/' + current_dir + '.git', function(error, stdout){
		if (error) cb(error);
		cb(null)
	});
}

function createGitHubRepo(repo_name, cb){
	var endpoints = {
		org: function(org_name){
			return '/orgs/'+org_name+'/repos'
		},
		individual: function(){
			return '/user/repos'
		}
	}

	request.post(
		'https://api.github.com/' + endpoints[config.github.type](config.github.account) + '?access_token=' + config.github.access_token, 
		{ 
			form: {
				name: repo_name,
				private: true
			}
		},
		function (error, response, body) {
		  if (error || response.statusCode != 200) cb(error);
	  	cb(null);
	})
}

function createGitHubHook(repo_name, cb){
	request.post(
		'https://api.github.com/repos/' + config.github.account + '/' + repo_name + '/hooks?access_token=' + config.github.access_token, 
		{ 
			form: {
				name: "web",
				config: {
					url: config.professor_blastoff_server.url
				},
			  active: true,
			  events: ["push", "status"]
			}
		},
		function (error, response, body) {
		  if (error || response.statusCode != 200) cb(error);
	  	cb(null);
	})
}

function initAll(){
	var current_dir = path.basename(path.resolve('./'));
	gitInit(function(err){
		if (err) reportError(err, 'Git init failed.');
		return true;
	});

	createGitHubRepo(current_dir, function(err){
		if (err) reportError(err, 'GitHub repo creation failed');

		createGitHubHook(current_dir, function(err){
			if (err) reportError(err, 'GitHub hook failed');
			return true;
		});

		return true;
	});


}

function reportError(error, msg){
	console.log(error);
	return throw new Error(msg)
}

module.exports = {
	init: initAll
}