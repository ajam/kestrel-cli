// var path = require('path');

// var home_dir = process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE,
// 		config_path = home_dir + '/.conf/kestrel-config.json';

// var config = require(config_path),
// 		repo_name = path.basename(path.resolve('./'));

module.exports = {
  "bucket_environment": prompt("Unschedule from `staging` or `prod`?", "staging"),
  "trigger": prompt("Enter the sync trigger")
 }