#!/usr/bin/env node
var fs = require('fs');
var professor_blastoff = require('../src/professor-blastoff.js'),
    optimist           = require('optimist');

var argv = optimist
  .usage('Usage: boom <command>\n\nCommands:\n  init\t\tGit init, create GitHub repo + hooks, create archive if enabled\n  archive\tDelete the GitHub repo. \n  deploy-last\tAppend a deploy trigger to the last commit and push. Specify trigger with options below.')
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
    if (argv['sync-trigger'] && argv['hard-trigger']) throw 'Please only supply either the sync trigger or the hard trigger, but not both.';
    if (argv['_'] == 'deploy-last' && (!argv['trigger'] && !argv['hard-trigger']) ) throw 'You must supply a trigger to deploy.';
  })
  .argv;

if (argv.h || argv.help) return optimist.showHelp();

var fns = {
  "init": professor_blastoff.init,
  // "archive": professor_blastoff.archive,
  // "deploy-last": professor_blastoff.deployLast
}

var command = argv['_'],
    trigger = argv['s'] || argv['sync-trigger'] || argv['help'] || argv['hard-trigger'];

function runCommand(com, trig){
  fns[com](trig);
}

runCommand(command, trigger);