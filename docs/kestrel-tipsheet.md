Kestrel tipsheet
================

*Handy commands to remember while using Kestrel-cli*

You can list all commands by running `swoop` or `swoop --help`

## Updating

`sudo npm update kestrel-cli -g`

## Check the version you're using

`swoop -v` or `swoop --version`

## Initialize a project

`swoop init`.

This will:

1. Create a `.kestrel` folder in your project (if not already done)
2. Initialize `git` locally (if not already done)
3. Create a GitHub repo (if not already done)
4. Set up the webhook (if not already done)

You can run `swoop init` multiple times without worry of messing something up. If one or multiple steps have already been done, Kestrel will simply skip that step.

## Deploying

`swoop deploy`

## Archiving

`swoop archive`

## Unscheduling

`swoop unschedule`

## Update your settings

`swoop config`
