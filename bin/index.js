#!/usr/bin/env node
var main_lib    = require('../src/index.js');
var optimist    = require('optimist');
var path        = require('path');
var inquirer    = require('inquirer');
var chalk       = require('chalk');
var octonode    = require('octonode');
var child       = require('child_process');
var sh_commands = require('../src/sh-commands.js');
var moment			= require('moment-timezone');
var _           = require('underscore');
var queue       = require('queue-async');
var io          = require('indian-ocean');

var updateNotifier = require('update-notifier');
var pkg = require('../package.json');

// Checks for available update and returns an instance
var notifier = updateNotifier({
  pkg: pkg,
  updateCheckInterval: 1000 * 60 * 60 * 24 * 3 // Every three days
});

// Notify using the built-in convenience method
notifier.notify();

var prompts_dict = {
  deploy: function(){
    return require('./deploy-prompts.js');
  },
  unschedule: function(){
    return require('./unschedule-prompts.js');
  },
  archive: function(){
    return require('./archive-prompts.js');
  }
};

var commands = ['config', 'init', 'deploy', 'archive', 'unschedule', 'preflight'];
var config;
var pkg_json = require('../package.json');
var PROJECT_PATH = path.resolve('.');
var LOCAL_FOLDER = path.basename(PROJECT_PATH);

var argv = optimist
  .usage('\nUsage: swoop ' + chalk.bold('<command>') + chalk.cyan('\nFor normal usage, ignore the "Options" below and follow the prompts.') + '\n\nCommands:\n  ' + chalk.yellow('config') + '\tConfigure your GitHub account and server settings\n  ' + chalk.yellow('init') + '\t\tGit init, create GitHub repo + hooks\n  ' + chalk.green('deploy') + '\tPush your project to S3.\n  ' + chalk.green('archive') + '\tMake your current project a branch of your archive repo.\n  ' + chalk.green('unschedule') + '\tClear an environment\'s scheduled deployments.')
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

if (argv.help) {
  return optimist.showHelp();
}

function getBucketEnvironment(dict){
  return dict['e'] || dict['env'] || undefined;
}

function getTriggerType(dict){
  return dict['m'] || dict['method'] || undefined;
}

function getBranches(dict, which){
 var branch_string = dict['b'] || dict['branches'] || undefined;
 var branch_parts;
 var which_index;
 var branches;

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
  var bucket_environment = dplySettings.bucket_environment;
  var trigger_type = dplySettings.trigger_type;
  var trigger = dplySettings.trigger;
  var local_path = dplySettings.local_path;
  var when = dplySettings.when;

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
  // var full_local_path = path.join(LOCAL_FOLDER, local_path);
  if ( !io.existsSync(local_path.replace(LOCAL_FOLDER, '.')) ) {
    throw chalk.red.bold('Error:') + ' Local directory `' + chalk.bold(local_path) + '` does not exist.';
  }
  
  // Make sure your date is a proper date, unless it's `now`
	var test_date;
	var test_date_string;
	var test_date_parts;
	var test_time_parts;

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
  });

  inquirer.prompt(non_flagged_questions, function(answers) {
    var flags_as_arr;
    var flags_styled;
    // If we have settings from flags, display them
    if (!_.isEmpty(settings_from_flags)) {
      flags_as_arr = _.pairs(settings_from_flags);
      flags_styled = flags_as_arr.map(function(settingPair){
        return chalk.bold(settingPair[0]) + ': ' + chalk.cyan(settingPair[1]);
      }).join('\n')
      console.log('\n' + chalk.magenta('Plus you added these settings via flags:'), '\n' + flags_styled + '\n')
    }

    // We omitted these questions above, now we want to add their values to our answers
    _.extend(answers, settings_from_flags);

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
          commands.deploy(answers);
          writeDeploySettings(answers);
        } else if (target == 'archive'){
          commands.archive(answers);
        } else if (target == 'unschedule'){
          commands.unschedule(answers);
        }
      }
    })
  });
}

var preflights = {
  fns: {},
  commands: {},
  helpers: {}
};

