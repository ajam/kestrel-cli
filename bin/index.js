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
    moment			= require('moment-timezone')
    _           = require('underscore');

var prompts_dict = {
  deploy: require.resolve('./deploy-prompts.js'),
  unschedule: require.resolve('./unschedule-prompts.js'),
  archive: require.resolve('./archive-prompts.js')
};

var commands = ['config', 'init', 'deploy', 'archive', 'unschedule'];
var config;

var argv = optimist
  .usage('\nUsage: swoop '+'<command>'.grey+'\nFor normal usage, "ignore the "Options" below.'.red+'\n\nCommands:\n  '+'config'.yellow+'\tConfigure your GitHub account and server settings\n  '+'init'.yellow+'\t\tGit init, create GitHub repo + hooks\n  '+'deploy'.green+'\tPush your project to S3.\n  '+'archive'.green+'\tMake your current project a branch of your archive repo.\n  '+'unschedule'.green+'\tClear a project\'s scheduled deployments.')
  .options('help', {
    describe: 'Display help'
  })
  .options('e', {
    alias: 'env',
    describe: '`staging` or `prod` environment.',
  })
  .options('m', {
    alias: 'method',
    describe: '`sync` or `hard` deploy method.',
  })
  .options('l', {
    alias: 'local',
    describe: 'The local path to deploy from.',
  })
  .options('r', {
    alias: 'remote',
    describe: 'The remote path to deploy to.',
  })
  .options('w', {
    alias: 'when',
    describe: 'Time to schedule a deploy in YYYY-MM-DD HH:MM format, 24-hour clock.',
  })
  .options('b', {
    alias: 'branches',
    describe: '<current_branch_name>:<new_branch_name>',
  })
  .check(function(argv) {
    var cmds = argv['_'];
    if (!argv['_'].length) {
      throw 'What do you want to do?'.cyan+'\n';
    } else if (argv['_'].length > 1) {
      throw 'ERROR: Please only supply one command.'.red;
    } else if (commands.indexOf(cmds[0]) == -1) {
      throw 'ERROR: '.red + argv['_'][0].yellow + ' is not a valid command.'.red+'\nValid commands: '.cyan+commands.map(function(cmd){ return '`'+cmd+'`'}).join(', ')+'.';
    }
  })
  .argv;

if (argv.help) return optimist.showHelp();

function getBucketEnvironment(dict){
  return dict['e'] || dict['env'] || undefined;
}

function getTriggerType(dict){
  return dict['m'] || dict['method'] || undefined;
}

function getBranches(dict){
 return dict['b'] || dict['branches'] || undefined;
}

function getLocalPath(dict){
  return dict['l'] || dict['local'] || undefined;
}

function getRemotePath(dict){
  return dict['r'] || dict['remote'] || undefined;
}

function getWhen(dict){
  var when = dict['w'] || dict['when'] || undefined;
  if (when){
  	when = when.replace('_', ' '); // When added through flags there is a `_` separator for the cli arg reader. Let's standardize to get rid of that.
  }
  return when;
}

