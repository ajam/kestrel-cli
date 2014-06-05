var path = require('path');
var repo_name = path.basename(path.resolve('./'));
var current_year = new Date().getFullYear();

module.exports = {
  "branches": prompt("What branch to archive and under what name?",  "master:" + current_year + '_' + repo_name )
 }