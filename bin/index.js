#!/usr/bin/env node
var main_lib  = require('../src/index.js'),
    optimist  = require('optimist'),
    path      = require('path'),
    promzard  = require('promzard'),
    read      = require('read');

var deploy_prompts = require.resolve('./deploy-prompts.js')

var argv = optimist
  .usage('Usage: swoop <command>\n\nCommands:\n  config\tConfigure your GitHub account and server settings\n  init\t\tGit init, create GitHub repo + hooks, create archive if enabled\n  archive\tDelete the GitHub repo. \n  deploy\tAdd your deploy trigger as a commit message and push. Specify trigger with options below.')
  .options('help', {
    describe: 'Display help'
  })
  .options('s', {
    alias: 'sync-trigger',
    describe: 'Sync deploy trigger for pubishing to S3.',
  })
  .options('h', {
    alias: 'hard-trigger',
    describe: 'Hard deploy trigger for pubishing to S3.',
  })
  .check(function(argv) {
    if (!argv['_'].length) throw 'What do you want to do?';
    if (argv['_'].length > 1) throw 'Please only supply one command.';
  })
  .argv;

if (argv.help) return optimist.showHelp();



function getTriggerType(dict){
  if (argv['s'] || argv['sync-trigger']){
    return 'sync'
  } else if (argv['h'] || argv['hard-trigger']) {
    return 'hard'
  }
}

var command = argv['_'],
    trigger_type = getTriggerType(argv);

if (command == 'deploy'){
  promzard(deploy_prompts, function (er, data) {
    if (data.trigger_type != 'sync' && data.trigger_type != 'hard') throw 'Trigger type must be either `sync` or `hard`.';
    var d = JSON.stringify(data, null, 2) + '\n';
    console.log(d)
    read({prompt:'Is this ok? ', default: 'yes'}, function (er, ok) {
      if (!ok || ok.toLowerCase().charAt(0) !== 'y') {
        console.log('Aborted.')
      } else {
        runCommand(command, data.trigger, data.trigger_type);
      }
    })
  });
}else{
  runCommand(command);
}

function runCommand(com, arg, trigger_type){
  main_lib[com](arg, trigger_type);
}
