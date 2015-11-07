Changelog
=========

## Next

* Remove update info from help screen since `update-notifier` includes this already.
  * [b8696996af49eb5a5c8d74df86a5bc9169fa50b4](https://github.com/mhkeller/kestrel-cli/commit/b8696996af49eb5a5c8d74df86a5bc9169fa50b4)

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