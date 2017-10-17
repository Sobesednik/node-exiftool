'use strict';

require('source-map-support/register');

var context = require('exiftool-context');
var assert = require('assert');
var exiftool = require('../../src/');
context.globalExiftoolConstructor = exiftool.ExiftoolProcess;

var OptionsTestSuite = {
    context: context,
    'calls child_process.spawn with specified options': function callsChild_processSpawnWithSpecifiedOptions(ctx) {
        ctx.mockSpawn();
        var options = { detached: true };

        return ctx.createOpen(options).then(function () {
            assert.equal(ctx.proc.args.options, options);
        });
    },
    'returns rejected promise when trying to open without readable stderr': function returnsRejectedPromiseWhenTryingToOpenWithoutReadableStderr(ctx) {
        var options = {
            stdio: ['pipe', 'pipe', 'ignore']
        };
        return ctx.createOpen(options).then(function () {
            throw new Error('open should have resulted in error');
        }, function (err) {
            assert.equal(err.message, 'Process was not spawned with a readable stderr, check stdio options.');
        });
    },
    'returns rejected promise when trying to open without readable stdout': function returnsRejectedPromiseWhenTryingToOpenWithoutReadableStdout(ctx) {
        var options = {
            stdio: ['ignore', 'ignore', 'pipe']
        };
        return ctx.createOpen(options).then(function () {
            throw new Error('open should have resulted in error');
        }, function (err) {
            assert.equal(err.message, 'Process was not spawned with a readable stdout, check stdio options.');
        });
    },
    'returns rejected promise when trying to open without stdin': function returnsRejectedPromiseWhenTryingToOpenWithoutStdin(ctx) {
        var options = {
            stdio: ['ignore', 'pipe', 'pipe']
        };
        return ctx.createOpen(options).then(function () {
            throw new Error('open should have resulted in error');
        }, function (err) {
            assert.equal(err.message, 'Process was not spawned with a writable stdin, check stdio options.');
        });
    }
};

