#!/usr/bin/env node
var fs          = require('fs'),
    main_lib    = require('../src/index.js'),
    optimist    = require('optimist'),
    path        = require('path'),
    promzard    = require('promzard'),
    read        = require('read'),
    colors      = require('colors'),
    child       = require('child_process'),
    sh_commands = require('../src/sh-commands.js');

var prompts = {
  deploy: require.resolve('./deploy-prompts.js'),
  archive: require.resolve('./archive-prompts.js')
};

var commands = ['config', 'init', 'deploy', 'hook', 'archive'];
var config;

var argv = optimist
  .usage('Usage: swoop <command>\n\nCommands:\n  config\tConfigure your GitHub account and server settings\n  init\t\tGit init, create GitHub repo + hooks\n  hook\t\tSet up the hook on an existing repo so that the server is notified on commit. Useful for repos that were not created with `init`.\n  deploy\tAdd your deploy trigger as a commit message and push. Specify trigger with options below.\n  archive\tMake your current project a branch of your archives repo. Specify archive repo in config.json and branch names with `-b` or `--branches`')
  .options('help', {
    describe: 'Display help'
  })
  .options('e', {
    alias: 'environment',
    describe: 'Staging or production environment.',
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

function getBucketEnvironment(dict){
  return dict['e'] || dict['environment'] || undefined;
}

function getTrigger(dict){
  return dict['s'] || dict['sync-trigger'] || dict['h'] || dict['hard-trigger'] || undefined;
}

function getSubDir(dict){
  return dict['d'] || dict['dir'] || undefined;
}

function checkDeployInfo(bucket_environment, trigger_type, trigger, local_path){
  // Check trigger info
  if (trigger_type != 'sync' && trigger_type != 'hard') throw 'Error: Trigger type must be either `sync` or `hard`.'.red;
  var triggers = {
    sync: config.server.sync_deploy_trigger,
    hard: config.server.hard_deploy.trigger
  }
  // If you're trying to deploy hard and it hasnt been set...
  if (trigger_type == 'hard' && !config.server.hard_deploy.enabled) throw 'Error: Hard deploy isn\'t enabled!'.red
  // Make sure it matches what you specified
  if (trigger != triggers[trigger_type]) throw 'Error: Trigger incorrect!'.red;

  // Make sure your sub-directory exists
  var full_local_path = path.dirname( path.resolve('./') )  + '/' + local_path
  if ( !fs.existsSync(full_local_path) ) throw 'Error:'.red + ' Local directory `' + local_path.yellow + '` does not exist.' 
  
  // Make sure you specified a bucket environment
  if (bucket_environment != 'prod' && bucket_environment != 'staging') throw 'Error: Bucket environment must be either `prod` or `staging`.'.red
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
          deploy(data.bucket_environment, data.trigger_type, data.trigger, data.local_path, data.remote_path);
        } else if (target == 'archive'){
          archive(data.branches);
        }
      }
    })
  });
}

function deploy(bucket_environment, trigger_type, trigger, local_path, remote_path){
  // If triggers weren't set through flags, prompt for them
  if (!trigger_type && !trigger) {
    promptFor('deploy');
  } else {
    if ( checkDeployInfo(bucket_environment, trigger_type, trigger, local_path) ) {
      main_lib['deploy'](bucket_environment, trigger_type, trigger, local_path, remote_path);
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
    bucket_environment = getBucketEnvironment(argv),
    trigger_type = getTriggerType(argv),
    trigger = getTrigger(argv),
    sub_dir_path = getSubDir(argv),
    branches = argv['b'] || argv['branches'];

// If we aren't configuring the library, make sure it already has a config file and load it.
if (command != 'config') {
  config = main_lib.setConfig();
}

if (command == 'deploy'){
  // Check if we have a clean working tree before allowing to deploy
  child.exec(sh_commands.statusPorcelain(), function(err, stdout, stderr){
    var stderr;
    if (!stdout){
      deploy(bucket_environment, trigger_type, trigger, sub_dir_path);
    } else {
      stderr = 'One second...\nYou have uncommited changes on your git working tree.'.red + '\nPlease track all files and commit all changes before deploying.'.inverse.blue;
      console.log(stderr);
    }
  })
} else if (command == 'archive'){
  archive(branches);
}else{
  main_lib[command]();
}
