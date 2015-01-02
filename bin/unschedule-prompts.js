module.exports = {
  "bucket_environment": prompt("Unschedule from `staging` or `prod`?", "staging"),
  "trigger": prompt("Enter the sync trigger")
 }