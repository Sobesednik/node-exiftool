'use strict';

require('source-map-support/register');

var assert = require('assert');

var _require = require('os'),
    EOL = _require.EOL;

var context = require('exiftool-context');
var exiftool = require('../../src/');
context.globalExiftoolConstructor = exiftool.ExiftoolProcess;

var metadata = {
    all: '', // remove all metadata at first
    Title: 'åäö',
    LocalCaption: 'local caption',
    'Caption-Abstract': 'C\xE2pt\xEF\xF6n \xC3bstr\xE1ct: \xE5\xE4\xF6',
    Copyright: '2017 ©',
    'Keywords+': ['k\xEByw\xF4rd \xC3\u2026', 'keywórdB ©˙µå≥'],
    Creator: 'Mr Author',
    Rating: 5
};

var IPTCEncoding = {
    context: context,
    'should raise a warning when codedcharacterset=utf8 not provided for IPTC tags': function shouldRaiseAWarningWhenCodedcharactersetUtf8NotProvidedForIPTCTags(ctx) {
        return ctx.createTempFile().then(function () {
            return ctx.initAndWriteMetadata(ctx.tempFile, metadata);
        }).then(function (res) {
            assert.equal(res.data, null);
            var expected = 'Warning: Some character(s) could not be encoded in Latin - ' + ctx.replaceSlashes(ctx.tempFile) + EOL + '    1 image files updated';
            assert.equal(res.error, expected);
        });
    },
    'should successfully update the file when codedcharacterset=utf8 passed': function shouldSuccessfullyUpdateTheFileWhenCodedcharactersetUtf8Passed(ctx) {
        var args = ['codedcharacterset=utf8'];
        return ctx.createTempFile().then(function () {
            return ctx.initAndWriteMetadata(ctx.tempFile, metadata, args);
        }).then(function (res) {
            assert.equal(res.data, null);
            var expected = '1 image files updated';
            assert.equal(res.error, expected);
        });
    }
};

