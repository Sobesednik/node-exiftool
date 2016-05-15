'use strict';

const chai = require('chai');
const expect = chai.expect;
const should = chai.should();
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
const exiftool = require('../index')
const path = require('path');
const fs = require('fs');

describe('exiftool unit test', function() {
    const fixturesDir = 'fixtures';
    const testDir = 'test';
    const fileDoesNotExist = path.join(testDir, fixturesDir, 'no_such_file.jpg');
    const fileDoesNotExist2 = path.join(testDir, fixturesDir, 'no_such_file2.jpg');
    const jpegFile = path.join(testDir, fixturesDir,'CANON', 'IMG_9858.JPG');
    const jpegFile2 = path.join(testDir, fixturesDir,'CANON', 'IMG_9859.JPG');
    const folder = path.join(testDir, fixturesDir, 'CANON');
    const emptyFolder = path.join(testDir, fixturesDir, 'empty');

    describe('Class', function() {
        let ep;
        beforeEach(function() {
            ep = new exiftool.ExiftoolProcess();
        });
        afterEach(function() {
            if(ep.isOpen) {
                return ep.close();
            }
        });
        it('creates new ExiftoolProcess object with default bin', function() {
            expect(ep instanceof exiftool.ExiftoolProcess).to.be.true;
            expect(ep.isOpen).to.be.false;
            expect(ep._bin).to.be.equal(exiftool.EXIFTOOL_PATH);
        });
        it('creates new ExiftoolProcess object with specific bin', function() {
            const bin = 'notexiftool';
            ep = new exiftool.ExiftoolProcess(bin);
            expect(ep instanceof exiftool.ExiftoolProcess).to.be.true;
            expect(ep.isOpen).to.be.false;
            expect(ep._bin).to.be.equal(bin);
        });

        describe('open', function() {
            it('opens exiftool', function() {
                return ep.open().then((pid) => {
                    ep._process.should.contain.keys(['stdin','stdout','stdout']);
                    ep._process.stdout.readable.should.be.true;
                    ep._process.stderr.readable.should.be.true;
                    ep._process.stdin.writable.should.be.true;
                    ep.isOpen.should.be.true;
                    expect(pid).to.be.a('number');
                    pid.should.equal(ep._process.pid);
                });
            });
            it('returns rejected promise when exiftool executable not found', function() {
                ep = new exiftool.ExiftoolProcess('notexiftool');
                return ep.open().should.be.rejected;
            });
            it('emits OPEN event with PID', function() {
                const p = new Promise((resolve) => {
                    ep.on(exiftool.events.OPEN, resolve);
                });
                return ep.open().then(() => {
                    return p.then((pid) => {
                        expect(pid).to.be.a('number');
                        pid.should.equal(ep._process.pid);
                    });
                });
            });
            it('returns rejected promise when process is open already', function() {
                return ep.open().then(() => {
                    return ep.open().should.be.rejectedWith('Exiftool process is already open');
                });
            });
        });

        describe('close', function() {
            it('closes the process', function() {
                return ep.open().then(() => {
                    ep._process.should.contain.keys(['stdin','stdout','stdout']);
                    ep._process.stdout.readable.should.be.true;
                    ep._process.stderr.readable.should.be.true;
                    ep._process.stdin.writable.should.be.true;
                    ep.isOpen.should.be.true;
                    return ep.close().then(() => {
                        ep._process.should.contain.keys(['stdin','stdout','stdout']);
                        ep._process.stdout.readable.should.be.false;
                        ep._process.stderr.readable.should.be.false;
                        ep._process.stdin.writable.should.be.false;
                        ep.isOpen.should.be.false;
                    });
                });
            });
            it('rejects pending deferreds', function() {
                return ep.open().then(() => {
                    const p = ep.readMetadata(jpegFile);
                    const p2 = ep.readMetadata(jpegFile2);
                    return ep.close().then(() => {
                        return Promise.all([
                            p.should.be.rejectedWith('The process has exited'),
                            p2.should.be.rejectedWith('The process has exited'),
                        ]);
                    });
                });
            });
            it('emits EXIT event', function() {
                const p = new Promise((resolve) => {
                    ep.on(exiftool.events.EXIT, resolve)
                });
                return ep.open().then(() => {
                    return ep.close().then(() => {
                        return p;
                    });
                });
            });
            it('set open to false when exiftool process is killed', function() {
                return ep.open().then(() => {
                    const p = new Promise((resolve, reject) => {
                        ep._process.on('exit', resolve);
                    });
                    ep._process.kill();
                    return p.then(() => {
                        ep.isOpen.should.be.false;
                    });
                })
            });
            it('returns rejected promise when process not open', function() {
                return ep.close().should.be.rejectedWith('Exiftool process is not open');
            });
        });

        describe('readMetadata', function() {
            it('returns rejected promise when trying to execute when not open', function() {
                return ep.readMetadata(jpegFile).should.be.rejected;
            });
            it('reads metadata of files in a directory', function() {
                return ep.open().then(() => {
                    return ep.readMetadata(folder).then((res) => {
                        expect(res.data).to.be.not.null;
                        res.data.should.be.an('array');
                        res.data.should.have.length(5);
                        res.data.forEach((file) => {
                            file.FileType.should.equal('JPEG');
                            file.MIMEType.should.equal('image/jpeg');
                            file.CreatorWorkURL.should.equal('https://sobesednik.media');
                            file.Creator.should.equal('Anton');
                            file.Scene.should.equal('011200');
                        });
                        expect(res.error).to.be.not.null;
                        res.error.should.equal('1 directories scanned\n    5 image files read');
                    });
                });
            });
            it('returns null data for empty directory and info error', function() {
                return ep.open().then(() => {
                    return ep.readMetadata(emptyFolder).then((res) => {
                        expect(res.data).to.be.null;
                        expect(res.error).to.be.not.null;
                        res.error.should.equal('1 directories scanned\n    0 image files read');
                    });
                });
            });
            it('allows to specify arguments', function() {
                return ep.open().then(() => {
                    return ep.readMetadata(jpegFile, ['Orientation', 'n']).then((res) => {
                        expect(res.error).to.be.null;
                        expect(res.data).to.be.not.null;
                        res.data.should.eql([{
                            SourceFile: 'test/fixtures/CANON/IMG_9858.JPG',
                            Orientation: 6,
                        }]);
                    });
                });
            });
            it('reads metadta of a file', function() {
                return ep.open().then(() => {
                    return ep.readMetadata(jpegFile).then((res) => {
                        expect(res.error).to.be.null;
                        expect(res.data).to.be.not.null;
                        res.data.should.be.an('array');
                        res.data[0].should.contain({
                            SourceFile: 'test/fixtures/CANON/IMG_9858.JPG',
                            FileName: 'IMG_9858.JPG',
                            Directory: 'test/fixtures/CANON',
                            FileSize: '52 kB',
                            FileType: 'JPEG',
                            FileTypeExtension: 'jpg',
                            MIMEType: 'image/jpeg',
                            ExifByteOrder: 'Big-endian (Motorola, MM)',
                            Orientation: 'Rotate 90 CW',
                            XResolution: 72,
                            YResolution: 72,
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
                            Megapixels: 0.167,
                        });
                    });
                });
            })
            it('returns promise with null data and error when file not found', function() {
                return ep.open().then(() => {
                    return ep.readMetadata(fileDoesNotExist).then((res) => {
                        res.should.contain.keys(['data','error']);
                        expect(res.data).to.be.null;
                        expect(res.error).to.be.not.null;
                        res.error.should.equal(`File not found: ${fileDoesNotExist}`);
                    });
                });
            });
            it('works fine with 2 simultaneous requests', function() {
                return ep.open().then(() => {
                    return Promise.all([
                        ep.readMetadata(fileDoesNotExist),
                        ep.readMetadata(fileDoesNotExist2),
                    ]).then((res) => {
                        res[0].should.contain.keys(['data','error']);
                        expect(res[0].data).to.be.null;
                        expect(res[0].error).to.be.not.null;
                        res[0].error.should.equal(`File not found: ${fileDoesNotExist}`);

                        res[1].should.contain.keys(['data','error']);
                        expect(res[1].data).to.be.null;
                        expect(res[1].error).to.be.not.null;
                        res[1].error.should.equal(`File not found: ${fileDoesNotExist2}`);
                    });
                });
            });
        });

        describe('appending stream data', function() {
            it('initialises string variables', function() {
                return ep.open().then(() => {
                    ep._stdoutData.should.equal('');
                    ep._stderrData.should.equal('');
                });
            });
            it('appends data on stderr', function() {
                return ep.open().then(() => {
                    const stdData = 'hello';
                    const stdErr = 'world';
                    ep._process.stdin.write(`-echo\n${stdData}\n`);
                    ep._process.stdin.write(`-echo2\n${stdErr}\n`);
                    ep._process.stdin.write('-execute\n');
                    const stdDataPromise = new Promise((resolve, reject) => {
                        ep._process.stdout.on('data', resolve);
                    });
                    const stdErrPromise = new Promise((resolve, reject) => {
                        ep._process.stderr.on('data', resolve);
                    });
                    return Promise.all([stdDataPromise, stdErrPromise]).then((res) => {
                        ep._stdoutData.should.equal('hello\n{ready}\n');
                        ep._stderrData.should.equal('world\n');
                    });
                });
            });
            it('stores CommandDeferred in an array and removes it upon fulfillment', function() {
                return ep.open().then(() => {
                    const p = ep.readMetadata(jpegFile);
                    ep._deferreds.should.be.an('array');
                    ep._deferreds.length.should.equal(1);
                    ep._deferreds[0].should.be.instanceof(exiftool.CommandDeferred);
                    ep._deferreds[0].promise.should.equal(p);
                    return p.then((res) => {
                        ep._deferreds.length.should.equal(0);
                    });
                });
            });
        });
    });

    describe('CommandDeferred', function() {
        describe('makeRegExp', function() {
            it('works on single begin and ready', function() {
                const s = '{begin58600}\n{ready58600}\n'
                const re = exiftool.CommandDeferred._makeRegExp(58600);
                const res = re.exec(s);
                expect(res).not.to.be.null;
            });
            it('works on single begin and ready with data', function() {
                const data = 'Some Data\n'
                const s = `{begin58600}\n${data}{ready58600}\n`;
                const re = exiftool.CommandDeferred._makeRegExp(58600);
                const res = re.exec(s);
                expect(res).not.to.be.null;
                expect(res[1]).to.equal(data);
            });
            it('works on multiple begin and ready', function() {
                const data = 'Some Data\n'
                const s = `{begin58600}\n${data}{ready58600}\n` +
                        `{begin660832}\n{ready660832}\n`;
                const re = exiftool.CommandDeferred._makeRegExp(58600);
                const res = re.exec(s);
                expect(res).not.to.be.null;
                expect(res[1]).to.equal(data);
                const re2 = exiftool.CommandDeferred._makeRegExp(660832);
                const res2 = re2.exec(s);
                expect(res2).not.to.be.null;
                expect(res2[1]).to.equal('');
            });
        });
    });
});