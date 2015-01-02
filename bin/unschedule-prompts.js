var prompts = {
  "bucket_environment": prompt("Unschedule from `staging` or `prod`?", "staging"),
  "trigger": prompt("Enter the sync trigger")
 };

 _.extend(prompts, this.flaggedSettings);

module.exports = prompts;