// Callback is `(err, project_name)` or `'Git remote not set'` if git is initialized but no remote is set
preflights.helpers.getGitHubRemote = function(cb){
  child.exec(sh_commands.getGitRemoteProjectName(), function(err, stdout, stderr ) {
    if (err) {
      cb(err)
    } else if (stdout.trim() == 'Fetch URL: origin') {
      // console.log(chalk.yellow('Warning: Could not get remote project name from .git folder.'))
      // console.log('> This could simply mean you have initialized git but haven\'t connected it to a GitHub repository.')
      cb(null, 'Git remote not set')
    } else {
      // Grab the repo name from the url, if that doesn't work, default to current directory name
      var url_parts = stdout.trim().split('/')
      var project_name = url_parts[url_parts.length - 1].replace(/\.git/, '')
      cb(null, project_name)
    }
  })
}

preflights.fns.remoteHasWebhook = function(cb){
  var gh_client = octonode.client(config.github.access_token);
  var gh_repo = gh_client.repo(config.github.account_name + '/' + LOCAL_FOLDER);

  gh_repo.hooks(function(err, response){
    var msg = ''
    if (err) {
      if (err.code == 'ENOTFOUND') {
        err = chalk.red.bold('Error: ') + 'You do not seem to be connected to the internet.'
      } else if (err.statusCode === 404) {
        err = chalk.red.bold('Error: ') + 'The repo `' + config.github.account_name + '/' + LOCAL_FOLDER + '` does not seem to exist.'
        err += '\nPlease run `' + chalk.bold('swoop init')  + '` and try again.'
      }
      cb(err)
    } else {
      var config_urls = _.chain(response).pluck('config').pluck('url').value()
      if (!_.contains(config_urls, config.server.url)) {
        err = chalk.red.bold('Error: ') + 'No webhook found at `https://github.com/'+ config.github.account_name + '/' + LOCAL_FOLDER + '/settings/hooks`'
        err += '\nPlease run `' + chalk.bold('swoop init')  + '` and try again.'
      } else {
        msg = chalk.green('Webook present!')
      }
      cb(err, msg);
    }
  }); 
}
preflights.fns.kestrelInited = function (cb){
  var kestrel_path = path.join(PROJECT_PATH, '.kestrel');
  var err
  var msg
  if ( !io.existsSync(kestrel_path) ) {
    err = chalk.red.bold('Error:') + ' You haven\'t initalized Kestrel for this project yet.'
    err += '\nPlease run `' + chalk.bold('swoop init')  + '` and try again.'
    cb(err)
  } else {
    cb(null, chalk.green('Kestrel init\'ed!'))
  }
}
preflights.fns.localDirMatchesGhRemote = function(cb){
  preflights.helpers.getGitHubRemote(function(err, repoName){
    var matches
    var msg = ''
    if (err) {
      cb(err)
      return false
    } else if (repoName == 'Git remote not set'){
      err = '';
      err = chalk.red.bold('Error: ') + 'You haven\'t connected this project to GitHub.'
      err += '\nPlease run `' + chalk.bold('swoop init')  + '` and try again.'
    } else {
      matches = LOCAL_FOLDER == repoName;
      if (matches) {
        err = null;
        msg = chalk.green('Names match!')
      } else {
        err = chalk.red.bold('ERROR: ') + 'Folder names don\'t match!';
        err += '\nYour local folder is named `' + chalk.bold(LOCAL_FOLDER) + '` but your GitHub repo is named `' + chalk.bold(repoName) + '`';
        err += '\nPlease rename your local folder to match the GitHub repo name.';
      }
    }
    cb(err, msg);
  });
}
preflights.fns.cleanWorkingTree = function(cb){
  child.exec(sh_commands.statusPorcelain(), function(err, stdout, stderr){
    var err = '';
    var msg = ''
    if (!stdout){
      cb(null, chalk.green('Clean working tree!'))
    } else {
      err = chalk.yellow('One second...')
      err += '\nYou have uncommited changes on your git working tree.' 
      err += chalk.bold('\nPlease track all files and commit all changes before deploying.');
      cb(err);
    }
  })
}
preflights.fns.isGit = function(cb){
  io.exists('.git', function(err, exists){
    if (err) {
      cb(err)
    } else {
      if (exists) {
        cb(null, chalk.green('Git init\'ed!'))
      } else {
        err = '';
        err = chalk.red.bold('Error:') + ' You have not yet initialized git.'
        err += '\nPlease run `' + chalk.bold('swoop init')  + '` and try again.'
        cb(err)
      }
    }
  })
}
preflights.commands.preflight = function(cb){
  var q = queue(1)
  q.defer(preflights.fns.isGit)
  q.defer(preflights.fns.kestrelInited)
  q.defer(preflights.fns.localDirMatchesGhRemote)
  q.defer(preflights.fns.remoteHasWebhook)
  q.awaitAll(cb)
}
preflights.commands.deploy = function(cb){
  var q = queue(1)
  q.defer(preflights.fns.isGit)
  q.defer(preflights.fns.kestrelInited)
  q.defer(preflights.fns.cleanWorkingTree)
  q.defer(preflights.fns.localDirMatchesGhRemote)
  q.defer(preflights.fns.remoteHasWebhook)
  q.awaitAll(cb)
}
preflights.commands.unschedule = function(cb){
  var q = queue(1)
  q.defer(preflights.fns.isGit)
  q.defer(preflights.fns.kestrelInited)
  q.defer(preflights.fns.localDirMatchesGhRemote)
  q.defer(preflights.fns.remoteHasWebhook)
  q.awaitAll(cb)
}
preflights.commands.archive = function(cb){
  var q = queue(1)
  q.defer(preflights.fns.isGit)
  q.defer(preflights.fns.localDirMatchesGhRemote)
  q.awaitAll(cb)
}

