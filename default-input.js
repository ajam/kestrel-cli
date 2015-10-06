function checkJson(str) {
    try {
      JSON.parse(str);
    } catch (e) {
      return false;
    }
    return true;
}

exports.github      = {};
exports.server      = {};
exports.archive     = {};
exports.publishing  = {};

exports.github.type           = prompt('GitHub account type', package.github.type);
exports.github.account_name   = prompt('Account name', package.github.account_name);
exports.github.access_token   = prompt('Github access token', package.github.access_token);
exports.github.login_method   = prompt('Connect to GitHub with https or ssh?', package.github.login_method);
exports.github.private_repos  = prompt('Create private repos by default?', String(package.github.private_repos), function(repos){
  var isJson = checkJson(repos);
  if (!isJson) console.error('ERROR: Please enter either true or false.');
  
  repos = JSON.parse(repos);
  return repos;
});

exports.server.url                 = prompt('Kestrel server url:port', package.server.url);
exports.server.sync_deploy_trigger = prompt('Sync trigger', package.server.sync_deploy_trigger);
exports.server.hard_deploy = {};

var hard_trigger_enabled;
exports.server.hard_deploy.enabled = prompt('Enable hard trigger?', String(package.server.hard_deploy.enabled), function(enabled){
  var isJson = checkJson(enabled);
  if (!isJson) console.error('ERROR: Please enter either true or false.');
  
  enabled = hard_trigger_enabled = JSON.parse(enabled);
  return enabled;
});

exports.server.hard_deploy.trigger = function(cb){
  response = null;
  if (hard_trigger_enabled) response = prompt('Hard trigger', package.server.hard_deploy.trigger);
  cb(null, response);
};

exports.publishing.remote_path = prompt('Default S3 folder to publish into', package.publishing.remote_path);
var is_moment_template = package.publishing.is_moment_template || false
exports.publishing.is_moment_template = prompt('Is the remote path a date template?', String(is_moment_template), function(isMoment){
  var isJson = checkJson(isMoment);
  if (!isJson) console.error('ERROR: Please enter either true or false.');
  
  isMoment = JSON.parse(isMoment);
  return isMoment;
});

exports.archive.repo_name = prompt('Optional archive repo name', package.archive.repo_name);

exports.timezone = prompt('What timezone are you in?', package.timezone);