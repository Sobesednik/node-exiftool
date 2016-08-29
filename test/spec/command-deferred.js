const CommandDeferred = require('../../src/command-deferred');
const EOL = require('os').EOL;

describe('CommandDeferred', function() {
	describe('makeRegExp', function() {
		it('works on single begin and ready', function() {
			const s = `{begin58600}${EOL}{ready58600}${EOL}`;
			const re = CommandDeferred._makeRegExp(58600);
			const res = re.exec(s);
			expect(res).not.to.be.null;
		});
		it('works on single begin and ready with data', function() {
			const data = `Some Data${EOL}`
			const s = `{begin58600}${EOL}${data}{ready58600}${EOL}`;
			const re = CommandDeferred._makeRegExp(58600);
			const res = re.exec(s);
			expect(res).not.to.be.null;
			expect(res[1]).to.equal(data);
		});
		it('works on multiple begin and ready', function() {
			const data = `Some Data${EOL}`
			const s = `{begin58600}${EOL}${data}{ready58600}${EOL}` +
					`{begin660832}${EOL}{ready660832}${EOL}`;
			const re = CommandDeferred._makeRegExp(58600);
			const res = re.exec(s);
			expect(res).not.to.be.null;
			expect(res[1]).to.equal(data);
			const re2 = CommandDeferred._makeRegExp(660832);
			const res2 = re2.exec(s);
			expect(res2).not.to.be.null;
			expect(res2[1]).to.equal('');
		});
	});
});
