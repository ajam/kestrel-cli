Changelog
=========

## 1.3.0

> 2015-12-03

* Remove update info from help screen since `update-notifier` includes this already.
  * [3c1cbbf2e2c6ed91568ac585b202fc8a90e98948](https://github.com/mhkeller/kestrel-cli/commit/3c1cbbf2e2c6ed91568ac585b202fc8a90e98948)
* Add prelight checks
  * [cd20ad615dc878317138c5064c5b09af847f5846](https://github.com/mhkeller/kestrel-cli/commit/cd20ad615dc878317138c5064c5b09af847f5846)
  * [b44516a6bc970f02c249edf73799bd29ef727ec8](https://github.com/mhkeller/kestrel-cli/commit/b44516a6bc970f02c249edf73799bd29ef727ec8)
  * [0845c06f0ab8e65943ac42c456d247f7fed6ce13](https://github.com/mhkeller/kestrel-cli/commit/0845c06f0ab8e65943ac42c456d247f7fed6ce13)
  * [cb6366feee8e57a09bd2629ec29bff1e70ebfb90](https://github.com/mhkeller/kestrel-cli/commit/cb6366feee8e57a09bd2629ec29bff1e70ebfb90)
  * [6cfcc060fdb54562e2a783bfcf02620489901aee](https://github.com/mhkeller/kestrel-cli/commit/6cfcc060fdb54562e2a783bfcf02620489901aee)
* Better OS-agnostic delimiters
  * [26ef19ee05128f204a96b1d4376fd4618a28c35e](https://github.com/mhkeller/kestrel-cli/commit/26ef19ee05128f204a96b1d4376fd4618a28c35e)
  * [6c8267edc3e78257d417abfa2d7b7e67f14773fc](https://github.com/mhkeller/kestrel-cli/commit/6c8267edc3e78257d417abfa2d7b7e67f14773fc)
* Better deploy prompts
  * [0d25e1f3419bca9731da39f7e94fab7233e40fa8](https://github.com/mhkeller/kestrel-cli/commit/0d25e1f3419bca9731da39f7e94fab7233e40fa8)
* Update config-tree dep and print deployed url on successful deploy
  * [222b5801b68eb974b50cd5760435b919534cc332](https://github.com/mhkeller/kestrel-cli/commit/222b5801b68eb974b50cd5760435b919534cc332)
  * [fbb1b62afc40f3a9ba264937b077232f0d921351](https://github.com/mhkeller/kestrel-cli/commit/fbb1b62afc40f3a9ba264937b077232f0d921351)
* Allow for search in directory listings
  * [70f82a02bf74ec6835d9980744256e8bc067db56](https://github.com/mhkeller/kestrel-cli/commit/70f82a02bf74ec6835d9980744256e8bc067db56)

## 1.2.8

> 2015-11-07

* Bug fix / enhancement: If you swoop init on a directory that already has a remote url already set, use that repo's name as the project name. If it has no `.git` folder or has one but no url, then use the local project folder name.
  * [a789595e09db02e189fad218f6c6e87be1608ad9](https://github.com/mhkeller/kestrel-cli/commit/a789595e09db02e189fad218f6c6e87be1608ad9)
* Replace `fs.existsSync` with indian-ocean implementation since the former will be deprecated
  * [0124e6aacd8ab657d03d3f718efc03cc248ec08b](https://github.com/mhkeller/kestrel-cli/commit/0124e6aacd8ab657d03d3f718efc03cc248ec08b)
* Pretty print deploy settings json
  * [b8696996af49eb5a5c8d74df86a5bc9169fa50b4](https://github.com/mhkeller/kestrel-cli/commit/b8696996af49eb5a5c8d74df86a5bc9169fa50b4)

## 1.2.7

> 2015-11-05

* Bug fix: Check for whether deploy settings exists before reading them.
  * [f67a624a46a23764664180ac6657d2eac0682f10](https://github.com/mhkeller/kestrel-cli/commit/f67a624a46a23764664180ac6657d2eac0682f10)