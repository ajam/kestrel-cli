module.exports = {
  "trigger_type": prompt("Deploy method?", "sync|hard"),
  "trigger": prompt("Trigger?"),
  "sub_dir_path": prompt("Deploy sub-directory?", "false", function(subDirFlagOrPath){
	  if (subDirFlagOrPath === 'false') return false
	  return subDirFlagOrPath
  })
 }