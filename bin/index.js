#!/usr/bin/env node
var fs          = require('fs'),
    main_lib    = require('../src/index.js'),
    optimist    = require('optimist'),
    path        = require('path'),
    promzard    = require('promzard'),
    read        = require('read'),
    colors      = require('colors'),
    child       = require('child_process'),
    sh_commands = require('../src/sh-commands.js'),
    moment			= require('moment-timezone');

var prompts = {
  deploy: require.resolve('./deploy-prompts.js'),
  unschedule: require.resolve('./unschedule-prompts.js'),
  archive: require.resolve('./archive-prompts.js')
};

var commands = ['config', 'init', 'deploy', 'hook', 'archive', 'unschedule'];
var config;

var argv = optimist
  .usage('\nUsage: swoop '+'<command>'.grey+'\nFor normal usage, "ignore the "Options" below.'.red+'\n\nCommands:\n  '+'config'.yellow+'\tConfigure your GitHub account and server settings\n  '+'init'.yellow+'\t\tGit init, create GitHub repo + hooks\n  '+'hook'.yellow+'\t\tSet up the hook on an existing repo so that the server is notified on commit. Useful for repos that were not created with `swoop init`.\n  '+'deploy'.green+'\tPush your project to S3.\n  '+'archive'.green+'\tMake your current project a branch of your archive repo.\n  '+'unschedule'.green+'\tClear a project\'s scheduled deployments.')
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
    if (!argv['_'].length) throw 'What do you want to do?'.cyan+'\n';
    if (argv['_'].length > 1) throw 'Please only supply one command.';
    if (commands.indexOf(argv['_']) != -1) throw 'Your command must be either `config`, `init`, `hook`, `deploy`, `archive` or `unschedule`.'
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

function checkDeployInfo(bucket_environment, trigger_type, trigger, local_path, when){
  // Check trigger info
  if (trigger_type != 'sync' && trigger_type != 'hard') {
  	throw 'Error: Trigger type must be either `sync` or `hard`.'.red;
  }
  var triggers = {
    sync: config.server.sync_deploy_trigger,
    hard: config.server.hard_deploy.trigger
  };
  // If you're trying to deploy hard and it hasnt been set...
  if (trigger_type == 'hard' && !config.server.hard_deploy.enabled) {
  	throw 'Error: Hard deploy isn\'t enabled!'.red;
  }
  // Make sure it matches what you specified
  if (trigger != triggers[trigger_type]) {
  	throw 'Error: Trigger incorrect!'.red;
  }

  // Make sure your sub-directory exists
  var full_local_path = path.dirname( path.resolve('./') )  + '/' + local_path;
  if ( !fs.existsSync(full_local_path) ) {
  	throw 'Error:'.red + ' Local directory `'.red + local_path.yellow + '` does not exist.'.red;
  }
  
  // Make sure you specified a bucket environment
  if (bucket_environment != 'prod' && bucket_environment != 'staging') {
  	throw 'Error: Bucket environment must be either `prod` or `staging`.'.red;
  }
  
  // Make sure your date is a proper date, unless it's `now`
	var test_date,
			test_date_string,
			test_date_parts,
			test_time_parts;

	if (when != 'now'){
		test_date = new Date(when);
		test_date_string = test_date.toString();
		if (test_date_string === 'Invalid Date'){
			throw 'Error: Invalid publish date. Must be in YYYY-MM-DD HH:MM format'.red;
		} else {
			test_date_parts = when.split(' ');
			if (test_date_parts[0].length != 10){
				throw 'Error: Publish date must be in YYYY-MM-DD format.'.red;
			}
			test_time_parts = test_date_parts[1].split(':');
			if (test_time_parts.length != 2){
				throw 'Error: Time must be 24 hour, separated by a colon'.red
			}
			test_time_parts.forEach(function(timePart){
				if (+timePart < 10 && timePart.length < 1){
					throw 'Error: Time in publish date must be zero-padded, e.g. 05:00'.red
				}
			});
			var now = new moment().tz(config.timezone);
			if (test_date < now){
				throw 'Error: It appears your publish date is in the past.'.red
			}
		}
	}
  return true;
}

function checkUnscheduleInfo(bucket_environment, trigger){
  // Verify they used the sync-trigger
  var sync_trigger = config.server.sync_deploy_trigger;
  if (sync_trigger != trigger){
    throw 'Error: Trigger incorrect!'.red;
  }

  return true;
}

function promptFor(target){
  promzard(prompts[target], function (er, data) {

  	if (data){
	    console.log(JSON.stringify(data, null, 2) + '\n');
	    read({prompt:'Is this ok? ', default: 'yes'}, function (er, ok) {
	      if (!ok || ok.toLowerCase().charAt(0) !== 'y') {
	        console.log('\n\nDeploy aborted.'.red);
	      } else {
	        if (target == 'deploy') {
	          deploy(data.bucket_environment, data.trigger_type, data.trigger, data.local_path, data.remote_path, data.when);
	        } else if (target == 'archive'){
	          archive(data.branches);
	        } else if (target == 'unschedule'){
            unschedule(data.bucket_environment, data.trigger);
          }
	      }
	    });
  	} else {
  		console.log('\n\nDeploy aborted.'.red);
  	}

  });
}

function deploy(bucket_environment, trigger_type, trigger, local_path, remote_path, when){
  // If triggers weren't set through flags, prompt for them
  if (!trigger_type && trigger === undefined) {
    promptFor('deploy');
  } else {
    if ( checkDeployInfo(bucket_environment, trigger_type, trigger, local_path, when) ) {
      main_lib['deploy'](bucket_environment, trigger_type, trigger, local_path, remote_path, when);
    }
  }
}

function unschedule(bucket_environment, trigger){
  // If triggers weren't set through flags, prompt for them
  if (!trigger_type && trigger === undefined) {
    promptFor('unschedule');
  } else {
    if ( checkUnscheduleInfo(bucket_environment, trigger) ) {
      main_lib['unschedule'](bucket_environment, 'sync', trigger, 'all-local-directories', 'no-remote', 'unschedule');
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

// If we are doing any of these things, make sure we've `init`d by looking for the `.kestrel` folder
if (command == 'deploy' || command == 'archive' || command == 'unschedule') {
  // Make sure your sub-directory exists
  var kestrel_path = path.resolve('./') + '/.kestrel'
  if ( !fs.existsSync(kestrel_path) ) {
    throw 'Error:'.red + ' You haven\'t initalized Kestrel for this project yet.\n'.red + 'Please run `swoop init` and try again.'.yellow;
  }
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
  });
} else if (command == 'archive'){
  archive(branches);
}else if (command == 'unschedule'){
  unschedule(bucket_environment, trigger_type, trigger, sub_dir_path);
}else{
  main_lib[command]();
}
