const Chai = require('chai');
const assert = Chai.assert;
const _ = require('lodash');
const Logger = require('logger');
const Lookup = require('../lib/lookup');
const FieldUrl = require('../field/field-url').FieldUrl;

describe('field.url', () => {

  let logger = new Logger({toConsole: false});
  describe('url',  () => {
    let f = new FieldUrl({lookup: new Lookup()});
    logger.clear();
    it('empty', async () => {
      let r = await f.convert('url', {url: '', _source: 'master'}, logger);
      assert.isEmpty(r, 'should clear a empty record')
    });
    it('select field', async () => {
      let r = await f.convert('url', {url: 'http://www.em-cultuur.com:81/test?x=2', _source: 'master'}, logger);
      assert.equal(r.value,'www.em-cultuur.com:81/test?x=2', 'select url en convert');
//      r = await f.convert('href', {href: 'http://www.em-cultuur.com:81/test?x=2', _source: 'master'}, logger);
//      assert.equal(r.value, 'http://www.em-cultuur.com:81/test?x=2', 'href');
      r = await f.convert('hostPath', {hostPath: 'http://www.em-cultuur.com:81/test?x=2', _source: 'master'}, logger);
      assert.equal(r.value, 'www.em-cultuur.com:81/test?x=2', 'hostPath');
      r = await f.convert('origin', {origin: 'http://www.em-cultuur.com:81/test?x=2', _source: 'master'}, logger);
      assert.equal(r.value,'www.em-cultuur.com', 'origin');

    });
  });

  it('leave empty', async () => {
    let f2 = new FieldUrl({ lookup: new Lookup(), removeEmpty : false});
    let r = await f2.convert('url', {url: ''}, logger);
    assert.equal(r.value, undefined, 'not there');
  });

  it('load special types', async () => {
    let f2 = new FieldUrl({ lookup: new Lookup(), removeEmpty : false,
      urls: [
        { name: 'facebook', url: 'facebook\.com', typeId: 141},
        { name: 'instagram',  url: 'instagram\.com', typeId: 154},
        { name: 'linkedIn', url: 'www\.linkedin\.com\/in\/', typeId: 142},
        { name: 'twitter', url: 'twitter\.com', typeId: 143 }
      ]
    });
    let r = await f2.convert('url', {url: 'http://www.linkedin.com/in/toxus'}, logger);
    assert.equal(r.value, 'www.linkedin.com/in/toxus', 'has url with name');
    assert.equal(r.typeId, '142', 'found type')
  })
});
