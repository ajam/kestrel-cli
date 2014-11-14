var path = require('path');

var home_dir = process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE,
		config_path = home_dir + '/.conf/kestrel-config.json';

var config = require(config_path),
		repo_name = path.basename(path.resolve('./'));

module.exports = {
  "bucket_environment": prompt("Deploy to `staging` or `prod`?", "staging"),
  "trigger_type": prompt("Deploy method (sync/hard)?", "sync"),
  "trigger": prompt("Trigger?"),
  "local_path": prompt("Deploy directory... e.g. `" + repo_name + "/output`", repo_name),
  "remote_path": prompt("to directory... e.g. `" + config.publishing.remote_path + "/" + repo_name + "/audio`", config.publishing.remote_path + "/" + repo_name),
  "when": prompt("When? e.g. `1970-01-01 13:00`", "now", function(response){
  	return response.trim();
  })
 }