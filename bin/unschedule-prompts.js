var questions = [
  {
    type: 'list',
    name: 'bucket_environment',
    message: 'Unschedule from which environment?',
    choices: ['staging', 'prod'],
    default: 'staging'
  },{
    type: 'password',
    name: 'trigger',
    message: 'Enter the sync trigger:'
  }
]

module.exports = questions;