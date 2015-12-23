Changelog
=========

## 1.4.1

> 2015-12-23

* Don't add duplicate dirs in deploy prompts
  * [3aae2a93dbde5516147fc5528cc288acca0830c0](https://github.com/ajam/kestrel-cli/commit/3aae2a93dbde5516147fc5528cc288acca0830c0)

## 1.4.0

> 2015-12-23

* Add line breaks to make read outs more copy-pasteable
  * [54140f7d2d2ae426464ff224b6fdc28d37fd11a2](https://github.com/ajam/kestrel-cli/commit/54140f7d2d2ae426464ff224b6fdc28d37fd11a2)
* Redo `swoop init` so that each step checks if it needs to be done and reports better feedback
  * [908e2f813dffb04e5f701c9c1dd9991ffb027653](https://github.com/ajam/kestrel-cli/committ/908e2f813dffb04e5f701c9c1dd9991ffb027653)
* Improve cli usage documentation
  * [7a12fa15ce92bdd0ffe5483d607b775bf1bb64ac](https://github.com/ajam/kestrel-cli/committ/7a12fa15ce92bdd0ffe5483d607b775bf1bb64ac)
* Add `swoop redeploy` command
  * [71ec7a04b27d37c262326693bc519cb8c725da2c](https://github.com/ajam/kestrel-cli/committ/71ec7a04b27d37c262326693bc519cb8c725da2c)
* Support for deploying from arbitrary sub-directories; Tweak indent and colors on deploy flag printout
  * Closes [#25](https://github.com/ajam/kestrel-cli/issues/25)
  * [502afb1593003d8e9284e8e49313179b96393e34](https://github.com/ajam/kestrel-cli/committ/502afb1593003d8e9284e8e49313179b96393e34)
  * [1d6ae6620f01a2d7e04210e4a8e759d9b8f2eb1d](https://github.com/ajam/kestrel-cli/committ/1d6ae6620f01a2d7e04210e4a8e759d9b8f2eb1d)
* Fix bug where last output dir was not remembered; Change filtering to use name / value / short name format
  * [8c92d599721fb5781aed882e7f67ea80de79d6f9](https://github.com/ajam/kestrel-cli/committ/8c92d599721fb5781aed882e7f67ea80de79d6f9)
  
## 1.3.1

> 2015-12-03

* Add queue-async to `package.json`
  * [0590d95ac4d7da6a95061fe12e758908e6b52477](https://github.com/ajam/kestrel-cli/commit/0590d95ac4d7da6a95061fe12e758908e6b52477)

## 1.3.0

> 2015-12-03

* Remove update info from help screen since `update-notifier` includes this already.
  * [3c1cbbf2e2c6ed91568ac585b202fc8a90e98948](https://github.com/ajam/kestrel-cli/commit/3c1cbbf2e2c6ed91568ac585b202fc8a90e98948)
* Add prelight checks
  * [cd20ad615dc878317138c5064c5b09af847f5846](https://github.com/ajam/kestrel-cli/commit/cd20ad615dc878317138c5064c5b09af847f5846)
  * [b44516a6bc970f02c249edf73799bd29ef727ec8](https://github.com/ajam/kestrel-cli/commit/b44516a6bc970f02c249edf73799bd29ef727ec8)
  * [0845c06f0ab8e65943ac42c456d247f7fed6ce13](https://github.com/ajam/kestrel-cli/commit/0845c06f0ab8e65943ac42c456d247f7fed6ce13)
  * [cb6366feee8e57a09bd2629ec29bff1e70ebfb90](https://github.com/ajam/kestrel-cli/commit/cb6366feee8e57a09bd2629ec29bff1e70ebfb90)
  * [6cfcc060fdb54562e2a783bfcf02620489901aee](https://github.com/ajam/kestrel-cli/commit/6cfcc060fdb54562e2a783bfcf02620489901aee)
* Better OS-agnostic delimiters
  * [26ef19ee05128f204a96b1d4376fd4618a28c35e](https://github.com/ajam/kestrel-cli/commit/26ef19ee05128f204a96b1d4376fd4618a28c35e)
  * [6c8267edc3e78257d417abfa2d7b7e67f14773fc](https://github.com/ajam/kestrel-cli/commit/6c8267edc3e78257d417abfa2d7b7e67f14773fc)
* Better deploy prompts
  * [0d25e1f3419bca9731da39f7e94fab7233e40fa8](https://github.com/ajam/kestrel-cli/commit/0d25e1f3419bca9731da39f7e94fab7233e40fa8)
* Update config-tree dep and print deployed url on successful deploy
  * [222b5801b68eb974b50cd5760435b919534cc332](https://github.com/ajam/kestrel-cli/commit/222b5801b68eb974b50cd5760435b919534cc332)
  * [fbb1b62afc40f3a9ba264937b077232f0d921351](https://github.com/ajam/kestrel-cli/commit/fbb1b62afc40f3a9ba264937b077232f0d921351)
* Allow for search in directory listings
  * [70f82a02bf74ec6835d9980744256e8bc067db56](https://github.com/ajam/kestrel-cli/commit/70f82a02bf74ec6835d9980744256e8bc067db56)

## 1.2.8

> 2015-11-07

* Bug fix / enhancement: If you swoop init on a directory that already has a remote url already set, use that repo's name as the project name. If it has no `.git` folder or has one but no url, then use the local project folder name.
  * [a789595e09db02e189fad218f6c6e87be1608ad9](https://github.com/ajam/kestrel-cli/commit/a789595e09db02e189fad218f6c6e87be1608ad9)
* Replace `fs.existsSync` with indian-ocean implementation since the former will be deprecated
  * [0124e6aacd8ab657d03d3f718efc03cc248ec08b](https://github.com/ajam/kestrel-cli/commit/0124e6aacd8ab657d03d3f718efc03cc248ec08b)
* Pretty print deploy settings json
  * [b8696996af49eb5a5c8d74df86a5bc9169fa50b4](https://github.com/ajam/kestrel-cli/commit/b8696996af49eb5a5c8d74df86a5bc9169fa50b4)

## 1.2.7

> 2015-11-05

* Bug fix: Check for whether deploy settings exists before reading them.
  * [f67a624a46a23764664180ac6657d2eac0682f10](https://github.com/ajam/kestrel-cli/commit/f67a624a46a23764664180ac6657d2eac0682f10)