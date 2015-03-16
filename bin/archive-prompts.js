var path 		= require('path');
var execSync = require('child_process').execSync;
// Get current year and repo name
var current_year = new Date().getFullYear(),
		repo_name = path.basename(path.resolve('./'));

// Grab the current branch
var branch = execSync('git rev-parse --abbrev-ref HEAD').toString().trim();

var prompts = {
  "branches": prompt("What branch to archive and under what name?",  branch + ":" + current_year + '_' + repo_name )
};

// Add what we've set through flags
_.extend(prompts, this.flaggedSettings);

module.exports = prompts;