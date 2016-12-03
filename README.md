# node-exiftool

A Node.js interface to the *exiftool* command-line application.

[![npm version](https://badge.fury.io/js/node-exiftool.svg)](https://badge.fury.io/js/node-exiftool)
[![Build Status](https://travis-ci.org/Sobesednik/node-exiftool.svg?branch=master)](https://travis-ci.org/Sobesednik/node-exiftool)
[![Build status](https://ci.appveyor.com/api/projects/status/97p9ur4loqrmfog6/branch/master?svg=true)](https://ci.appveyor.com/project/zavr-1/node-exiftool/branch/master)

[Exiftool](http://www.sno.phy.queensu.ca/~phil/exiftool/) is an amazing tool written by
Phil Harvey in Perl which can read and write metadata to a number of file formats. It
is very powerful and allows to do such things as extracting orientation from JPEG files
uploaded to your server by users to rotate generated previews accordingly, as well
as appending copyright information to photos using
[IPTC standard](https://iptc.org/standards/photo-metadata/iptc-standard/).

> Important: since version 2, _exiftool_ is not distributed with _node-exiftool_. The module
> will try to spawn `exiftool`, therefore you must install it manually. You can also use
> [dist-exiftool](https://www.npmjs.com/package/dist-exiftool) package which will install
> _exiftool_ distribution appropriate for your platform.

## Usage

The module spawns an exiftool process with `-stay_open True -@ -` arguments, so that
there is no overhead related to starting a new process to read every file or directory.
The package creates a process asynchronously and listens for stdout and stderr `data`
events and uses promises thus avoiding blocking the Node's event loop.

### Require

```javascript
const exiftool = require('node-exiftool')
const ep = new exiftool.ExiftoolProcess()
```

### Custom Executable

```javascript
const exiftool = require('node-exiftool')
const ep = new exiftool.ExiftoolProcess('/usr/local/exiftool')
```

### dist-exiftool

```bash
npm i --save dist-exiftool
```

```javascript
const exiftool = require('node-exiftool')
const exiftoolBin = require('dist-exiftool')
const ep = new exiftool.ExiftoolProcess(exiftoolBin)
```

### Writing Metadata

Since version `2.1.0`, you can write metadata. The API is:
`writeMetadata(file, data, args)`, where `file` is a string with path to your file,
`data` is an object, e.g.,

```javascript
const data = {
  all: '',
  comment: 'Exiftool rules!', // has to come after `all` in order not to be removed
  'Keywords+': [ 'keywordA', 'keywordB' ],
}
```

and `args` is an array of any other arguments you wish to pass, e.g,. `['overwrite_original']`.

```javascript
const ep = new exiftool.ExiftoolProcess()
ep
  .open()
  .then(() => ep.writeMetadata('destination.jpg', {
    all: '', // remove existing tags
    comment: 'Exiftool rules!',
    'Keywords+': [ 'keywordA', 'keywordB' ],
  }, ['overwrite_original']))
  .then(console.log)
```

```javascript
{ data: null, error: '1 image files updated' }
```

### Reading Single File

You are required to open the *exiftool* process first, after which you will be able to
read and write metadata.

```javascript
const ep = new exiftool.ExiftoolProcess()
ep
  .open()
  .then((pid) => console.log('Started exiftool process %s', pid))
  .then(() => ep.readMetadata('photo.jpg'))
  .then(console.log)
  // repeat as many times as required
  .then(() => ep.close())
  .then(() => console.log('Closed exiftool'))
```

```javascript
{
  data: [
    {
      SourceFile: 'photo.jpg',
      ExifToolVersion: 10.16,
      FileName: 'photo.jpg',
      Directory: '.',
      FileSize: '51 kB',
      FileModifyDate: '2016:05:15 22:59:45+01:00',
      FileAccessDate: '2016:05:15 23:05:27+01:00',
      FileInodeChangeDate: '2016:05:15 22:59:45+01:00',
      FilePermissions: 'rw-r--r--',
      FileType: 'JPEG',
      FileTypeExtension: 'jpg',
      MIMEType: 'image/jpeg',
      XMPToolkit: 'Image::ExifTool 10.11',
      CreatorWorkURL: 'https://sobesednik.media',
      Scene: '011200',
      Creator: 'Anton',
      ImageWidth: 500,
      ImageHeight: 333,
      EncodingProcess: 'Baseline DCT, Huffman coding',
      BitsPerSample: 8,
      ColorComponents: 3,
      YCbCrSubSampling: 'YCbCr4:2:0 (2 2)',
      ImageSize: '500x333',
      Megapixels: 0.167
    }
  ],
  error: null
}
```

### Reading Directory

```javascript
const ep = new exiftool.ExiftoolProcess()
ep
  .readMetadata('DIR')
  .then(console.log)
```

```javascript
{
  data: [
    {
      SourceFile: 'DIR/IMG_9857.JPG',
      ExifToolVersion: 10.16,
      FileName: 'IMG_9857.JPG',
      Directory: 'DIR',
      FileSize: '51 kB',
      FileModifyDate: '2016:05:15 23:06:58+01:00',
      FileAccessDate: '2016:05:15 23:06:58+01:00',
      FileInodeChangeDate: '2016:05:15 23:06:58+01:00',
      FilePermissions: 'rw-r--r--',
      FileType: 'JPEG',
      FileTypeExtension: 'jpg',
      MIMEType: 'image/jpeg',
      XMPToolkit: 'Image::ExifTool 10.11',
      CreatorWorkURL: 'https://sobesednik.media',
      Scene: '011200',
      Creator: 'Anton',
      ImageWidth: 500,
      ImageHeight: 333,
      EncodingProcess: 'Baseline DCT, Huffman coding',
      BitsPerSample: 8,
      ColorComponents: 3,
      YCbCrSubSampling: 'YCbCr4:2:0 (2 2)',
      ImageSize: '500x333',
      Megapixels: 0.167
    },
    {
      SourceFile: 'DIR/IMG_9858.JPG',
      ExifToolVersion: 10.16,
      FileName: 'IMG_9858.JPG',
      Directory: 'DIR',
      FileSize: '52 kB',
      FileModifyDate: '2016:05:15 23:06:58+01:00',
      FileAccessDate: '2016:05:15 23:06:58+01:00',
      FileInodeChangeDate: '2016:05:15 23:06:58+01:00',
      FilePermissions: 'rw-r--r--',
      FileType: 'JPEG',
      FileTypeExtension: 'jpg',
      MIMEType: 'image/jpeg',
      ExifByteOrder: 'Big-endian (Motorola, MM)',
      Orientation: 'Rotate 90 CW',
      XResolution:72,
      YResolution:72,
      ResolutionUnit: 'inches',
      YCbCrPositioning: 'Centered',
      XMPToolkit: 'Image::ExifTool 10.11',
      CreatorWorkURL: 'https://sobesednik.media',
      Scene: '011200',
      Creator: 'Anton',
      ImageWidth: 500,
      ImageHeight: 334,
      EncodingProcess: 'Baseline DCT, Huffman coding',
      BitsPerSample: 8,
      ColorComponents: 3,
      YCbCrSubSampling: 'YCbCr4:2:0 (2 2)',
      ImageSize: '500x334',
      Megapixels: 0.167
    }
  ],
  error: '1 directories scanned\n    2 image files read'
}
```

### Reading Non-existent File

```javascript
const ep = new exiftool.ExiftoolProcess()
ep
  .readMetadata('filenotfound.jpg')
  .then(console.log)
```

```javascript
{
  data: null,
  error: 'File not found: filenotfound.jpg'
}
```

### Incorrect file format

```javascript
const ep = new exiftool.ExiftoolProcess()
ep
  .readMetadata('url.html')
  .then(console.log)
```

```javascript
{
  data: [
    {
      SourceFile: 'url.html',
      ExifToolVersion: 10.16,
      FileName: 'url.html',
      Directory: '.',
      FileSize: '574 bytes',
      FileModifyDate: '2016:05:15 23:28:30+01:00',
      FileAccessDate: '2016:05:15 23:28:30+01:00',
      FileInodeChangeDate: '2016:05:15 23:28:30+01:00',
      FilePermissions: 'rw-r-----',
      Error: 'File format error'
    }
  ],
  error: null
}
```

### Custom Arguments

You can pass arguments which you wish to use in the *exiftool* command call. They will
be automatically prepended with the `-` sign so you don't have to do it manually.

```javascript
const ep = new exiftool.ExiftoolProcess()
// include only some tags
ep
  .readMetadata('photo.jpg', ['Creator', 'CreatorWorkURL', 'Orientation'])
  .then(console.log)
```

```javascript
{
  data: [
    {
      SourceFile: 'photo.jpg',
      Creator: 'Anton',
      CreatorWorkURL: 'https://sobesednik.media',
      Orientation: 'Rotate 90 CW'
    }
  ],
  error: null
}
```

```javascript
const ep = new exiftool.ExiftoolProcess()
// exclude some tags and groups of tags
ep
  .readMetadata('photo.jpg', ['-ExifToolVersion', '-File:all'])
  .then(console.log)
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
      Creator: 'Anton',
      ImageSize: '500x334',
      Megapixels: 0.167
    }
  ],
  error: null
}
```

### Events

You can also listen for `OPEN` and `EXIT` events. For example, if the exiftool process
crashed, you might want to restart it.

```javascript
const exiftool = require('node-exiftool')
const ep = new exiftool.ExiftoolProcess()
const cp = require('child_process')

ep
  .on(exiftool.events.OPEN, (pid) => {
    console.log('Started exiftool process %s', pid)
  })
ep
  .on(exiftool.events.EXIT, () => {
    console.log('exiftool process exited')
    ep.open()
  })

ep
  .open()
  .then(() => cp.execSync('pkill -f exiftool'))
```

```
Started exiftool process 95230
exiftool process exited
Started exiftool process 95232
```

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

## Metadata

Metadata is awesome and although it can increase the file size, it preserves copyright
and allows to find out additional information and the author of an image/movie. Let's
all use metadata.

## Resources
[Exiftool Documentation](http://www.sno.phy.queensu.ca/~phil/exiftool/exiftool_pod.html)
