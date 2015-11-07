var path     = require('path');
var fs       = require('fs');
var execSync = require('child_process').execSync;
var sh_commands = require('../src/sh-commands.js');
var _ = require('underscore')
var io = require('indian-ocean')

// Get current year and repo name
var current_year = new Date().getFullYear(),
		current_month = new Date().getMonth() + 1,
		project_dir = path.resolve('./'),
		repo_name = path.basename(project_dir),
		name_delimiter = '_';

// Zero pad months below 10
if (current_month < 10){
	current_month = '0' + current_month.toString();
}

// Try and extract the pub year and month from `.kestrel/deploy-settings.json`. Fall back to the vals above if unsuccessful
var deploy_settings = readDeploySettings()
var deployed_remote_settings;

if (deploy_settings && deploy_settings.remote_path){
	deployed_remote_settings = deploy_settings.remote_path.replace(/\//g, name_delimiter) // The convention we use is `YYYY_MM_REPONAME`. `2014/05/test-kestrel` => 2014_05_test-kestrel
} else {
	deployed_remote_settings = [current_year, current_month, repo_name].join(name_delimiter)
}

// Grab the current branch
// var branch = execSync('git rev-parse --abbrev-ref HEAD').toString().trim();

var current_branch = execSyncClean(sh_commands.getCurrentBranch())
var branches = execSyncClean(sh_commands.getLocalBranches()).replace('*', '').split('\n').map(function(str){ return str.trim() })
var branches_sans_current = _.without(branches, current_branch)

// Put the current branch first
var all_branches = [current_branch].concat(branches_sans_current)

var questions = [
  {
    type: 'list',
    name: 'local_branch',
    message: 'What local branch to archive?',
    choices: all_branches
  },{
    type: 'input',
    name: 'remote_branch',
    message: 'What to call it on the archive repo?',
    // If our selected branch is not `master`, then prepopulate the remote branch name with that string, preceeded by a doubling of our delimiter
    // So a normal branch is `2014_05_test-kestrel
    // Any other branch is `2015_05_test-kestrel__other-branch-name`
    default: function(){
      var self = questions[1];
      if (self.selected_local_branch !== 'master'){
        deployed_remote_settings += name_delimiter + name_delimiter + self.selected_local_branch;
      }
      return deployed_remote_settings
    },
    // Set this up as a way to pass input
    when: function(answers){
      var self = questions[1];
      self.selected_local_branch = answers.local_branch
      return true
    },
    filter: function(val){
      return val.trim()
    }
  }
]

function readDeploySettings(){
  var file_path_and_name = path.join(project_dir, '.kestrel', 'deploy-settings.json'),
      settings = {};
  if (io.existsSync(file_path_and_name)){
    settings = require(file_path_and_name);
  }
  return settings;
}


function execSyncClean(str){
  return execSync(str).toString().trim()
}

module.exports = questions;