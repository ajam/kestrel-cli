var path     = require('path');
var fs       = require('fs');
var execSync = require('child_process').execSync;

// Get current year and repo name
var current_year = new Date().getFullYear(),
		current_month = new Date().getMonth() + 1,
		repo_path = path.resolve('./'),
		repo_name = path.basename(repo_path),
		name_delimiter = '_';

// Zero pad months below 10
if (current_month < 10){
	current_month = '0' + current_month.toString();
}

// Try and extract the pub year and month from `.kestrel/deploy-settings.json`. Fall back to the vals above if unsuccessful
var deploy_settings = JSON.parse(fs.readFileSync(path.join(repo_path, '.kestrel','deploy-settings.json'), 'utf-8'));
var deployed_remote_settings;

if (deploy_settings && deploy_settings.remote_path){
	deployed_remote_settings = deploy_settings.remote_path.replace(/\//g, name_delimiter) // The convention we use is `YYYY_MM_REPONAME`. `2014/05/test-kestrel` => 2014_05_test-kestrel
} else {
	deployed_remote_settings = [current_year, current_month, repo_name].join(name_delimiter)
}

// Grab the current branch
var branch = execSync('git rev-parse --abbrev-ref HEAD').toString().trim();

// If our selected branch is not `master`, then prepopulate the remote branch name with that string, preceeded by a doubling of our delimiter
// So a normal branch is `2014_05_test-kestrel
// Any other branch is `2015_05_test-kestrel__other-branch-name`
var local_branch_name;
var prompts = {
  "local_branch": prompt("What local branch to archive?",  branch , function(inputtedBranch){
  	local_branch_name = inputtedBranch;
  	return inputtedBranch;
  }),
  "remote_branch": function(cb){
  	if (local_branch_name !== 'master'){
  		deployed_remote_settings += name_delimiter + name_delimiter + local_branch_name;
  	}

	  var response = prompt("What to call it on the archive repo?", deployed_remote_settings );
	  cb(null, response);
  }
};

// Add what we've set through flags
_.extend(prompts, this.flaggedSettings);

module.exports = prompts;