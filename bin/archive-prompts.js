var path = require('path');
var sh = require('execSync');
// Get current year and repo name
var current_year = new Date().getFullYear(),
		repo_name = path.basename(path.resolve('./'));
// Grab the current branch
var branch = sh.exec('git rev-parse --abbrev-ref HEAD').stdout.trim();

console.log('branch')

module.exports = {
  "branches": prompt("What branch to archive and under what name?",  branch + ":" + current_year + '_' + repo_name )
 }