var commands = {};

commands.deploy = function(deploySettings){
  var bucket_environment = deploySettings.bucket_environment;
  var trigger_type = deploySettings.trigger_type;
  var trigger = deploySettings.trigger;
  var local_path = deploySettings.local_path;
  var remote_path = deploySettings.remote_path;
  var when = deploySettings.when;

  // If triggers weren't set through flags, prompt for them
  if (!trigger_type || trigger === undefined) {
    promptFor('deploy', deploySettings);
  } else {
    if ( checkDeployInfo(deploySettings) ) {
      main_lib['deploy'](bucket_environment, trigger_type, trigger, local_path, remote_path, when);
    }
  }
}

commands.unschedule = function(deploySettings){
  var bucket_environment = deploySettings.bucket_environment;
  var trigger_type = deploySettings.trigger_type;
  var trigger = deploySettings.trigger;

  // If triggers weren't set through flags, prompt for them
  if (!trigger_type && trigger === undefined) {
    promptFor('unschedule', deploySettings);
  } else {
    if ( checkUnscheduleInfo(deploySettings) ) {
      main_lib['unschedule'](bucket_environment, 'sync', trigger, 'all-local-directories', 'no-remote', 'unschedule');
    }
  }
}

commands.archive = function(deploySettings){
  // If branches weren't set through flags, prompt for them
  if (!deploySettings.local_branch || !deploySettings.remote_branch){
    promptFor('archive', deploySettings);
  } else {
    main_lib['archive'](deploySettings);
  }
}

function writeDeploySettings(deploySettings){
  // Our path is defined as a global when we check for `init` on `deploy` but get it again in its own namespace to make this function more self-contained.
  var file_path_and_name = path.join(PROJECT_PATH, '.kestrel', 'deploy-settings.json');
  // Let's not save the trigger
  delete deploySettings.trigger;
  io.fs.writeFileSync(file_path_and_name, JSON.stringify(deploySettings, null, 2));
}

var command = argv['_'];
var deploy_settings = {
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

if (commands[command]) {
  preflights.commands[command](function(err){
    if (!err) {
      commands[command](deploy_settings)
    } else {
      console.log(err)
    }
  })
} else if (command == 'preflight'){
  preflights.commands[command](function(err, responses){
    var msg
    if (!err) {
      msg = chalk.underline('Preflight checks')
      msg += '\n' + responses.map(function(response, idx){ return (idx + 1) + '/' + responses.length + ' ' + response }).join('\n')
      console.log(msg)
    } else {
      console.log(err)
    }
  })} else {
  // If the cli doesn't have a specific function related to this command, pass it to the main library
  main_lib[command]();
}