function checkDeployInfo(dplySettings){
  var bucket_environment = dplySettings.bucket_environment,
      trigger_type = dplySettings.trigger_type,
      trigger = dplySettings.trigger,
      local_path = dplySettings.local_path,
      when = dplySettings.when;

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
				if (+timePart < 10){
					throw 'Error: Time in publish date must be zero-padded, e.g. 06:00'.red
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

function checkUnscheduleInfo(dplySettings){
  var trigger = dplySettings.trigger;

  // Verify they used the sync-trigger
  var sync_trigger = config.server.sync_deploy_trigger;
  if (sync_trigger != trigger){
    throw 'Error: Trigger incorrect!'.red;
  }
  return true;
}

function pickTruthyKeys(dplySettings){
  return _.pick(dplySettings, function(val){ return val !== undefined; });
}

function promptFor(target, dplySettings){
  var settings_from_flags = pickTruthyKeys(dplySettings);

  promzard(prompts_dict[target], {flaggedSettings: settings_from_flags}, function(er, data) {
  	if (data){
	    console.log(JSON.stringify(data, null, 2) + '\n');
	    read({prompt:'Is this ok? '.green, default: 'yes'}, function (er, ok) {
	      if (!ok || ok.toLowerCase().charAt(0) !== 'y') {
	        console.log('\n\nDeploy aborted.'.red);
	      } else {
	        if (target == 'deploy') {
	          deploy(data);
            writeDeploySettings(data);
	        } else if (target == 'archive'){
	          archive(data);
	        } else if (target == 'unschedule'){
            unschedule(data);
          }
	      }
	    });
  	} else {
  		console.log('\n\nDeploy aborted.'.red);
  	}

  });
}

function deploy(deploySettings){
  var bucket_environment = deploySettings.bucket_environment,
      trigger_type = deploySettings.trigger_type,
      trigger = deploySettings.trigger,
      local_path = deploySettings.local_path,
      remote_path = deploySettings.remote_path,
      when = deploySettings.when;

  // If triggers weren't set through flags, prompt for them
  if (!trigger_type || trigger === undefined) {
    promptFor('deploy', deploySettings);
  } else {
    if ( checkDeployInfo(deploySettings) ) {
      main_lib['deploy'](bucket_environment, trigger_type, trigger, local_path, remote_path, when);
    }
  }
}

function unschedule(deploySettings){
  var bucket_environment = deploySettings.bucket_environment,
      trigger_type = deploySettings.trigger_type,
      trigger = deploySettings.trigger;
  // If triggers weren't set through flags, prompt for them
  if (!trigger_type && trigger === undefined) {
    promptFor('unschedule', deploySettings);
  } else {
    if ( checkUnscheduleInfo(deploySettings) ) {
      main_lib['unschedule'](bucket_environment, 'sync', trigger, 'all-local-directories', 'no-remote', 'unschedule');
    }
  }
}

function archive(deploySettings){
  var branches = deploySettings.branches;
  // If branches weren't set through flags, prompt for them
  if (!branches){
    promptFor('archive', deploySettings);
  } else {
    main_lib['archive'](branches);
  }
}

function writeDeploySettings(deploySettings){
  // Our path is defined as a global when we check for `init` on `deploy` but get it again in its own namespace to make this function more self-contained.
  var file_path_and_name = path.resolve('./') + '/.kestrel/deploy-settings.json';
  // Let's not save the trigger
  delete deploySettings.trigger;
  fs.writeFileSync(file_path_and_name, JSON.stringify(deploySettings));
}

var command = argv['_'],
    deploy_settings = {
      bucket_environment: getBucketEnvironment(argv),
      trigger_type: getTriggerType(argv),
      local_path: getLocalPath(argv),
      remote_path: getRemotePath(argv),
      branches: getBranches(argv),
      when: getWhen(argv)
    };

// If we aren't configuring the library, make sure it already has a config file and load it.
if (command != 'config') {
  config = main_lib.setConfig();
}

// If we are doing any of these things, make sure we've `init`d by looking for the `.kestrel` folder
var kestrel_path;
if (command == 'deploy' || command == 'unschedule') {
  // Make sure your sub-directory exists
  kestrel_path = path.resolve('./') + '/.kestrel';
  if ( !fs.existsSync(kestrel_path) ) {
    throw 'Error:'.red + ' You haven\'t initalized Kestrel for this project yet.\n'.red + 'Please run `swoop init` and try again.'.yellow;
  }
}

if (command == 'deploy'){
  // Check if we have a clean working tree before allowing to deploy
  child.exec(sh_commands.statusPorcelain(), function(err, stdout, stderr){
    var stderr;
    if (!stdout){
      deploy(deploy_settings);
    } else {
      stderr = 'One second...\nYou have uncommited changes on your git working tree.'.red + '\nPlease track all files and commit all changes before deploying.'.inverse.blue;
      console.log(stderr);
    }
  });
} else if (command == 'archive'){
  archive(deploy_settings);
}else if (command == 'unschedule'){
  unschedule(deploy_settings);
}else{
  main_lib[command]();
}