module.exports = {
    codedcharacterset: {
        IPTCEncoding: IPTCEncoding
    }
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3Rlc3Qvc3BlYy9jb2RlZGNoYXJhY3RlcnNldC5qcyJdLCJuYW1lcyI6WyJhc3NlcnQiLCJyZXF1aXJlIiwiRU9MIiwiY29udGV4dCIsImV4aWZ0b29sIiwiZ2xvYmFsRXhpZnRvb2xDb25zdHJ1Y3RvciIsIkV4aWZ0b29sUHJvY2VzcyIsIm1ldGFkYXRhIiwiYWxsIiwiVGl0bGUiLCJMb2NhbENhcHRpb24iLCJDb3B5cmlnaHQiLCJDcmVhdG9yIiwiUmF0aW5nIiwiSVBUQ0VuY29kaW5nIiwiY3R4IiwiY3JlYXRlVGVtcEZpbGUiLCJ0aGVuIiwiaW5pdEFuZFdyaXRlTWV0YWRhdGEiLCJ0ZW1wRmlsZSIsInJlcyIsImVxdWFsIiwiZGF0YSIsImV4cGVjdGVkIiwicmVwbGFjZVNsYXNoZXMiLCJlcnJvciIsImFyZ3MiLCJtb2R1bGUiLCJleHBvcnRzIiwiY29kZWRjaGFyYWN0ZXJzZXQiXSwibWFwcGluZ3MiOiI7Ozs7QUFBQSxJQUFNQSxTQUFTQyxRQUFRLFFBQVIsQ0FBZjs7ZUFDZ0JBLFFBQVEsSUFBUixDO0lBQVJDLEcsWUFBQUEsRzs7QUFDUixJQUFNQyxVQUFVRixRQUFRLGtCQUFSLENBQWhCO0FBQ0EsSUFBTUcsV0FBV0gsUUFBUSxZQUFSLENBQWpCO0FBQ0FFLFFBQVFFLHlCQUFSLEdBQW9DRCxTQUFTRSxlQUE3Qzs7QUFFQSxJQUFNQyxXQUFXO0FBQ2JDLFNBQUssRUFEUSxFQUNKO0FBQ1RDLFdBQU8sS0FGTTtBQUdiQyxrQkFBYyxlQUhEO0FBSWIsd0JBQW9CLCtDQUpQO0FBS2JDLGVBQVcsUUFMRTtBQU1iLGlCQUFhLENBQUUsMEJBQUYsRUFBcUIsZ0JBQXJCLENBTkE7QUFPYkMsYUFBUyxXQVBJO0FBUWJDLFlBQVE7QUFSSyxDQUFqQjs7QUFXQSxJQUFNQyxlQUFlO0FBQ2pCWCxvQkFEaUI7QUFFakIscUZBQWlGLDRFQUFDWSxHQUFELEVBQVM7QUFDdEYsZUFBT0EsSUFBSUMsY0FBSixHQUNGQyxJQURFLENBQ0c7QUFBQSxtQkFBTUYsSUFBSUcsb0JBQUosQ0FBeUJILElBQUlJLFFBQTdCLEVBQXVDWixRQUF2QyxDQUFOO0FBQUEsU0FESCxFQUVGVSxJQUZFLENBRUcsVUFBQ0csR0FBRCxFQUFTO0FBQ1hwQixtQkFBT3FCLEtBQVAsQ0FBYUQsSUFBSUUsSUFBakIsRUFBdUIsSUFBdkI7QUFDQSxnQkFBTUMsMkVBQ2pCUixJQUFJUyxjQUFKLENBQW1CVCxJQUFJSSxRQUF2QixDQURpQixHQUNrQmpCLEdBRGxCLDhCQUFOO0FBR0FGLG1CQUFPcUIsS0FBUCxDQUFhRCxJQUFJSyxLQUFqQixFQUF3QkYsUUFBeEI7QUFDSCxTQVJFLENBQVA7QUFTSCxLQVpnQjtBQWFqQiw4RUFBMEUsd0VBQUNSLEdBQUQsRUFBUztBQUMvRSxZQUFNVyxPQUFPLENBQUMsd0JBQUQsQ0FBYjtBQUNBLGVBQU9YLElBQUlDLGNBQUosR0FDRkMsSUFERSxDQUNHO0FBQUEsbUJBQU1GLElBQUlHLG9CQUFKLENBQXlCSCxJQUFJSSxRQUE3QixFQUF1Q1osUUFBdkMsRUFBaURtQixJQUFqRCxDQUFOO0FBQUEsU0FESCxFQUVGVCxJQUZFLENBRUcsVUFBQ0csR0FBRCxFQUFTO0FBQ1hwQixtQkFBT3FCLEtBQVAsQ0FBYUQsSUFBSUUsSUFBakIsRUFBdUIsSUFBdkI7QUFDQSxnQkFBTUMsV0FBVyx1QkFBakI7QUFDQXZCLG1CQUFPcUIsS0FBUCxDQUFhRCxJQUFJSyxLQUFqQixFQUF3QkYsUUFBeEI7QUFDSCxTQU5FLENBQVA7QUFPSDtBQXRCZ0IsQ0FBckI7O0FBeUJBSSxPQUFPQyxPQUFQLEdBQWlCO0FBQ2JDLHVCQUFtQjtBQUNmZjtBQURlO0FBRE4sQ0FBakIiLCJmaWxlIjoiY29kZWRjaGFyYWN0ZXJzZXQuanMiLCJzb3VyY2VzQ29udGVudCI6WyJjb25zdCBhc3NlcnQgPSByZXF1aXJlKCdhc3NlcnQnKVxuY29uc3QgeyBFT0wgfSA9IHJlcXVpcmUoJ29zJylcbmNvbnN0IGNvbnRleHQgPSByZXF1aXJlKCdleGlmdG9vbC1jb250ZXh0JylcbmNvbnN0IGV4aWZ0b29sID0gcmVxdWlyZSgnLi4vLi4vc3JjLycpXG5jb250ZXh0Lmdsb2JhbEV4aWZ0b29sQ29uc3RydWN0b3IgPSBleGlmdG9vbC5FeGlmdG9vbFByb2Nlc3NcblxuY29uc3QgbWV0YWRhdGEgPSB7XG4gICAgYWxsOiAnJywgLy8gcmVtb3ZlIGFsbCBtZXRhZGF0YSBhdCBmaXJzdFxuICAgIFRpdGxlOiAnw6XDpMO2JyxcbiAgICBMb2NhbENhcHRpb246ICdsb2NhbCBjYXB0aW9uJyxcbiAgICAnQ2FwdGlvbi1BYnN0cmFjdCc6ICdDw6JwdMOvw7ZuIFxcdTAwQzNic3Ryw6FjdDogw6XDpMO2JyxcbiAgICBDb3B5cmlnaHQ6ICcyMDE3IMKpJyxcbiAgICAnS2V5d29yZHMrJzogWyAna8OreXfDtHJkIFxcdTAwQzPigKYnLCAna2V5d8OzcmRCIMKpy5nCtcOl4omlJyBdLFxuICAgIENyZWF0b3I6ICdNciBBdXRob3InLFxuICAgIFJhdGluZzogNSxcbn1cblxuY29uc3QgSVBUQ0VuY29kaW5nID0ge1xuICAgIGNvbnRleHQsXG4gICAgJ3Nob3VsZCByYWlzZSBhIHdhcm5pbmcgd2hlbiBjb2RlZGNoYXJhY3RlcnNldD11dGY4IG5vdCBwcm92aWRlZCBmb3IgSVBUQyB0YWdzJzogKGN0eCkgPT4ge1xuICAgICAgICByZXR1cm4gY3R4LmNyZWF0ZVRlbXBGaWxlKClcbiAgICAgICAgICAgIC50aGVuKCgpID0+IGN0eC5pbml0QW5kV3JpdGVNZXRhZGF0YShjdHgudGVtcEZpbGUsIG1ldGFkYXRhKSlcbiAgICAgICAgICAgIC50aGVuKChyZXMpID0+IHtcbiAgICAgICAgICAgICAgICBhc3NlcnQuZXF1YWwocmVzLmRhdGEsIG51bGwpXG4gICAgICAgICAgICAgICAgY29uc3QgZXhwZWN0ZWQgPSBgV2FybmluZzogU29tZSBjaGFyYWN0ZXIocykgY291bGQgbm90IGJlIGVuY29kZWQgaW4gTGF0aW5cXFxuIC0gJHtjdHgucmVwbGFjZVNsYXNoZXMoY3R4LnRlbXBGaWxlKX0ke0VPTH1cXFxuICAgIDEgaW1hZ2UgZmlsZXMgdXBkYXRlZGBcbiAgICAgICAgICAgICAgICBhc3NlcnQuZXF1YWwocmVzLmVycm9yLCBleHBlY3RlZClcbiAgICAgICAgICAgIH0pXG4gICAgfSxcbiAgICAnc2hvdWxkIHN1Y2Nlc3NmdWxseSB1cGRhdGUgdGhlIGZpbGUgd2hlbiBjb2RlZGNoYXJhY3RlcnNldD11dGY4IHBhc3NlZCc6IChjdHgpID0+IHtcbiAgICAgICAgY29uc3QgYXJncyA9IFsnY29kZWRjaGFyYWN0ZXJzZXQ9dXRmOCddXG4gICAgICAgIHJldHVybiBjdHguY3JlYXRlVGVtcEZpbGUoKVxuICAgICAgICAgICAgLnRoZW4oKCkgPT4gY3R4LmluaXRBbmRXcml0ZU1ldGFkYXRhKGN0eC50ZW1wRmlsZSwgbWV0YWRhdGEsIGFyZ3MpKVxuICAgICAgICAgICAgLnRoZW4oKHJlcykgPT4ge1xuICAgICAgICAgICAgICAgIGFzc2VydC5lcXVhbChyZXMuZGF0YSwgbnVsbClcbiAgICAgICAgICAgICAgICBjb25zdCBleHBlY3RlZCA9ICcxIGltYWdlIGZpbGVzIHVwZGF0ZWQnXG4gICAgICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHJlcy5lcnJvciwgZXhwZWN0ZWQpXG4gICAgICAgICAgICB9KVxuICAgIH0sXG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGNvZGVkY2hhcmFjdGVyc2V0OiB7XG4gICAgICAgIElQVENFbmNvZGluZyxcbiAgICB9LFxufVxuIl19