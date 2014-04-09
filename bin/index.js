#!/usr/bin/env node
var fs        = require('fs'),
    main_lib  = require('../src/index.js'),
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

function getTrigger(dict){
  return dict['s'] || dict['sync-trigger'] || dict['h'] || dict['hard-trigger'];
}

var command = argv['_'],
    trigger_type = getTriggerType(argv),
    trigger = getTrigger(argv);

if (command == 'deploy'){
  deploy(command, trigger_type, trigger)
}else{
  runCommand(command);
}

function checkTriggerInfo(trigger_type, trigger){
  if (trigger_type != 'sync' && trigger_type != 'hard') throw 'Trigger type must be either `sync` or `hard`.';
  var config = require('../config.json');
  var triggers = {
    sync: config.server.sync_deploy_trigger,
    hard: config.server.hard_deploy.trigger;
  }
  if (trigger != triggers[trigger_type]) throw 'Trigger incorrect!';
  return true;
}

function deploy(command, trigger_type, trigger){
  promzard(deploy_prompts, function (er, data) {
    checkTriggerInfo(trigger_type, trigger);
    
    console.log(JSON.stringify(data, null, 2) + '\n');

    read({prompt:'Is this ok? ', default: 'yes'}, function (er, ok) {
      if (!ok || ok.toLowerCase().charAt(0) !== 'y') {
        console.log('Aborted.')
      } else {
        main_lib[command](data.trigger_type, data.trigger));
      }
    })
  });
}

function runCommand(command){
  main_lib[com](arg);
}
