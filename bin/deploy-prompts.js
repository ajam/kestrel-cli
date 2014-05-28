module.exports = {
  "bucket_environment": prompt("Deploy to `staging` or `prod`?", "staging"),
  "trigger_type": prompt("Deploy method (sync/hard)?", "sync"),
  "trigger": prompt("Trigger?"),
  "sub_dir_path": prompt("Deploy sub-directory? e.g. `output/myproject`", "false", function(subDirFlagOrPath){
	  if (subDirFlagOrPath === 'false') return false
	  return subDirFlagOrPath
  })
 }