module.exports = OptionsTestSuite;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3Rlc3Qvc3BlYy9vcHRpb25zLmpzIl0sIm5hbWVzIjpbImNvbnRleHQiLCJyZXF1aXJlIiwiYXNzZXJ0IiwiZXhpZnRvb2wiLCJnbG9iYWxFeGlmdG9vbENvbnN0cnVjdG9yIiwiRXhpZnRvb2xQcm9jZXNzIiwiT3B0aW9uc1Rlc3RTdWl0ZSIsImN0eCIsIm1vY2tTcGF3biIsIm9wdGlvbnMiLCJkZXRhY2hlZCIsImNyZWF0ZU9wZW4iLCJ0aGVuIiwiZXF1YWwiLCJwcm9jIiwiYXJncyIsInN0ZGlvIiwiRXJyb3IiLCJlcnIiLCJtZXNzYWdlIiwibW9kdWxlIiwiZXhwb3J0cyJdLCJtYXBwaW5ncyI6Ijs7OztBQUFBLElBQU1BLFVBQVVDLFFBQVEsa0JBQVIsQ0FBaEI7QUFDQSxJQUFNQyxTQUFTRCxRQUFRLFFBQVIsQ0FBZjtBQUNBLElBQU1FLFdBQVdGLFFBQVEsWUFBUixDQUFqQjtBQUNBRCxRQUFRSSx5QkFBUixHQUFvQ0QsU0FBU0UsZUFBN0M7O0FBRUEsSUFBTUMsbUJBQW1CO0FBQ3JCTixvQkFEcUI7QUFFckIsd0RBQW9ELHFEQUFDTyxHQUFELEVBQVM7QUFDekRBLFlBQUlDLFNBQUo7QUFDQSxZQUFNQyxVQUFVLEVBQUVDLFVBQVUsSUFBWixFQUFoQjs7QUFFQSxlQUFPSCxJQUFJSSxVQUFKLENBQWVGLE9BQWYsRUFDRkcsSUFERSxDQUNHLFlBQU07QUFDUlYsbUJBQU9XLEtBQVAsQ0FBYU4sSUFBSU8sSUFBSixDQUFTQyxJQUFULENBQWNOLE9BQTNCLEVBQW9DQSxPQUFwQztBQUNILFNBSEUsQ0FBUDtBQUlILEtBVm9CO0FBV3JCLDRFQUF3RSxxRUFBQ0YsR0FBRCxFQUFTO0FBQzdFLFlBQU1FLFVBQVU7QUFDWk8sbUJBQU8sQ0FBQyxNQUFELEVBQVMsTUFBVCxFQUFpQixRQUFqQjtBQURLLFNBQWhCO0FBR0EsZUFBT1QsSUFBSUksVUFBSixDQUFlRixPQUFmLEVBQ0ZHLElBREUsQ0FDRyxZQUFNO0FBQ1Isa0JBQU0sSUFBSUssS0FBSixDQUFVLG9DQUFWLENBQU47QUFDSCxTQUhFLEVBR0EsVUFBQ0MsR0FBRCxFQUFTO0FBQ1JoQixtQkFBT1csS0FBUCxDQUFhSyxJQUFJQyxPQUFqQixFQUEwQixzRUFBMUI7QUFDSCxTQUxFLENBQVA7QUFNSCxLQXJCb0I7QUFzQnJCLDRFQUF3RSxxRUFBQ1osR0FBRCxFQUFTO0FBQzdFLFlBQU1FLFVBQVU7QUFDWk8sbUJBQU8sQ0FBQyxRQUFELEVBQVcsUUFBWCxFQUFxQixNQUFyQjtBQURLLFNBQWhCO0FBR0EsZUFBT1QsSUFBSUksVUFBSixDQUFlRixPQUFmLEVBQ0ZHLElBREUsQ0FDRyxZQUFNO0FBQ1Isa0JBQU0sSUFBSUssS0FBSixDQUFVLG9DQUFWLENBQU47QUFDSCxTQUhFLEVBR0EsVUFBQ0MsR0FBRCxFQUFTO0FBQ1JoQixtQkFBT1csS0FBUCxDQUFhSyxJQUFJQyxPQUFqQixFQUEwQixzRUFBMUI7QUFDSCxTQUxFLENBQVA7QUFNSCxLQWhDb0I7QUFpQ3JCLGtFQUE4RCw0REFBQ1osR0FBRCxFQUFTO0FBQ25FLFlBQU1FLFVBQVU7QUFDWk8sbUJBQU8sQ0FBQyxRQUFELEVBQVcsTUFBWCxFQUFtQixNQUFuQjtBQURLLFNBQWhCO0FBR0EsZUFBT1QsSUFBSUksVUFBSixDQUFlRixPQUFmLEVBQ0ZHLElBREUsQ0FDRyxZQUFNO0FBQ1Isa0JBQU0sSUFBSUssS0FBSixDQUFVLG9DQUFWLENBQU47QUFDSCxTQUhFLEVBR0EsVUFBQ0MsR0FBRCxFQUFTO0FBQ1JoQixtQkFBT1csS0FBUCxDQUFhSyxJQUFJQyxPQUFqQixFQUEwQixxRUFBMUI7QUFDSCxTQUxFLENBQVA7QUFNSDtBQTNDb0IsQ0FBekI7O0FBOENBQyxPQUFPQyxPQUFQLEdBQWlCZixnQkFBakIiLCJmaWxlIjoib3B0aW9ucy5qcyIsInNvdXJjZXNDb250ZW50IjpbImNvbnN0IGNvbnRleHQgPSByZXF1aXJlKCdleGlmdG9vbC1jb250ZXh0JylcbmNvbnN0IGFzc2VydCA9IHJlcXVpcmUoJ2Fzc2VydCcpXG5jb25zdCBleGlmdG9vbCA9IHJlcXVpcmUoJy4uLy4uL3NyYy8nKVxuY29udGV4dC5nbG9iYWxFeGlmdG9vbENvbnN0cnVjdG9yID0gZXhpZnRvb2wuRXhpZnRvb2xQcm9jZXNzXG5cbmNvbnN0IE9wdGlvbnNUZXN0U3VpdGUgPSB7XG4gICAgY29udGV4dCxcbiAgICAnY2FsbHMgY2hpbGRfcHJvY2Vzcy5zcGF3biB3aXRoIHNwZWNpZmllZCBvcHRpb25zJzogKGN0eCkgPT4ge1xuICAgICAgICBjdHgubW9ja1NwYXduKClcbiAgICAgICAgY29uc3Qgb3B0aW9ucyA9IHsgZGV0YWNoZWQ6IHRydWUgfVxuXG4gICAgICAgIHJldHVybiBjdHguY3JlYXRlT3BlbihvcHRpb25zKVxuICAgICAgICAgICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgICAgIGFzc2VydC5lcXVhbChjdHgucHJvYy5hcmdzLm9wdGlvbnMsIG9wdGlvbnMpXG4gICAgICAgICAgICB9KVxuICAgIH0sXG4gICAgJ3JldHVybnMgcmVqZWN0ZWQgcHJvbWlzZSB3aGVuIHRyeWluZyB0byBvcGVuIHdpdGhvdXQgcmVhZGFibGUgc3RkZXJyJzogKGN0eCkgPT4ge1xuICAgICAgICBjb25zdCBvcHRpb25zID0ge1xuICAgICAgICAgICAgc3RkaW86IFsncGlwZScsICdwaXBlJywgJ2lnbm9yZSddLFxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBjdHguY3JlYXRlT3BlbihvcHRpb25zKVxuICAgICAgICAgICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignb3BlbiBzaG91bGQgaGF2ZSByZXN1bHRlZCBpbiBlcnJvcicpXG4gICAgICAgICAgICB9LCAoZXJyKSA9PiB7XG4gICAgICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKGVyci5tZXNzYWdlLCAnUHJvY2VzcyB3YXMgbm90IHNwYXduZWQgd2l0aCBhIHJlYWRhYmxlIHN0ZGVyciwgY2hlY2sgc3RkaW8gb3B0aW9ucy4nKVxuICAgICAgICAgICAgfSlcbiAgICB9LFxuICAgICdyZXR1cm5zIHJlamVjdGVkIHByb21pc2Ugd2hlbiB0cnlpbmcgdG8gb3BlbiB3aXRob3V0IHJlYWRhYmxlIHN0ZG91dCc6IChjdHgpID0+IHtcbiAgICAgICAgY29uc3Qgb3B0aW9ucyA9IHtcbiAgICAgICAgICAgIHN0ZGlvOiBbJ2lnbm9yZScsICdpZ25vcmUnLCAncGlwZSddLFxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBjdHguY3JlYXRlT3BlbihvcHRpb25zKVxuICAgICAgICAgICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignb3BlbiBzaG91bGQgaGF2ZSByZXN1bHRlZCBpbiBlcnJvcicpXG4gICAgICAgICAgICB9LCAoZXJyKSA9PiB7XG4gICAgICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKGVyci5tZXNzYWdlLCAnUHJvY2VzcyB3YXMgbm90IHNwYXduZWQgd2l0aCBhIHJlYWRhYmxlIHN0ZG91dCwgY2hlY2sgc3RkaW8gb3B0aW9ucy4nKVxuICAgICAgICAgICAgfSlcbiAgICB9LFxuICAgICdyZXR1cm5zIHJlamVjdGVkIHByb21pc2Ugd2hlbiB0cnlpbmcgdG8gb3BlbiB3aXRob3V0IHN0ZGluJzogKGN0eCkgPT4ge1xuICAgICAgICBjb25zdCBvcHRpb25zID0ge1xuICAgICAgICAgICAgc3RkaW86IFsnaWdub3JlJywgJ3BpcGUnLCAncGlwZSddLFxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBjdHguY3JlYXRlT3BlbihvcHRpb25zKVxuICAgICAgICAgICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignb3BlbiBzaG91bGQgaGF2ZSByZXN1bHRlZCBpbiBlcnJvcicpXG4gICAgICAgICAgICB9LCAoZXJyKSA9PiB7XG4gICAgICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKGVyci5tZXNzYWdlLCAnUHJvY2VzcyB3YXMgbm90IHNwYXduZWQgd2l0aCBhIHdyaXRhYmxlIHN0ZGluLCBjaGVjayBzdGRpbyBvcHRpb25zLicpXG4gICAgICAgICAgICB9KVxuICAgIH0sXG59XG5cbm1vZHVsZS5leHBvcnRzID0gT3B0aW9uc1Rlc3RTdWl0ZVxuIl19