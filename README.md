Snowy Owl Command-line interface
========

A command-line tool for staging, hosting and deploying static files with [Snowy Owl](https://github.com/mhkeller/snowy-owl).

## Installation

````
npm install snowy-owl-cli -g
````

## Usage

All commands are accessed through `swoop`:

### Configure your installation

````
swoop config
````

### Initialize a project

````
swoop init
````

### Deploy a project

Use either the `-s` or `--sync-trigger` flags followed by your sync trigger as specified in your [Snowy Owl](https://github.com/mhkeller/snowy-owl) configuration.

Or `-h` or `--hard-trigger` to overwrite that S3 directory with the contents of your project.

````
swoop --sync-trigger sync-to-s3
````

This will create an empty commit with your trigger as the message and push it to `origin master`. Then, it will run `git commit --ammend -m "::published:(sync|hard)" --allow-empty" && git push origin master --force` to scrub your triggers from the commit history.