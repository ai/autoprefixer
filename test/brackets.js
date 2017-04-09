const brackets = require('../lib/brackets');

describe('brackets', () => {

    describe('.parse()', () => {

        it('parses simple string', () => brackets.parse('test').should.eql(['test']));

        it('parses brackets', () => brackets.parse('a (b) a').should.eql(['a ', ['b'], ' a']));

        it('parses many brackets', () => brackets.parse('a (b ()) a').should.eql(['a ', ['b ', [''], ''], ' a']));

        return it('parses errors', () => brackets.parse('a (b (').should.eql(['a ', ['b ', ['']]]));
    });

    return describe('.stringify()', () => {

        it('stringifies simple string', () => brackets.stringify(['test']).should.eql('test'));

        it('stringifies brackets', () => brackets.stringify(['a ', ['b'], ' a']).should.eql('a (b) a'));

        return it('stringifies many brackets', () => brackets.stringify(['a ', ['b ', [''], ''], ' a']).should.eql('a (b ()) a'));
    });
});
