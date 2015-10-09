#!/usr/bin/env node
var fs          = require('fs'),
    main_lib    = require('../src/index.js'),
    optimist    = require('optimist'),
    path        = require('path'),
    inquirer    = require('inquirer'),
    read        = require('read'),
    chalk       = require('chalk'),
    child       = require('child_process'),
    sh_commands = require('../src/sh-commands.js'),
    moment			= require('moment-timezone')
    _           = require('underscore');

var prompts_dict = {
  deploy: function(){
    return require('./deploy-prompts.js')
  },
  unschedule: function(){
    return require('./unschedule-prompts.js')
  },
  archive: function(){
    return require('./archive-prompts.js')
  }
};

var commands = ['config', 'init', 'deploy', 'archive', 'unschedule'];
var config;
var pkg_json = require('../package.json');

var argv = optimist
  .usage('\nUsage: swoop ' + chalk.bold('<command>') + chalk.cyan('\nFor normal usage, "ignore the "Options" below and follow the prompts.') + chalk.magenta('\n\nTo update: ') + chalk.magenta.bold('sudo npm update kestrel-cli -g') + '\n\nCommands:\n  ' + chalk.yellow('config') + '\tConfigure your GitHub account and server settings\n  ' + chalk.yellow('init') + '\t\tGit init, create GitHub repo + hooks\n  ' + chalk.green('deploy') + '\tPush your project to S3.\n  ' + chalk.green('archive') + '\tMake your current project a branch of your archive repo.\n  ' + chalk.green('unschedule') + '\tClear an environment\'s scheduled deployments.')
  .options('help', {
    describe: 'Display help'
  })
  .options('e', {
    alias: 'env',
    describe: '`staging` or `prod` environment.'
  })
  .options('m', {
    alias: 'method',
    describe: '`sync` or `hard` deploy method.'
  })
  .options('l', {
    alias: 'local',
    describe: 'The local path to deploy from.'
  })
  .options('r', {
    alias: 'remote',
    describe: 'The remote path to deploy to.'
  })
  .options('w', {
    alias: 'when',
    describe: 'Time to schedule a deploy in YYYY-MM-DD HH:MM format, 24-hour clock.'
  })
  .options('b', {
    alias: 'branches',
    describe: '<current_branch_name>:<new_branch_name>'
  })
  .options('v', {
    alias: 'version',
    describe: 'Get the current package version.'
  })
  .check(function(argv) {
    var cmds = argv['_'];
    if (!cmds.length && (argv['v'] || argv['version']) ) {
      throw 'Kestrel version: ' + chalk.bold(pkg_json.version)
    } else if (!cmds.length) {
      throw chalk.cyan('What do you want to do?')+'\n';
    } else if (cmds.length > 1) {
      throw chalk.red.bold('Error: Please only supply one command.');
    } else if (commands.indexOf(cmds[0]) == -1) {
      throw chalk.red.bold('Error: ') + chalk.yellow(cmds[0]) + chalk.red(' is not a valid command.') + chalk.cyan('\nValid commands: ') + commands.map(function(cmd){ return '`' + cmd + '`'}).join(', ') + '.';
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

function getBranches(dict, which){
 var branch_string = dict['b'] || dict['branches'] || undefined;
 var branch_parts,
     which_index,
     branches;

 if (branch_string){
    branch_parts = branch_string.split(':');
    which_index = (which === 'local') ? 0 : 1;
    branches = branch_parts[which_index];
 }

 return branches;
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
  	throw chalk.red.bold('Error: Trigger type must be either `sync` or `hard`.');
  }
  var triggers = {
    sync: config.server.sync_deploy_trigger,
    hard: config.server.hard_deploy.trigger
  };
  // If you're trying to deploy hard and it hasnt been set...
  if (trigger_type == 'hard' && !config.server.hard_deploy.enabled) {
  	throw chalk.red.bold('Error: Hard deploy isn\'t enabled!');
  }
  // Make sure it matches what you specified
  if (trigger != triggers[trigger_type]) {
  	throw chalk.red.bold('Error: Trigger incorrect!');
  }

  // Make sure your sub-directory exists
  var full_local_path = path.dirname( path.resolve('./') )  + '/' + local_path;
  if ( !fs.existsSync(full_local_path) ) {
  	throw chalk.red.bold('Error: Local directory `') + chalk.yellow.bold(local_path) + chalk.red('` does not exist.');
  }
  
  // Make sure you specified a bucket environment
  if (bucket_environment != 'prod' && bucket_environment != 'staging') {
  	throw chalk.red.bold('Error: Bucket environment must be either `prod` or `staging`.');
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
			throw chalk.red.bold('Error: Invalid publish date. Must be in YYYY-MM-DD HH:MM format');
		} else {
			test_date_parts = when.split(' ');
			if (test_date_parts[0].length != 10){
				throw chalk.red.bold('Error: Publish date must be in YYYY-MM-DD format.');
			}
			test_time_parts = test_date_parts[1].split(':');
			if (test_time_parts.length != 2){
				throw chalk.red.bold('Error: Time must be 24 hour, separated by a colon')
			}
			var now = new moment().tz(config.timezone);
			if (test_date < now){
				throw chalk.red.bold('Error: It appears your publish date is in the past.')
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
    throw chalk.red.bold('Error: Trigger incorrect!');
  }
  return true;
}

function pickTruthy(dplySettings){
  return _.pick(dplySettings, _.identity);
}

function promptFor(target, dplySettings){
  var settings_from_flags = pickTruthy(dplySettings);
  var questions = prompts_dict[target]()

  // Only prompt for values we haven't yet set through flags
  var flagged_values = Object.keys(settings_from_flags)
  var non_flagged_questions = questions.filter(function(question){
    return !_.contains(flagged_values, question.name)
  })

  inquirer.prompt(non_flagged_questions, function(answers) {
    var flags_as_arr
    var flags_styled
    // If we have settings from flags, display them
    if (!_.isEmpty(settings_from_flags)) {
      flags_as_arr = _.pairs(settings_from_flags)
      flags_styled = flags_as_arr.map(function(settingPair){
        return chalk.bold(settingPair[0]) + ': ' + chalk.cyan(settingPair[1])
      }).join('\n')
      console.log('\n' + chalk.magenta('Plus you added these settings via flags:'), '\n' + flags_styled + '\n')
    }
    // We omitted these questions above, now we want to add their values to our answers
    _.extend(answers, settings_from_flags)
    inquirer.prompt({
      type: 'confirm',
      name: 'confirmed',
      message: 'Does everything look good?',
      default: true
    }, function(confirmation){
      if (!confirmation.confirmed) {
        console.log(chalk.red('\n\nCancelled.'));
      } else {
        if (target == 'deploy') {
          deploy(answers);
          writeDeploySettings(answers);
        } else if (target == 'archive'){
          archive(answers);
        } else if (target == 'unschedule'){
          unschedule(answers);
        }
      }
    })
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
  // If branches weren't set through flags, prompt for them
  if (!deploySettings.local_branch || !deploySettings.remote_branch){
    promptFor('archive', deploySettings);
  } else {
    main_lib['archive'](deploySettings);
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
      local_branch: getBranches(argv, 'local'),
      remote_branch: getBranches(argv, 'remote'),
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
    throw chalk.red.bold('Error:') + ' You haven\'t initalized Kestrel for this project yet.\n' + chalk.yellow('Please run '+ chalk.bold('swoop init') + ' and try again.');
  }
}

if (command == 'deploy'){
  // Check if we have a clean working tree before allowing to deploy
  child.exec(sh_commands.statusPorcelain(), function(err, stdout, stderr){
    var stderr;
    if (!stdout){
      deploy(deploy_settings);
    } else {
      stderr = chalk.red('One second...\nYou have uncommited changes on your git working tree.') + chalk.bgBlue('\nPlease track all files and commit all changes before deploying.');
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
