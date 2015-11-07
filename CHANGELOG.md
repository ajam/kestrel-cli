Changelog
=========

## 1.2.8

> 2015-11-08

* Bug fix / enhancement: If you swoop init on a directory that already has a remote url already set, use that repo's name as the project name. If it has no `.git` folder or has one but no url, then use the local project folder name.
  * [f67a624a46a23764664180ac6657d2eac0682f10](https://github.com/mhkeller/kestrel-cli/commit/f67a624a46a23764664180ac6657d2eac0682f10)
## 1.2.7

> 2015-11-05

* Bug fix: Check for whether deploy settings exists before reading them.
  * [f67a624a46a23764664180ac6657d2eac0682f10](https://github.com/mhkeller/kestrel-cli/commit/f67a624a46a23764664180ac6657d2eac0682f10)