Kestrel Command-line interface
========
A command-line tool for staging and deploying static files with [Kestrel Server](https://github.com/mhkeller/kestrel).

## Installation

````
npm install kestrel-cli -g
````

Note: You might have to run this as root user. To do that, simply begin the above command with `sudo` and then enter your password at the prompt. All together:

````
sudo npm install kestrel-cli -g
````

## Usage

````
Usage: swoop <command>

Commands:
  config	Configure your GitHub account and server settings
  init		Git init, create GitHub repo + hooks
  deploy	Push your project to S3.
  archive	Make your current project a branch of your archive repo.
  unschedule	Clear a project's scheduled deployments.
````

You can also set a number of flags if you don't want to be prompted for the deploy settings.

````
Options:
  --help          Display help
  -e, --env       `staging` or `prod` environment.
  -l, --local     The local path to deploy from.
  -r, --remote    The remote path to deploy to.
  -w, --when      Time to schedule a deploy in YYYY-MM-DD HH:MM format, 24-hour clock.
  -b, --branches  <current_branch_name>:<new_branch_name>

````

## Updating

Run:

````
npm update kestrel-cli -g
````

Like the command above, this might need to be run with `sudo`.

#### A note on deploying

Deploying will create a (sometimes) commit with your trigger as the message and push it to `origin master` with the following structure:

````
Push successful! [master f4i90s3] <environment>::<sync-trigger>::<local-path>::<remote-path>::<when>
````

An example would look like:

````
Push successful! [master 1f01c80] prod::my-secret-password::my-project-folder::2014/my-project-folder-on-s3::2014-08-15 14:00
````
