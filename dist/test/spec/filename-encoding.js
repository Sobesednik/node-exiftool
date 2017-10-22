'use strict';

require('source-map-support/register');

var assert = require('assert');
var context = require('exiftool-context');
var exiftool = require('../../src/');
context.globalExiftoolConstructor = exiftool.ExiftoolProcess;

/*
* If something is going wrong with this test suite, check
* https://github.com/Sobesednik/exiftool-context#filenamewithencoding
*/
var Encoding = {
    context: context,
    /*'should contain correct file in the repo': (ctx) => {
        const fs = require('fs')
        const path = require('path')
        const basename = path.basename(ctx.filenameWithEncoding)
        const dir = path.dirname(ctx.filenameWithEncoding)
         console.log('File to read: %s', ctx.filenameWithEncoding)
        console.log('Filename in unicode to read: %s', ctx.toUnicode(basename))
        const res = fs.readdirSync(dir)
        console.log('Files in fixtures:')
        res.map(n => ` ${n}: ${ctx.toUnicode(n)}`).forEach(n => console.log(n))
    },*/
    'should read file with filename in utf8': function shouldReadFileWithFilenameInUtf8(ctx) {
        return ctx.initAndReadMetadata(ctx.filenameWithEncoding, ['charset filename=utf8']).then(function (res) {
            assert.notEqual(res.data, null);
            assert.equal(res.data[0].SourceFile, ctx.replaceSlashes(ctx.filenameWithEncoding));
            assert.equal(res.error, null);
        });
    }
};

