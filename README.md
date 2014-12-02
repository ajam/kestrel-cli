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
  hook		Set up the hook on an existing repo so that the server is notified on commit. Useful for repos that were not created with `swoop init`.
  deploy	Push your project to S3.
  archive	Make your current project a branch of your archive repo.
  unschedule	Clear a project's scheduled deployments.
````

## Updating

Run:

````
npm update kestrel-cli -g
````

Like the command above, this might need to be run with `sudo`.

#### A note on deploying

Deploying will create an empty commit with your trigger as the message and push it to `origin master` with the following structure:

````
Push successful! [master f4i90s3] <environment>::<sync-trigger>::<local-path>::<remote-path>::<when>
````

An example would look like:

````
Push successful! [master 1f01c80] prod::my-secret-password::my-project-folder::2014/my-project-folder-on-s3::2014-08-15 14:00
````
