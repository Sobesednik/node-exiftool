const assert = require('assert')
const Readable = require('stream').Readable
const BeginReadySnitch = require('../../src/begin-ready-snitch')

const commandNumber = 376080

const data = `
[{
  "SourceFile": "test/fixtures/CANON/IMG_9857.JPG",
  "ExifToolVersion": 10.25,
  "FileName": "IMG_9857.JPG",
  "Directory": "test/fixtures/CANON",
  "FileSize": "51 kB",
  "FileModifyDate": "2016:05:16 00:25:40+01:00",
  "FileAccessDate": "2016:11:26 01:20:48+00:00",
  "FileInodeChangeDate": "2016:05:16 00:25:40+01:00",
  "FilePermissions": "rw-r--r--",
  "FileType": "JPEG",
  "FileTypeExtension": "jpg",
  "MIMEType": "image/jpeg",
  "XMPToolkit": "Image::ExifTool 10.11",
  "CreatorWorkURL": "https://sobesednik.media",
  "Scene": "011200",
  "Creator": "Anton",
  "ImageWidth": 500,
  "ImageHeight": 333,
  "EncodingProcess": "Baseline DCT, Huffman coding",
  "BitsPerSample": 8,
  "ColorComponents": 3,
  "YCbCrSubSampling": "YCbCr4:2:0 (2 2)",
  "ImageSize": "500x333",
  "Megapixels": 0.167
}]
`
    .trim()

const s = `
{begin${commandNumber}}
${data}
{ready${commandNumber}}
`
    .trim()

module.exports = {
    'emits event on data': () => {
        const rs = Readable()
        rs._read = () => {
            rs.push(s)
            rs.push(null)
        }
        const brs = new BeginReadySnitch(rs)
        return new Promise(resolve => brs.on('data', resolve))
            .then((res) => {
                assert(res.commandNumber === commandNumber)
                assert(res.data === data)
            })
    },
}
