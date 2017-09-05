/*
$ node examples/options
> Opened exiftool, pid: 18311
ctrl-c
$ ps x | grep perl | grep exiftool
>
$ DETACHED=1 node examples/options
> Opened exiftool, pid: 18342
ctrl-c
$ ps x | grep perl | grep exiftool
> 18342   ??  Ss     0:00.25 /usr/bin/perl -w /usr/local/bin/exiftool -echo2 1504095369135 -stay_open True -@ -
*/

// const exiftoolBin = require('dist-exiftool')
const exiftoolBin = require('exiftool-context').exiftoolBin
const exiftool = require('../.')
const options = {
    detached: !!process.env.DETACHED,
}
const ep = new exiftool.ExiftoolProcess(exiftoolBin)

ep
    .open(options)
    .then((pid) => {
        console.log('Opened exiftool, pid: %s, parent: %s', pid, process.pid)
    })
    .catch(console.error)
