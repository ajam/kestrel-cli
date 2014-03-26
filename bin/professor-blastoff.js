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
  // .options('i', {
  //   alias: 'in_file',
  //   describe: 'Input file',
  //   default: false
  // })
  .check(function(argv) {
    if (!argv['_'].length) throw 'What do you want to do?';
  })
  .argv;

if (argv.h || argv.help) return optimist.showHelp();

var commands = {
  init: professor_blastoff.init
}

function runCommand(command){
  commands[command]();
}

runCommand(argv['_']);