module.exports = {
    encoding: Encoding
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3Rlc3Qvc3BlYy9maWxlbmFtZS1lbmNvZGluZy5qcyJdLCJuYW1lcyI6WyJhc3NlcnQiLCJyZXF1aXJlIiwiY29udGV4dCIsImV4aWZ0b29sIiwiZ2xvYmFsRXhpZnRvb2xDb25zdHJ1Y3RvciIsIkV4aWZ0b29sUHJvY2VzcyIsIkVuY29kaW5nIiwiY3R4IiwiaW5pdEFuZFJlYWRNZXRhZGF0YSIsImZpbGVuYW1lV2l0aEVuY29kaW5nIiwidGhlbiIsInJlcyIsIm5vdEVxdWFsIiwiZGF0YSIsImVxdWFsIiwiU291cmNlRmlsZSIsInJlcGxhY2VTbGFzaGVzIiwiZXJyb3IiLCJtb2R1bGUiLCJleHBvcnRzIiwiZW5jb2RpbmciXSwibWFwcGluZ3MiOiI7Ozs7QUFBQSxJQUFNQSxTQUFTQyxRQUFRLFFBQVIsQ0FBZjtBQUNBLElBQU1DLFVBQVVELFFBQVEsa0JBQVIsQ0FBaEI7QUFDQSxJQUFNRSxXQUFXRixRQUFRLFlBQVIsQ0FBakI7QUFDQUMsUUFBUUUseUJBQVIsR0FBb0NELFNBQVNFLGVBQTdDOztBQUVBOzs7O0FBSUEsSUFBTUMsV0FBVztBQUNiSixvQkFEYTtBQUViOzs7Ozs7Ozs7OztBQVlBLDhDQUEwQywwQ0FBQ0ssR0FBRCxFQUFTO0FBQy9DLGVBQU9BLElBQUlDLG1CQUFKLENBQXdCRCxJQUFJRSxvQkFBNUIsRUFBa0QsQ0FBQyx1QkFBRCxDQUFsRCxFQUNGQyxJQURFLENBQ0csVUFBQ0MsR0FBRCxFQUFTO0FBQ1hYLG1CQUFPWSxRQUFQLENBQWdCRCxJQUFJRSxJQUFwQixFQUEwQixJQUExQjtBQUNBYixtQkFBT2MsS0FBUCxDQUNJSCxJQUFJRSxJQUFKLENBQVMsQ0FBVCxFQUFZRSxVQURoQixFQUVJUixJQUFJUyxjQUFKLENBQW1CVCxJQUFJRSxvQkFBdkIsQ0FGSjtBQUlBVCxtQkFBT2MsS0FBUCxDQUFhSCxJQUFJTSxLQUFqQixFQUF3QixJQUF4QjtBQUNILFNBUkUsQ0FBUDtBQVNIO0FBeEJZLENBQWpCOztBQTJCQUMsT0FBT0MsT0FBUCxHQUFpQjtBQUNiQyxjQUFVZDtBQURHLENBQWpCIiwiZmlsZSI6ImZpbGVuYW1lLWVuY29kaW5nLmpzIiwic291cmNlc0NvbnRlbnQiOlsiY29uc3QgYXNzZXJ0ID0gcmVxdWlyZSgnYXNzZXJ0JylcbmNvbnN0IGNvbnRleHQgPSByZXF1aXJlKCdleGlmdG9vbC1jb250ZXh0JylcbmNvbnN0IGV4aWZ0b29sID0gcmVxdWlyZSgnLi4vLi4vc3JjLycpXG5jb250ZXh0Lmdsb2JhbEV4aWZ0b29sQ29uc3RydWN0b3IgPSBleGlmdG9vbC5FeGlmdG9vbFByb2Nlc3NcblxuLypcbiogSWYgc29tZXRoaW5nIGlzIGdvaW5nIHdyb25nIHdpdGggdGhpcyB0ZXN0IHN1aXRlLCBjaGVja1xuKiBodHRwczovL2dpdGh1Yi5jb20vU29iZXNlZG5pay9leGlmdG9vbC1jb250ZXh0I2ZpbGVuYW1ld2l0aGVuY29kaW5nXG4qL1xuY29uc3QgRW5jb2RpbmcgPSB7XG4gICAgY29udGV4dCxcbiAgICAvKidzaG91bGQgY29udGFpbiBjb3JyZWN0IGZpbGUgaW4gdGhlIHJlcG8nOiAoY3R4KSA9PiB7XG4gICAgICAgIGNvbnN0IGZzID0gcmVxdWlyZSgnZnMnKVxuICAgICAgICBjb25zdCBwYXRoID0gcmVxdWlyZSgncGF0aCcpXG4gICAgICAgIGNvbnN0IGJhc2VuYW1lID0gcGF0aC5iYXNlbmFtZShjdHguZmlsZW5hbWVXaXRoRW5jb2RpbmcpXG4gICAgICAgIGNvbnN0IGRpciA9IHBhdGguZGlybmFtZShjdHguZmlsZW5hbWVXaXRoRW5jb2RpbmcpXG5cbiAgICAgICAgY29uc29sZS5sb2coJ0ZpbGUgdG8gcmVhZDogJXMnLCBjdHguZmlsZW5hbWVXaXRoRW5jb2RpbmcpXG4gICAgICAgIGNvbnNvbGUubG9nKCdGaWxlbmFtZSBpbiB1bmljb2RlIHRvIHJlYWQ6ICVzJywgY3R4LnRvVW5pY29kZShiYXNlbmFtZSkpXG4gICAgICAgIGNvbnN0IHJlcyA9IGZzLnJlYWRkaXJTeW5jKGRpcilcbiAgICAgICAgY29uc29sZS5sb2coJ0ZpbGVzIGluIGZpeHR1cmVzOicpXG4gICAgICAgIHJlcy5tYXAobiA9PiBgICR7bn06ICR7Y3R4LnRvVW5pY29kZShuKX1gKS5mb3JFYWNoKG4gPT4gY29uc29sZS5sb2cobikpXG4gICAgfSwqL1xuICAgICdzaG91bGQgcmVhZCBmaWxlIHdpdGggZmlsZW5hbWUgaW4gdXRmOCc6IChjdHgpID0+IHtcbiAgICAgICAgcmV0dXJuIGN0eC5pbml0QW5kUmVhZE1ldGFkYXRhKGN0eC5maWxlbmFtZVdpdGhFbmNvZGluZywgWydjaGFyc2V0IGZpbGVuYW1lPXV0ZjgnXSlcbiAgICAgICAgICAgIC50aGVuKChyZXMpID0+IHtcbiAgICAgICAgICAgICAgICBhc3NlcnQubm90RXF1YWwocmVzLmRhdGEsIG51bGwpXG4gICAgICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKFxuICAgICAgICAgICAgICAgICAgICByZXMuZGF0YVswXS5Tb3VyY2VGaWxlLFxuICAgICAgICAgICAgICAgICAgICBjdHgucmVwbGFjZVNsYXNoZXMoY3R4LmZpbGVuYW1lV2l0aEVuY29kaW5nKVxuICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgICAgICBhc3NlcnQuZXF1YWwocmVzLmVycm9yLCBudWxsKVxuICAgICAgICAgICAgfSlcbiAgICB9LFxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBlbmNvZGluZzogRW5jb2RpbmcsXG59XG4iXX0=