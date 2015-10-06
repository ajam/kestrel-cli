var path = require('path')
var _ = require('underscore')
var fs = require('fs')
var execSync = require('child_process').execSync
var sh_commands = require('../src/sh-commands.js')
var moment = require('moment-timezone')

var home_dir = process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE
var config_path = path.join(home_dir, '.conf', 'kestrel-config.json')

var config = require(config_path)
var repo_name = path.basename(path.resolve('./'))

function readDeploySettings(){
  var file_path_and_name = path.join(path.resolve('./'), '.kestrel', 'deploy-settings.json'),
      settings = {};
  if (fs.existsSync(file_path_and_name)){
    settings = require(file_path_and_name);
  }
  return settings;
}

function getLocalDeployDirChoices(){
  var dirs = execSync(sh_commands.listDirs()).toString().replace(/\//g, '').trim().split('\n');
  // Add repo-name
  var dirs_with_basename = dirs.map(function(dir){
    return repo_name + '/' + dir; // Don't use `path.join` for os-specific paths because it needs to be the linux path for the server
  })
  return [repo_name].concat(dirs_with_basename);
}

function getConfigRemotePath(){
  var remote_path = config.publishing.remote_path
  if (config.publishing.isMomentTemplate) {
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
    type: 'password',
    name: 'trigger',
    message: 'Enter the trigger:'
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
    message: 'When? e.g. `2015-01-01 14:00`',
    default: default_deploy.when,
    filter: function(val){
      return val.trim()
    }
  }
]

module.exports = questions;