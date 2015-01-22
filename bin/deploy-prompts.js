var path = require('path'),
    _ = require('underscore'),
    fs = require('fs');

var home_dir = process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE,
		config_path = home_dir + '/.conf/kestrel-config.json';

var config = require(config_path),
		repo_name = path.basename(path.resolve('./'));


function readDeploySettings(){
  var file_path_and_name = path.resolve('./') + '/.kestrel/deploy-settings.json',
      settings = {};
  if (fs.existsSync(file_path_and_name)){
    settings = require(file_path_and_name);
  }
  return settings;
}

var default_deploy = {
  bucket_environment: 'staging',
  trigger_type: 'sync',
  local_path: repo_name,
  remote_path: config.publishing.remote_path + "/" + repo_name,
  when: 'now'
}

_.extend(default_deploy, readDeploySettings());

var prompts = {
  "bucket_environment": prompt("Deploy to `staging` or `prod`?", default_deploy.bucket_environment),
  "trigger_type": prompt("Deploy method (sync/hard)?", default_deploy.trigger_type),
  "trigger": prompt("Trigger?"),
  "local_path": prompt("Deploy from directory", default_deploy.local_path),
  "remote_path": prompt("to directory", default_deploy.remote_path),
  "when": prompt("When? e.g. `2015-01-01 14:00`", default_deploy.when, function(response){
    return response.trim();
  })
 };

// Add what we've set through flags
_.extend(prompts, this.flaggedSettings);

module.exports = prompts;