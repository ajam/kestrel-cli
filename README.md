Kestrel Command-line interface
========

##### Still under development.

A command-line tool for staging and deploying static files with [Kestrel Server](https://github.com/mhkeller/kestrel).

## Installation

````
npm install kestrel-cli -g
````

## Usage

````
Usage: swoop <command>

Commands:
  config	Configure your GitHub account and server settings
  init		Git init, create GitHub repo + hooks
  hook		Set up the hook on an existing repo so that the server is notified on commit. Useful for repos that were not created with `init`.
  deploy	Add your deploy trigger as a commit message and push. Specify trigger with options below.
  archive	Make your current project a branch of your archives repo. Specify archive repo in config.json and branch names with `-b` or `--branches`

Options:
  --help              Display help
  -s, --sync-trigger  Sync deploy trigger for pubishing to S3.
  -h, --hard-trigger  Hard deploy trigger for pubishing to S3.
  -d, --dir           Deploy a sub-directory of this repo.
  -b, --branches      <current_branch_name>:<new_branch_name>

````

#### A note on deploying

Deploying will create an empty commit with your trigger as the message and push it to `origin master`. Then, it will run `git commit --ammend -m "::published:(sync|hard)" --allow-empty" && git push origin master --force` to scrub your triggers from the commit history.
