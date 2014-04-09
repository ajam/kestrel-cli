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

exports.github.type           = prompt('GitHub account type', package.github.type);
exports.github.account        = prompt('Account name', package.github.account);
exports.github.access_token   = prompt('Github access token', package.github.access_token);
exports.github.private_repos  = prompt('Create private repos by default?', String(package.github.private_repos), function(repos){
  var isJson = checkJson(repos);
  if (!isJson) console.error('ERROR: Please enter either true or false.');
  
  repos = JSON.parse(repos);
  return repos;
});

exports.server.url                 = prompt('Snowy Owl server url:port', package.server.url);
exports.server.sync_deploy_trigger = prompt('Sync trigger', package.server.sync_trigger);
exports.server.hard_deploy = {};

var hard_trigger_enabled;
exports.server.hard_deploy.enabled = prompt('Enable hard trigger?', String(package.server.hard_deploy.enabled), function(enabled){
  var isJson = checkJson(enabled);
  if (!isJson) console.error('ERROR: Please enter either true or false.');
  
  enabled = hard_trigger_enabled = JSON.parse(enabled);
  return enabled;
})

exports.server.hard_deploy.trigger = function(cb){
  response = null;
  if (hard_trigger_enabled) response = prompt('Hard trigger', package.server.hard_deploy.trigger);
  cb(null, response);
}

var archive_enabled;
exports.archive.enabled = prompt('Enable archiving?', String(package.archive.enabled), function(enabled){
  var isJson = checkJson(enabled);
  if (!isJson) console.error('ERROR: Please enter either true or false.');

  enabled = archive_enabled = JSON.parse(enabled);
  return enabled;
})

exports.archive.type = function(cb){
  response = null;
  if (archive_enabled) response = prompt('Account type', package.archive.type);
  cb(null, response);
}
exports.archive.account_name = function(cb){
  response = null;
  if (archive_enabled) response = prompt('Account name');
  cb(null, response);
}
exports.archive.access_token = function(cb){
  response = null;
  if (archive_enabled) response = prompt('Access token');
  cb(null, response);
}
