#!/usr/bin/env node
var fs        = require('fs'),
    main_lib  = require('../src/index.js'),
    optimist  = require('optimist'),
    path      = require('path'),
    promzard  = require('promzard'),
    read      = require('read');

var prompts = {
  deploy: require.resolve('./deploy-prompts.js'),
  archive: require.resolve('./archive-prompts.js')
}
var commands = ['config', 'init', 'deploy', 'hook', 'archive'];
// TODO, ask for old branch name and new branch name

var argv = optimist
  .usage('Usage: swoop <command>\n\nCommands:\n  config\tConfigure your GitHub account and server settings\n  init\t\tGit init, create GitHub repo + hooks\n  hook\t\tSet up the hook on an existing repo so that the server is notified on commit. Useful for repos that were not created with `init`.\n  deploy\tAdd your deploy trigger as a commit message and push. Specify trigger with options below.\n  archive\tMake your current project a branch of your archives repo. Specify archive repo in config.json and branch names with `-b` or `--branches`')
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
  .options('d', {
    alias: 'dir',
    describe: 'Deploy a sub-directory of this repo.',
  })
  .options('b', {
    alias: 'branches',
    describe: '<current_branch_name>:<new_branch_name>',
  })
  .check(function(argv) {
    if (!argv['_'].length) throw 'What do you want to do?';
    if (argv['_'].length > 1) throw 'Please only supply one command.';
    if (commands.indexOf(argv['_']) != -1) throw 'Your command must be either `config`, `init`, `hook`, `deploy` or `archive`.'
  })
  .argv;

if (argv.help) return optimist.showHelp();


function getTriggerType(dict){
  if (argv['s'] || argv['sync-trigger']){
    return 'sync';
  } else if (argv['h'] || argv['hard-trigger']) {
    return 'hard';
  } else {
    return undefined;
  }
}

function getTrigger(dict){
  return dict['s'] || dict['sync-trigger'] || dict['h'] || dict['hard-trigger'] || undefined;
}

function getSubDir(dict){
  return dict['d'] || dict['dir'] || undefined;
}

function checkTriggerInfo(trigger_type, trigger, sub_dir_path){
  if (trigger_type != 'sync' && trigger_type != 'hard') throw 'Trigger type must be either `sync` or `hard`.';
  var config = require('../config.json');
  var triggers = {
    sync: config.server.sync_deploy_trigger,
    hard: config.server.hard_deploy.trigger
  }
  if (trigger != triggers[trigger_type]) throw 'Trigger incorrect!';
  var current_dir = path.resolve('./');
  if ( sub_dir_path && !fs.existsSync(current_dir + '/' + sub_dir_path) ) throw 'Sub-directory `' + current_dir + '/' + sub_dir_path + '` does not exist.' 
  return true;
}

function promptFor(target){
  promzard(prompts[target], function (er, data) {

    console.log(JSON.stringify(data, null, 2) + '\n');
    read({prompt:'Is this ok? ', default: 'yes'}, function (er, ok) {
      if (!ok || ok.toLowerCase().charAt(0) !== 'y') {
        console.log('Aborted.');
      } else {
        if (target == 'deploy') {
          deploy(data.trigger_type, data.trigger, data.sub_dir_path);
        } else if (target == 'archive'){
          archive(data.branches);
        }
      }
    })
  });
}

function deploy(trigger_type, trigger, sub_dir_path){
  // If triggers weren't set through flags, prompt for them
  if (!trigger_type && !trigger) {
    promptFor('deploy');
  } else {
    if ( checkTriggerInfo(trigger_type, trigger, sub_dir_path) ) {
      main_lib['deploy'](trigger_type, trigger, sub_dir_path);
    }
  }
}

function archive(branches){
  // If branches weren't set through flags, prompt for them
  if (!branches){
    promptFor('archive');
  } else {
    main_lib['archive'](branches);
  }
}

var command = argv['_'],
    trigger_type = getTriggerType(argv),
    trigger = getTrigger(argv),
    sub_dir_path = getSubDir(argv),
    branches = argv['b'] || argv['branches'];

if (command == 'deploy'){
  deploy(trigger_type, trigger, sub_dir_path);
} else if (command == 'archive'){
  archive(branches);
}else{
  main_lib[command]();
}
