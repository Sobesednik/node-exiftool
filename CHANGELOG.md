<a name="2.1.2"></a>
# [2.1.2](https://github.com/Sobesednik/node-exiftool/compare/v2.1.1...v2.1.2) (2017-5-14)

### Repo

* [tests] update to `zoroaster` 0.4.3 and use `Exiftool` context in tests ([7e99f58](https://github.com/Sobesednik/node-exiftool/commit/7e99f58) &
[40fa597](https://github.com/Sobesednik/node-exiftool/commit/40fa597))
* [tests] filename encoding test ([ba7aa1b](https://github.com/Sobesednik/node-exiftool/commit/ba7aa1b))
* [examples] add write_metadata ([3432e63](https://github.com/Sobesednik/node-exiftool/commit/3432e63))
and callback examples ([c748783](https://github.com/Sobesednik/node-exiftool/commit/c748783))
* [readme] Improve readme with fuller examples, and better structure
([532f147](https://github.com/Sobesednik/node-exiftool/commit/532f147))

### Bugfix
* Fix orded of arguments to allow to specify `codedcharacterset=utf8` ([e15ea35](https://github.com/Sobesednik/node-exiftool/commit/e15ea35)),
closes [#22](https://github.com/Sobesednik/node-exiftool/issues/22)

### Feature
* `debug:bool` as 4th argument to `writeMetadata` to stream commands to terminal's stdout instead of
exiftool process ([e15ea35](https://github.com/Sobesednik/node-exiftool/commit/e15ea35))
* `encoding` argument for `.open(encoding)` method, to specify stdio streams' encoding and which to
use for `proc.stdin.write(data, encoding)` call - `utf8` by default, `null` to keep undefined
([e15ea35](https://github.com/Sobesednik/node-exiftool/commit/e15ea35))

<a name="2.1.1"></a>
# [2.1.1](https://github.com/Sobesednik/node-exiftool/compare/v2.1.0...v2.1.1) (2016-12-25)

### Features

* Use streams to parse exiftool std streams instead of event listeners ([a6531d8](https://github.com/Sobesednik/node-exiftool/commit/a6531d8f8))

### Code Refactoring

* Update to zoroaster 0.2.0 with test results streaming ([9edf6ac](https://github.com/Sobesednik/node-exiftool/commit/9edf6ac))
* Install _cross-env_ for testing on Windows ([a1d0441](https://github.com/Sobesednik/node-exiftool/commit/a1d0441))
* comma-dangle: always-multiline eslint rule ([39afea2](https://github.com/Sobesednik/node-exiftool/commit/39afea2))

### Repository

* Add benchmark of _stay_open_ vs _single run_ ([6d61ec8](https://github.com/Sobesednik/node-exiftool/commit/6d61ec8))

<a name="2.1.0"></a>
# [2.1.0](https://github.com/Sobesednik/node-exiftool/compare/v2.0.3...v2.1.0) (2016-11-27)

### Features

* Write metadata! ([6477aec](https://github.com/Sobesednik/node-exiftool/commit/6477aec))

### Code Refactoring

* `eslint` config ([b32729c](https://github.com/Sobesednik/node-exiftool/commit/b32729c))
* Don't publish test directory by specifying `files` property in _package.json_ ([9067100](https://github.com/Sobesednik/node-exiftool/commit/9067100))

### Bug Fixes

* Pass custom arguments with value (e.g., `ext dng`) ([4e66d0c](https://github.com/Sobesednik/node-exiftool/commit/4e66d0c)), closes [#1](https://github.com/Sobesednik/node-exiftool/issues/1)

<a name="2.0.3"></a>
# [2.0.3](https://github.com/Sobesednik/node-exiftool/compare/v2.0.2...v2.0.3) (2016-11-26)

### Bug Fixes

* Correctly parse _exiftool_ response when reading files in parallel ([c0db314](https://github.com/Sobesednik/node-exiftool/commit/c0db314)), closes [#9](https://github.com/Sobesednik/node-exiftool/issues/9)

<a name="2.0.2"></a>
# [2.0.2](https://github.com/Sobesednik/node-exiftool/compare/v2.0.1...v2.0.2) (2016-11-26)

### Code Refactoring

* Use [zoroarser](https://www.npmjs.com/package/zoroaster) for testing ([0ee8331](https://github.com/Sobesednik/node-exiftool/commit/0ee8331))

<a name="2.0.1"></a>
# [2.0.1](https://github.com/Sobesednik/node-exiftool/compare/v2.0.0...v2.0.1) (2016-11-20)

### Code Refactoring

* Use [stream-snitch](https://www.npmjs.com/package/stream-snitch) to listen for events from _exiftool_ process ([7e1542f](https://github.com/Sobesednik/node-exiftool/commit/7e1542f))

### Bug Fixes

* Don't kill the process after sending `-stay_open false` ([16485e1](https://github.com/Sobesednik/node-exiftool/commit/16485e1))

<a name="2.0.0"></a>
# [2.0.0](https://github.com/Sobesednik/node-exiftool/compare/v1.0.4...v2.0.0) (2016-08-21)

### Features

* Appveyor and travis ([bc5547c](https://github.com/Sobesednik/node-exiftool/commit/bc5547c))

### Bug Fixes

* Send `EOL` instead of `\n` in tests ([bc5547c](https://github.com/Sobesednik/node-exiftool/commit/bc5547c))

### BREAKING CHANGES

* _exiftool_ is no longer vendored with this package, use _dist-exiftool_ ([d4fcf2b](https://github.com/Sobesednik/node-exiftool/commit/d4fcf2b))

<a name="1.0.4"></a>
# [1.0.4](https://github.com/Sobesednik/node-exiftool/compare/v1.0.3...v1.0.4) (2016-08-20)

### Bug Fixes

* Use the correct EOL character depending on OS ([2a84b73](https://github.com/Sobesednik/node-exiftool/commit/2a84b73))
* Ensure exiftool quits properly on Windows by sending `--stay_open false` ([ec871e9](https://github.com/Sobesednik/node-exiftool/commit/ec871e9))

<a name="1.0.3"></a>
# [1.0.3](https://github.com/Sobesednik/node-exiftool/compare/v1.0.2...v1.0.3) (2016-08-07)

### Features

* Updated to _exiftool_ `10.25` ([59b5a18](https://github.com/Sobesednik/node-exiftool/commit/59b5a18))

<a name="1.0.2"></a>
# [1.0.2](https://github.com/Sobesednik/node-exiftool/compare/v1.0.1...v1.0.2) (2016-06-04)

### Features

* Include _exiftool_ distribution ([87ffd37](https://github.com/Sobesednik/node-exiftool/commit/87ffd37))

# 1.0.0 (2016-05-15) and 1.0.1 (2016-05-16)

Working Node.js module to run _exiftool_ and initial releases to npm
