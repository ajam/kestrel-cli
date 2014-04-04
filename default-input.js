exports.github  = {}
exports.server  = {}
exports.archive = {}

exports.github.type           = prompt('GitHub account type', package.github.type)
exports.github.account        = prompt('Account name', package.github.account)
exports.github.access_token   = prompt('Github access token', package.github.access_token)
exports.github.private_repos  = prompt('Create private repos by default?', String(package.github.private_repos), function(repos){
  if (repos === "false") repos = false
  if (repos === "true")  repos = true
  return repos
});

exports.server.url = prompt('Snowy Owl server url:port', package.server.url)

var archive_enabled;
exports.archive.enabled = prompt('Enable archiving', String(package.archive.enabled), function(enabled){
  if (enabled === "false") enabled = false
  if (enabled === "true")  enabled = true
  archive_enabled = enabled
  return enabled
})

exports.archive.type = function(cb){
  response = null
  if (archive_enabled) response = prompt('Account type', package.archive.type)
  cb(null, response)
}
exports.archive.account_name = function(cb){
  response = null
  if (archive_enabled) response = prompt('Account name')
  cb(null, response)
}
exports.archive.access_token = function(cb){
  response = null
  if (archive_enabled) response = prompt('Access token')
  cb(null, response)
}
