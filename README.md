# node-exiftool
A Node.js interface to the *exiftool* command-line application.

[Exiftool](http://www.sno.phy.queensu.ca/~phil/exiftool/) is an amazing tool written by
Phil Harvey in Perl which can read and write metadata to a number of file formats. It
is very powerful and allows to do such things as extracting orientation from JPEG files
uploaded to your server by users to rotate generated previews accordingly, as well
as appending copyright information to photos using
[IPTC standard](https://iptc.org/standards/photo-metadata/iptc-standard/).

This npm package has a preinstall script which will fetch exiftool's source from
[SourceForge](https://sourceforge.net/projects/exiftool/) with curl and extract it
into the `/vendor` directory. This means you don't have to have *exiftool* preinstalled
to use this software, however if you do, you can also specify a path to the executable as
shown below.

## Usage
The module spawns an exiftool process with `-stay_open True -@ -` arguments, so that
there is no overhead related to starting a new process to read every file or directory.
The package creates a process asynchronously and listens for stdout and stderr `data`
events and uses promises thus avoiding blocking the Node's event loop.
### Require
```javascript
const exiftool = require('node-exiftool');
const ep = new exiftool.ExiftoolProcess();
```
### Custom Executable
```javascript
const exiftool = require('node-exiftool');
const ep = new exiftool.ExiftoolProcess('/usr/local/exiftool');
```
### Single File
You are required to open the *exiftool* process first, after which you will be able to
read and write metadata.
```javascript
ep.open().then((pid) => {
    console.log('Started exiftool process %s', pid);
    return ep.readMetadata('photo.jpg').then((res) => {
        console.log(res);
    });
    // repeat as many times as required
}).then(() => {
    return ep.close().then(() => {
        console.log('Closed exiftool');
    });
});
```
```
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
### Directory
```javascript
ep.readMetadata('DIR').then((res) => {
    console.log(res);
});
```
```
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
### File not found
```javascript
ep.readMetadata('filenotfound.jpg').then((res) => {
    console.log(res);
});
```
```
{
  data: null,
  error: 'File not found: filenotfound.jpg'
}
```
### Incorrect file format
```javascript
ep.readMetadata('url.html').then((res) => {
    console.log(res);
});
```
```
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
You can pass arguments which you wish to use in the exiftool command call. They will
automatically be prepended with the `-` sign so you don't have to do it manually.
```javascript
// include only some tags
ep.readMetadata('photo.jpg', ['Creator', 'CreatorWorkURL', 'Orientation']).then((res) => {
    console.log(res);
});
```
```
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
// exclude some tags and groups of tags
ep.readMetadata('photo.jpg', ['-ExifToolVersion', '-File:all']).then((res) => {
    console.log(res);
});
```
```
{
  data:[
    {
      SourceFile:'photo.jpg',
      Orientation:'Rotate 90 CW',
      XResolution:72,
      YResolution:72,
      ResolutionUnit:'inches',
      YCbCrPositioning:'Centered',
      XMPToolkit:'Image::ExifTool 10.11',
      CreatorWorkURL:'https://sobesednik.media',
      Scene:'011200',
      Creator:'Anton',
      ImageSize:'500x334',
      Megapixels:0.167
    }
  ],
  error:null
}
```


### Events
You can also listen for `OPEN` and `EXIT` events. For example, if the exiftool process
crashed, you might want to restart it.
```javascript
const exiftool = require('./node-exiftool');
const ep = new exiftool.ExiftoolProcess();
const cp = require('child_process');

ep.on(exiftool.events.OPEN, (pid) => {
    console.log('Started exiftool process %s', pid);
});
ep.on(exiftool.events.EXIT, () => {
    console.log('exiftool process exited');
    ep.open();
});

ep.open().then(() => {
    cp.execSync('pkill -f exiftool');
});
```
```
Started exiftool process 95230
exiftool process exited
Started exiftool process 95232
```

## Metadata
Metadata is awesome and although it can increase the file size, it preserves copyright
and allows to find out additional information and the author of an image/movie. Let's
all use metadata.

## Resources
[Exiftool Documentation](http://www.sno.phy.queensu.ca/~phil/exiftool/exiftool_pod.html)