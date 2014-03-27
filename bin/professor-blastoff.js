#!/usr/bin/env node
var fs = require('fs');
var professor_blastoff = require('../src/professor-blastoff.js'),
    optimist           = require('optimist');

var argv = optimist
  .usage('Usage: boom (init|archive|deploy-last-commit)')
  .options('h', {
    alias: 'help',
    describe: 'Display help'
  })
  .options('t', {
    alias: 'deploy-trigger',
    describe: 'Deploy trigger for pubishing to S3.',
    default: null
  })
  .check(function(argv) {
    if (!argv['_'].length) throw 'What do you want to do?';
  })
  .argv;

if (argv.h || argv.help) return optimist.showHelp();

var commands = {
  init: professor_blastoff.init
}

var command = argv['_'],
    trigger = argv['t'] || arg['deploy-trigger'];

function runCommand(com, trig){
  commands[com](trig);
}

runCommand(command, trigger);