var path        = require('path');
var _           = require('underscore');
var fs          = require('fs');
var io          = require('indian-ocean');
var execSync    = require('child_process').execSync;
var sh_commands = require('../src/sh-commands.js');
var moment      = require('moment-timezone');
var Promise     = require('promise');

var home_dir = process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE;
var config_path = path.join(home_dir, '.conf', 'kestrel-config.json');
var config = require(config_path);

var PROJECT_PATH = path.resolve('.');
var LOCAL_FOLDER = path.basename(PROJECT_PATH);

function readDeploySettings(){
  var file_path_and_name = path.join(PROJECT_PATH, '.kestrel', 'deploy-settings.json'),
      settings = {};
  if (io.existsSync(file_path_and_name)){
    settings = require(file_path_and_name);
  }
  return settings;
}

function getDirectories(srcpath, opts) {
  return fs.readdirSync(srcpath).filter(function(file) {
    var is_directory = fs.statSync(path.join(srcpath, file)).isDirectory()
    // Test for folders that start with a dot
    if (is_directory && opts.excludeHidden) {
      is_directory = !/^\./.test(file)
    }
    return is_directory;
  });
}

function getLocalDeployDirChoices(){
  var dirs = getDirectories(PROJECT_PATH, {excludeHidden: true})

  // Add repo-name
  var dirs_with_basename = dirs.map(function(dir){
    return LOCAL_FOLDER + '/' + dir // Kestrel server will run with `/` file paths for Linux
  })
  var all_dirs = [LOCAL_FOLDER].concat(dirs_with_basename);
  // If we have a dir that we deployed to that isn't in our list, then it was a sub-dir, so give that as the first choice
  if (!_.contains(all_dirs, default_deploy.local_path) ) {
    all_dirs = [default_deploy.local_path].concat(all_dirs)
  }

  return all_dirs

}

function getConfigRemotePath(){
  var remote_path = config.publishing.remote_path
  if (config.publishing.is_moment_template) {
    remote_path = moment().format(remote_path)
  }
  return remote_path
}

var default_deploy = {
  bucket_environment: 'staging',
  trigger_type: 'sync',
  local_path: './',
  remote_path: getConfigRemotePath() + '/' + LOCAL_FOLDER,
  when: 'now'
};

_.extend(default_deploy, readDeploySettings());


var local_deploy_dir_choices = getLocalDeployDirChoices()

var questions = [
  {
    type: 'list',
    name: 'bucket_environment',
    message: 'Deploy to which environment?',
    choices: ['staging', 'prod'],
    default: default_deploy.bucket_environment
  },{
    type: 'list',
    name: 'trigger_type',
    message: 'Deploy method?',
    choices: function(){
      var choices = ['sync']
      if (config.server.hard_deploy.enabled) {
        choices.push('hard')
      }
      return choices
    },
    default: default_deploy.trigger_type
  },{
    type: 'list-input',
    name: 'local_path',
    message: 'Deploy from directory:',
    choices: local_deploy_dir_choices,
    default: default_deploy.local_path
  },{
    type: 'input',
    name: 'remote_path',
    message: 'Deploy to:',
    default: default_deploy.remote_path,
    filter: function(val){
      return val.trim()
    }
  },{
    type: 'input',
    name: 'when',
    message: 'When? e.g. 2015-01-01 14:00',
    default: default_deploy.when,
    filter: function(val){
      return val.trim()
    }
  },{
    type: 'password',
    name: 'trigger',
    message: 'Enter the trigger:'
  }
]

module.exports = questions;