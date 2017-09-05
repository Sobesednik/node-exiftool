# node-exiftool

A Node.js interface to the *exiftool* command-line application.

[![npm version](https://badge.fury.io/js/node-exiftool.svg)](https://badge.fury.io/js/node-exiftool)
[![Build Status](https://travis-ci.org/Sobesednik/node-exiftool.svg?branch=master)](https://travis-ci.org/Sobesednik/node-exiftool)
[![Build status](https://ci.appveyor.com/api/projects/status/97p9ur4loqrmfog6/branch/master?svg=true)](https://ci.appveyor.com/project/zavr-1/node-exiftool/branch/master)

[Exiftool](http://www.sno.phy.queensu.ca/~phil/exiftool/) is an amazing tool
written by Phil Harvey in Perl which can read and write metadata to a number of
file formats. It is very powerful and allows to do such things as extracting
orientation from JPEG files uploaded to your server by users to rotate generated
previews accordingly, as well as appending copyright information to photos using
[IPTC standard](https://iptc.org/standards/photo-metadata/iptc-standard/).

> _exiftool_ is not distributed with _node-exiftool_. The module will try to
> spawn `exiftool`, therefore you must install it manually. You can also use
> [dist-exiftool](https://www.npmjs.com/package/dist-exiftool) package which
> will install _exiftool_ distribution appropriate for your platform. See below
> for details about how to use `node-exiftool` with `dist-exiftool`.

## Usage

The module spawns an exiftool process with `-stay_open True -@ -` arguments, so
that there is no overhead related to starting a new process to read every file
or directory. The package creates a process asynchronously and listens for
stdout and stderr `data` events and uses promises thus avoiding blocking the
Node's event loop.

### Require

By default, the executable is hard-coded to be just `exiftool`. You must have it
you path for this method to work.

```javascript
const exiftool = require('node-exiftool')
const ep = new exiftool.ExiftoolProcess()
```

### Custom Executable

It is possible to specify a custom executable.

```javascript
const exiftool = require('node-exiftool')
const ep = new exiftool.ExiftoolProcess('/usr/local/exiftool')
```

### dist-exiftool

Or you can install `dist-exiftool`, which allows to install `exiftool` from
_npm_.

```bash
npm i --save dist-exiftool
```

```javascript
const exiftool = require('node-exiftool')
const exiftoolBin = require('dist-exiftool')
const ep = new exiftool.ExiftoolProcess(exiftoolBin)
```

### Opening and Closing

After creating an instance of `ExiftoolProcess`, it must be opened. When
finished working with it, it should be closed, when `-stay_open False` will be
written to its _stdin_ to exit the process.

```javascript
const exiftool = require('node-exiftool')
const ep = new exiftool.ExiftoolProcess()

ep
  .open()
  // read and write metadata operations
  .then(() => ep.close())
  .then(() => console.log('Closed exiftool'))
  .catch(console.error)
```

#### Passing Options

`exiftool` will be open with `child_process.spawn`, and you can specify options
object which will passed to the `spawn` method.

```javascript
const exiftool = require('node-exiftool')
const options = {
  detached: true,
  env: Object.assign({}, process.env, {
    ENVIRONMENT_VARIABLE: 1,
  }),
}
const ep = new exiftool.ExiftoolProcess()

ep
  .open(options)
  .then(() => ep.close())
  .catch(console.error)
```

Since passing options is available, a check will be made to make sure that
`stderr` and `stdout` streams are readable, and `stdin` is writable. Therefore,
you cannot pass `{ stdio: 'ignore' }` as an option.

### Reading Metadata

You are required to open the *exiftool* process first, after which you will be able to
read and write metadata.

```javascript
const exiftool = require('node-exiftool')
const ep = new exiftool.ExiftoolProcess()

ep
  .open()
  // display pid
  .then((pid) => console.log('Started exiftool process %s', pid))
  .then(() => ep.readMetadata('photo.jpg', ['-File:all']))
  .then(console.log, console.error)
  .then(() => ep.readMetadata('photo2.jpg', ['-File:all']))
  .then(console.log, console.error)
  .then(() => ep.close())
  .then(() => console.log('Closed exiftool'))
  .catch(console.error)
```

```javascript
Started exiftool process 29671
{ data:
   [ { SourceFile: 'image.jpg',
       ExifToolVersion: 10.4,
       XMPToolkit: 'Image::ExifTool 10.40',
       CreatorWorkURL: 'https://sobesednik.media',
       Scene: '011200',
       Creator: 'Photographer Name',
       Author: 'Author',
       ImageSize: '500x333',
       Megapixels: 0.167 } ],
  error: null }
{ data:
   [ { SourceFile: 'image2.jpg',
       ExifToolVersion: 10.4,
       Orientation: 'Rotate 90 CW',
       XResolution: 72,
       YResolution: 72,
       ResolutionUnit: 'inches',
       YCbCrPositioning: 'Centered',
       XMPToolkit: 'Image::ExifTool 10.40',
       CreatorWorkURL: 'https://sobesednik.media',
       Scene: '011200',
       Creator: 'Photographer Name',
       Author: 'Author',
       ImageSize: '500x334',
       Megapixels: 0.167 } ],
  error: null }
Closed exiftool
```

### Reading Metadata from a Readable Stream

You can read metadata from a stream the same way you read a file metadata.
`node-exiftool` will create a temporary file and pipe your `Readable` into it,
then pass the path to `exiftool`. After the result is received from `exiftool`,
the  temp file will be removed.

```javascript
const exiftoolBin = require('dist-exiftool')
const exiftool =  require('exiftool')
const fs = require('fs')
const path = require('path')

const ep = new exiftool.ExiftoolProcess(exiftoolBin)

const PHOTO_PATH = path.join(__dirname, 'photo.jpg')
const rs = fs.createReadStream(PHOTO_PATH)

ep.open()
    .then(() => ep.readMetadata(rs, ['-File:all']))
    .then((res) => {
        console.log(res)
    })
    .then(() => ep.close(), () => ep.close())
    .catch(console.error)
```

```fs
{ data:
   [ { SourceFile: '/var/folders/s0/truth-covered-in-security/T/wrote-44788.data',
       ExifToolVersion: 10.53,
       XResolution: 72,
       YResolution: 72,
       ResolutionUnit: 'inches',
       YCbCrPositioning: 'Centered',
       Copyright: 'sobesednik.media 2017',
       XMPToolkit: 'Image::ExifTool 10.40',
       Author: 'Author <author@sobes.io>',
       ImageSize: '362x250',
       Megapixels: 0.09 } ],
  error: null }
```

### Writing Metadata

You can write metadata with `node-exiftool`. The API is:
`ep.writeMetadata(file:string, data:object, args:array)`,
where `file` is a path to the file, `data` is metadata to add, e.g.,

```javascript
const data = {
  all: '',
  comment: 'Exiftool rules!', // has to come after `all` in order not to be removed
  'Keywords+': [ 'keywordA', 'keywordB' ],
}
```

and `args` is an array of any other arguments you wish to pass, e.g,. `['overwrite_original']`.

```javascript
const exiftool = require('node-exiftool')
const ep = new exiftool.ExiftoolProcess()

ep
  .open()
  .then(() => ep.writeMetadata('destination.jpg', {
    all: '', // remove existing tags
    comment: 'Exiftool rules!',
    'Keywords+': [ 'keywordA', 'keywordB' ],
  }, ['overwrite_original']))
  .then(console.log, console.error)
  .then(() => ep.close())
  .catch(console.error)
```

```javascript
{ data: null, error: '1 image files updated' }
```

### Reading Directory

```javascript
const exiftool = require('node-exiftool')
const ep = new exiftool.ExiftoolProcess()

ep
  .open()
  // read directory
  .then(() => ep.readMetadata('DIR', ['-File:all']))
  .then(console.log, console.error)
  .then(() => ep.close())
  .catch(console.error)
```

```javascript
{
  data: [
    { SourceFile: 'DIR/IMG_9859.JPG',
       ExifToolVersion: 10.4,
       Orientation: 'Rotate 90 CW',
       XResolution: 72,
       YResolution: 72,
       ResolutionUnit: 'inches',
       YCbCrPositioning: 'Centered',
       XMPToolkit: 'Image::ExifTool 10.40',
       CreatorWorkURL: 'https://sobesednik.media',
       Scene: '011200',
       Creator: 'Photographer Name',
       Author: 'Author',
       ImageSize: '500x334',
       Megapixels: 0.167 },
     { SourceFile: 'DIR/IMG_9860.JPG',
       ExifToolVersion: 10.4,
       XMPToolkit: 'Image::ExifTool 10.40',
       CreatorWorkURL: 'https://sobesednik.media',
       Scene: '011200',
       Creator: 'Photographer Name',
       Author: 'Author',
       ImageSize: '500x334',
       Megapixels: 0.167 }
  ],
  error: '1 directories scanned\n    2 image files read'
}
```

### Reading Non-existent File

```javascript
const exiftool = require('node-exiftool')
const ep = new exiftool.ExiftoolProcess()

ep
  .open()
  // try to read file which does not exist
  .then(() => ep.readMetadata('filenotfound.jpg'))
  .then(console.log, console.error)
  .then(() => ep.close())
  .catch(console.error)
```

```javascript
{
  data: null,
  error: 'File not found: filenotfound.jpg'
}
```

### Custom Arguments

You can pass arguments which you wish to use in the *exiftool* command call. They will
be automatically prepended with the `-` sign so you don't have to do it manually.

```javascript
const exiftool = require('node-exiftool')
const ep = new exiftool.ExiftoolProcess()

ep
  .open()
  // include only some tags
  .then(() => ep.readMetadata('photo.jpg', ['Creator', 'CreatorWorkURL', 'Orientation']))
  .then(console.log, console.error)
  .then(() => ep.close())
  .catch(console.error)
```

```javascript
{
  data: [
    {
      SourceFile: 'photo.jpg',
      Creator: 'Photographer Name',
      CreatorWorkURL: 'https://sobesednik.media',
      Orientation: 'Rotate 90 CW'
    }
  ],
  error: null
}
```

```javascript
const exiftool = require('node-exiftool')
const ep = new exiftool.ExiftoolProcess()

ep
  .open()
  // exclude some tags and groups of tags
  .then(() => ep.readMetadata('image.jpg', ['-ExifToolVersion', '-File:all']))
  .then(console.log, console.error)
  .then(() => ep.close())
  .catch(console.error)

```

```javascript
{
  data: [
    {
      SourceFile: 'photo.jpg',
      Orientation: 'Rotate 90 CW',
      XResolution: 72,
      YResolution: 72,
      ResolutionUnit: 'inches',
      YCbCrPositioning: 'Centered',
      XMPToolkit: 'Image::ExifTool 10.11',
      CreatorWorkURL: 'https://sobesednik.media',
      Scene: '011200',
      Creator: 'Photographer Name',
      ImageSize: '500x334',
      Megapixels: 0.167
    }
  ],
  error: null
}
```


### Reading HTML

```javascript
const exiftool = require('node-exiftool')
const ep = new exiftool.ExiftoolProcess()

ep
  .open()
  .then(() => ep.readMetadata('url.html', ['-File:all']))
  .then(console.log, console.error)
  .then(() => ep.close())
  .catch(console.error)
```

```javascript
{ data:
   [ { SourceFile: 'url.html',
       ExifToolVersion: 10.4,
       Title: 'Some web page',
       Keywords: 'fire, in, your, eyes, etc.',
       Description: 'Programming: Official sponsor of Open Source since ever.' } ],
  error: null }
```

`html`:

```html
<!DOCTYPE html>

<html>
    <head>
        <title>Some web page</title>
        <meta name="keywords" content="fire, in, your, eyes, etc.">
        <meta name="description" content="Programming: Official sponsor of Open Source since ever.">
    </head>
    <body>
        <p>Hello world</p>
    </body>
</html>
```

### Events

You can also listen for `OPEN` and `EXIT` events. For example, if the exiftool process
crashed, you might want to restart it.

```javascript
const exiftool = require('node-exiftool')
const cp = require('child_process')

function killProcess(name) {
  return new Promise((resolve, reject) => {
    cp.exec(`pkill -f ${name}`, (err, stdout, stderr) => {
      if(err) return reject(err)
      return resolve({ stdout, stderr })
    })
  })
}

function openAndKill(_ep) {
  return _ep
    .open()
    .then(() => killProcess('exiftool'))
    .catch(console.error)
}

const ep = new exiftool.ExiftoolProcess()

ep.on(exiftool.events.OPEN, (pid) => {
  console.log('Started exiftool process %s', pid)
})

ep.on(exiftool.events.EXIT, () => {
  console.log('exiftool process exited')
  return new Promise(r => setTimeout(r, 200))
    .then(() => openAndKill(ep))
})

openAndKill(ep)
```

```
Started exiftool process 28566
exiftool process exited
Started exiftool process 28569
exiftool process exited
...
```

### Stream Encoding

By default, `setEncoding('utf8')` will be called on `stdout` and `stderr`
streams, and `stdin` will be written with `utf8` encoding (this is Node's
default on a Mac at least). If you wish to use system's default encoding, pass
`null` when opening the process. If you want to set some other encoding, specify
it as a string.
[Node's supported encodings](https://github.com/nodejs/node/blob/master/lib/net.js#L789).

```js
const exiftool = require('node-exiftool')
const ep = new exiftool.ExiftoolProcess()

Promise.resolve()
  .then(() =>
    // streams' encoding is utf8, next stdin write with utf8
    ep.open('utf8').then(() => ep.close())
  )
  .then(() =>
    // encoding will explicitly be not set
    ep.open(null).then(() => ep.close())
  )
  .then(() =>
    // encoding will be set to default utf8
    ep.open().then(() => ep.close())
  )
  .catch(console.error)
```

### Writing Tags for Adobe in UTF8

Some metadata must be written in `utf8` encoding, for example to be recognized
by Adobe products. However, IPTC fields are encoded in _Latin1_, so you need to
explicitly pass `codedcharacterset=utf8` argument. For example,
`Caption-Abstract` is an
[IPTC tag](http://www.sno.phy.queensu.ca/~phil/exiftool/TagNames/IPTC.html), so
to write it in _utf8_, do the following:

```js
const exiftool = require('node-exiftool')
const ep = new exiftool.ExiftoolProcess()

const metadata = {
    all: '', // remove all metadata at first
    Title: 'åäö',
    LocalCaption: 'local caption',
    'Caption-Abstract': 'Câptïön \u00C3bstráct: åäö',
    Copyright: '2017 ©',
    'Keywords+': [ 'këywôrd \u00C3…', 'keywórdB ©˙µå≥' ],
    Creator: 'Mr Author',
    Rating: 5,
}

const file = 'file.jpg'

ep
  .open()
  // use codedcharacterset
  .then(() => ep.writeMetadata(file, metadata, ['codedcharacterset=utf8']))
  .then(console.log, console.error)
  .then(() => ep.close())
  .catch(console.error)
```

### Using Detached Mode on Windows

You can spawn exiftool with `{ detached: true }` option if you need to manually
handle its exit independent of your application. On Linux, the new process
will be made a leader of its process group, and will not quit with the Node
app. On Windows, the process will not quit either, however, there will be two
`exiftool` processes: one returned by the `child_process.spawn` method, and
a second one, started by `exiftool.exe` itself. There is also going to appear
`conhost.exe`, if the parent node application is not attached to a terminal.

```powershell
wmic process where "caption='node.exe' or caption='exiftool.exe' or caption='conhost.exe'" get caption,processid,parentprocessid
```

```powershell
Caption       ParentProcessId  ProcessId
node.exe      3464             5752
exiftool.exe  5752             6096
exiftool.exe  6096             4588
conhost.exe   4588             4016
```

Because Windows will throw an error when trying to kill a process group by
passing `-pid` to `process.kill`, you should find the second exiftool process by
its parent pid (returned with `ep.open()`), and kill it manually, e.g., with
`cp.exec('taskkill /F /T /PID ${pid}')`. Check the
[`detached-true` test](test/spec/detached-true.js) for more insight.

### Reading utf8 Encoded Filename on Windows

If you're on Windows and your active page is different from `utf8`, you should
pass `charset filename=utf8` when trying to read a file. It shouldn't be a
problem on a Mac.

An error you can see is: `File not found: Fọto.jpg` or whatever filename you
have. To fix it, set filename charset to `utf8`.

```js
const exiftool = require('node-exiftool')
const ep = new exiftool.ExiftoolProcess()

ep
  .open()
  .then(() => ep.readMetadata('phôtò.jpg', ['charset filename=utf8']))
  .then(console.log, console.error)
  .then(() => ep.close())
  .catch(console.error)
```

To print code page number on Windows, do

```js
const child_process = require('child_process')
function printCHCP() {
  return new Promise((resolve, reject) => {
    child_process.exec('chcp', (err, stdout, stderr) => {
      if (err) return reject(err)
      resolve({ stdout, stderr })
    })
  })
}
printCHCP().then(console.log, console.error)
```

Example output: `Active code page: 437`. `utf8`'s number is `65001` (on win)

- [Special characters don't display properly in my Windows console](http://www.sno.phy.queensu.ca/~phil/exiftool/faq.html#Q18)
- [Passing filenames with Unicode characters to ExifTool](http://u88.n24.queensu.ca/exiftool/forum/index.php?topic=6721.0)

### How Does It Work

For example, when trying to write metadata:

```js
const exiftool = require('node-exiftool')
const ep = new exiftool.ExiftoolProcess()

ep
  .open()
  .then(() => ep.writeMetadata('destination.jpg', {
    all: '', // remove existing tags
    comment: 'Exiftool example',
    'Keywords+': [ 'keywordA', 'keywordB' ],
  }, ['overwrite_original']))
  .then(console.log, console.error)
  .then(() => ep.close())
  .catch(console.error)
```

Internally, the following command will be sent to exiftool's `stdin` when it's open:

```
-all=
-comment=Exiftool example
-Keywords+=keywordA
-Keywords+=keywordB
-overwrite_original
-json
-s
destination.jpg
-echo1
{begin529963}
-echo2
{begin529963}
-echo4
{ready529963}
-execute529963
```

And the write promise will be resolved when the process writes

```
{begin669103}
{ready669103}
```

to `stdout`, and

```
{begin513858}
    1 image files updated
{ready513858}
```

to `stderr`. There's a regex transform stream which is available for reading
when it sees a block like `{begin<N>}...some data...{ready<N>}`. Once both
`stderr` and `stdout` data have been received, the promise returned by
`writeMetadata` function will be resolved.

## Benchmark

To start the benchmark, execute `npm run bench`. It will scan all files
in the `benchmark/photos` directory, and if none was found, will work on test
fixtures. Here are some of our results:

```
> node benchmark/run

/node-exiftool/benchmark/photos/IMG_3051.JPG: 168ms
/node-exiftool/benchmark/photos/IMG_3052.JPG: 166ms
/node-exiftool/benchmark/photos/IMG_3053.JPG: 168ms
/node-exiftool/benchmark/photos/IMG_3054.JPG: 166ms
/node-exiftool/benchmark/photos/IMG_3055.JPG: 165ms
/node-exiftool/benchmark/photos/IMG_3056.JPG: 158ms
/node-exiftool/benchmark/photos/IMG_3057.JPG: 158ms
/node-exiftool/benchmark/photos/IMG_3058.JPG: 162ms
/node-exiftool/benchmark/photos/IMG_3059.JPG: 158ms
/node-exiftool/benchmark/photos/IMG_3060.JPG: 158ms
/node-exiftool/benchmark/photos/IMG_3061.JPG: 157ms
/node-exiftool/benchmark/photos/IMG_3051.JPG: 65ms
/node-exiftool/benchmark/photos/IMG_3052.JPG: 20ms
/node-exiftool/benchmark/photos/IMG_3053.JPG: 22ms
/node-exiftool/benchmark/photos/IMG_3054.JPG: 23ms
/node-exiftool/benchmark/photos/IMG_3055.JPG: 22ms
/node-exiftool/benchmark/photos/IMG_3056.JPG: 22ms
/node-exiftool/benchmark/photos/IMG_3057.JPG: 22ms
/node-exiftool/benchmark/photos/IMG_3058.JPG: 22ms
/node-exiftool/benchmark/photos/IMG_3059.JPG: 20ms
/node-exiftool/benchmark/photos/IMG_3060.JPG: 21ms
/node-exiftool/benchmark/photos/IMG_3061.JPG: 20ms

Exiftool
Read 11 files
Total time: 1784ms
Average time: 162.18ms

Exiftool Open
Read 11 files
Total time: 378ms
Average time: 34.36ms

Exiftool Open was faster by 471%
```

## Testing

We're using [`exiftool-context`](https://www.npmjs.com/package/exiftool-context)
to test with [`zoroaster`](https://www.npmjs.com/package/zoroaster).

Make sure to do the following in tests, when testing current version:

```js
const context = require('exiftool-context')
const exiftool = require('../../src/')

context.globalExiftoolConstructor = exiftool.ExiftoolProcess
```

Otherwise, the context will use a stable version which it installs
independently.

## Metadata

Metadata is awesome and although it can increase the file size, it preserves
copyright and allows to find out additional information and the author of an
image/movie. Let's all use metadata.

## Resources
[Exiftool Documentation](http://www.sno.phy.queensu.ca/~phil/exiftool/exiftool_pod.html)
