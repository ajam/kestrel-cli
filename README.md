Snowy Owl Command-line interface
========

A command-line tool for staging and deploying static files with [Snowy Owl](https://github.com/mhkeller/snowy-owl).

## Installation

````
npm install snowy-owl-cli -g
````

## Usage

````
swoop <command>

Commands:
  config    Configure your GitHub account and server settings 
  init		Git init, create GitHub repo + hooks, create archive if enabled
  archive	Delete the GitHub repo.
  deploy	Add your deploy trigger as a commit message and push. Specify trigger with options below.

Options:
  --help              Display help
  -s, --sync-trigger  Sync deploy trigger for pubishing to S3.
  -h, --hard-trigger  Hard deploy trigger for pubishing to S3.
````

#### A note on deploying

Deploying will create an empty commit with your trigger as the message and push it to `origin master`. Then, it will run `git commit --ammend -m "::published:(sync|hard)" --allow-empty" && git push origin master --force` to scrub your triggers from the commit history.
