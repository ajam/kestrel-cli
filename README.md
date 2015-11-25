Kestrel Command-line interface
========
A command-line tool for staging and deploying static files with [Kestrel Server](https://github.com/mhkeller/kestrel).

## Installation

````
npm install kestrel-cli -g
````

Note: You might have to run this as root user. To do that, simply begin the above command with `sudo` and then enter your password at the prompt.

## Usage

After installation, run `swoop config` to get all set up. 

Initialize a new project with `swoop init`, which will initialize git, create a GitHub repo, create a `.kestrel` local folder and a webhook linking this project to the [Kestrel Server](http://github.com/mhkeller/kestrel).

Below are the full commands and flag options. For more information about `swoop config` and how Kestrel works, [check out the Wiki](https://github.com/mhkeller/kestrel/wiki/Command-line-interface#3-usage).

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
  -m, --method    `sync` or `hard` deploy method.
  -l, --local     The local path to deploy from.
  -r, --remote    The remote path to deploy to.
  -w, --when      Time to schedule a deploy in YYYY-MM-DD HH:MM format, 24-hour clock.
  -b, --branches  <current_branch_name>:<new_branch_name> (note, this means you should avoid putting `:` in branch names)

````

## Updating

Run:

````
npm update kestrel-cli -g
````

Like the command above, this might need to be run with `sudo`.

#### How it works

Deploying will create a commit and push it to `origin master` with the following structure:

````
<environment>::<sync-trigger>::<local-path>::<remote-path>::<when>
````

An example would look like:

````
prod::my-sync-password::my-project-folder::2014>>my-project-folder-on-s3::2015-01-01 13:00
````

**Note**: Kestrel uses `:` and `>` to encode its commands so it's best to avoid these characters in your file names.

For more information, [check out the Wiki](https://github.com/mhkeller/kestrel/wiki/Command-line-interface#3-usage).