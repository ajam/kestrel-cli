var path        = require('path');
var _           = require('underscore');
var fs          = require('fs');
var io          = require('indian-ocean');
var execSync    = require('child_process').execSync;
var sh_commands = require('../src/sh-commands.js');
var moment      = require('moment-timezone');

var home_dir = process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE;
var config_path = path.join(home_dir, '.conf', 'kestrel-config.json');

var project_dir = path.resolve('./');
var config = require(config_path);
var repo_name = path.basename(project_dir);

function readDeploySettings(){
  var file_path_and_name = path.join(project_dir, '.kestrel', 'deploy-settings.json'),
      settings = {};
  if (fs.existsSync(file_path_and_name)){
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
  var dirs = getDirectories(project_dir, {excludeHidden: true})

  // Add repo-name
  var dirs_with_basename = dirs.map(function(dir){
    return repo_name + '/' + dir; // Don't use `path.join` for os-specific paths because it needs to be the linux path for the server
  })
  return [repo_name].concat(dirs_with_basename);
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
  local_path: repo_name,
  remote_path: getConfigRemotePath() + '/' + repo_name,
  when: 'now'
};

_.extend(default_deploy, readDeploySettings());

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
    choices: ['sync', 'hard'],
    default: default_deploy.trigger_type
  },{
    type: 'list',
    name: 'local_path',
    message: 'Deploy from directory:',
    choices: getLocalDeployDirChoices(),
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