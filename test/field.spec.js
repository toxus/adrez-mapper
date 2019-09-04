/**
 * Test the Fields
 */
const Chai = require('chai');
const assert = Chai.assert;
const _ = require('lodash');
const Logger = require('logger');
const Field = require('../field/field').Field;
const FieldText = require('../field/field-text').FieldText;
const FieldTextBoolean = require('../field/field-text-boolean').FieldTextBoolean;
const FieldTextEmail = require('../field/field-text-email').FieldTextEmail;
const FieldTextTelephone = require('../field/field-text-telephone').FieldTextTelephone;
const FieldTextZipcode = require('../field/field-text-zipcode').FieldTextZipcode;
const FieldMemo = require('../field/field-memo').FieldMemo
const Countries = require('../lib/lookup').Countries;
const FieldObject = require('../field/field-object').FieldObject;
const FieldArray = require('../field/field-array').FieldArray;
const FieldComposed = require('../field/field-composed').FieldComposed;
const FieldTelephone = require('../field/field-telephone').FieldTelephone;
const FieldCode = require('../field/field-code').FieldCode;
const FieldEmail = require('../field/field-email').FieldEmail;
const FieldLocation = require('../field/field-location').FieldLocation;
const FieldContact = require('../field/field-contact').FieldContact;

describe('field',  () => {
  let logger = new Logger({toConsole: false});

  describe('base', () => {
    let f = new Field();
    logger.clear();
    it('validate', () => {
      assert(f.validate('name') === true, 'everything is valid');
      return(f.adjust('name')).then (() => {
        assert(true, 'did resolve')
      })
    })
  });

  describe('text', () => {
    let f = new FieldText();
    logger.clear();
    it('empty', () => {
      assert(f.isEmpty('') === true, 'none');
      assert(f.isEmpty(undefined) === true, 'none');
      assert(f.isEmpty('   ') === true, 'spaces');
      assert(f.isEmpty('a') === false, 'text');
      assert(f.isEmpty(0) === false, 'number');
    });

    it('validate', () => {
      assert(f.validate('name', 'value', logger) === true, 'string is valid');
      assert(!logger.hasMessages(), 'no messages');
      assert(f.validate('name', {test: 'value'}, logger) === false, 'object not valid');
      assert(logger.hasErrors(), 'error');
      assert(logger.errors.length === 1, 'the error');
      assert(logger.errors[0].fieldName === 'name', 'the field');
      assert(logger.errors[0].message === 'must be string or number', 'the error');
      logger.clear();
      assert(f.validate('name', undefined, logger) === true, 'no value is allowed');
      assert(logger.hasErrors() === false, 'no error');
      return f.convert('master', 'value', logger).then( (r) => {
        assert(r === 'value', 'did return')
      })
    })
  });

  describe('boolean', () => {
    let f = new FieldTextBoolean();
    logger.clear();
    it('validate', () => {
      assert(f.validate('bool', true, logger) === true, 'bool is valid');
      assert(!logger.hasMessages(), 'no messages');
      assert(f.validate('bool', false, logger) === true, 'bool is valid');
      assert(f.validate('bool', 'test', logger) === true, 'string is valid');
      assert(f.validate('bool', 0, logger) === true, 'number is valid');
      assert(f.validate('bool', {}, logger) === false, 'object not valid');
      assert(f.validate('bool', [], logger) === false, 'array not valid');
      assert(f.isEmpty(0) === false, 'values are allowed');
      assert(f.isEmpty(1) === false, 'values are allowed');
      assert(f.isEmpty('0') === false, 'values are allowed');
      assert(f.isEmpty() === true, 'no value is empty');
      return (f.convert('bool', 'text', logger)).then( (d) => {
        assert(typeof d === 'boolean', 'did convert')
      })
    })
  });

  describe('email', () => {
    let f = new FieldTextEmail();
    logger.clear();
    it('validate', async () => {
      assert(f.validate('email', '', logger) === true, 'none is valid');
      assert(f.validate('email', undefined, logger) === true, 'undefined is valid');
      let e = await f.convert('email', 'info@test.com', logger);
      assert(e === 'info@test.com', 'did accept');
      assert(await f.convert('email', 'INFO@test.com') === 'info@test.com', 'lo case');
      assert(await f.convert('email', '<info@test.com>') === 'info@test.com', 'remove html');
      assert(await f.convert('email', 'info @test.com ') === 'info@test.com', 'space');
      assert(await f.convert('email', 'infö@test.com ') === 'info@test.com', 'space');
    })
  });

  describe('telephone', () => {
    let f = new FieldTextTelephone();
    logger.clear();
    it('empty', () => {
      assert(f.isEmpty('') === true, 'none');
      assert(f.isEmpty(undefined) === true, 'none');
      assert(f.isEmpty('0123456789') === false, 'number');
    });
    it('convert', async () => {
      assert(f.validate('tel', '', logger) === true, 'none is valid');
      assert(f.validate('tel', undefined, logger) === true, 'undefined is valid');
      let t = await f.convert('tel', '+31 612345678', logger);
      assert(t === '06-12345678', 'did accept');
      t = await f.convert('tel', '+32-612345678', logger);
      assert(t === '+32 612345678', 'did accept');
    })
  });

  describe('zipcode', () => {
    let f = new FieldTextZipcode();
    logger.clear();
    it('can change', async () => {
      assert(f.value('2011 BS') === '2011 BS', 'no changes on valid');
      assert(f.value('b-2011') === '2011', 'belgium');
      assert(f.value('b 2011') === '2011', 'belgium');
    });
    it('country', async () => {
      assert(f.countryId('2011 BS') === Countries.nl, 'NL');
      assert(f.countryId('B2011') === Countries.be, 'BE');
      assert(f.countryId('B-2011') === Countries.be, 'BE');
      assert(f.countryId('B 2011') === Countries.be, 'BE');
      assert(f.countryId('20115') === Countries.de, 'D');
      assert(f.countryId('') === Countries.unknown, 'empty');
      assert(f.countryId() === Countries.unknown, 'empty');
    });
  });

  describe('object', () => {
    let f = new FieldObject();
    it('empty', () => {
      assert(f.validate('name', {}, logger) === true, 'empty is valid');
      assert(f.validate('name', undefined, logger) === true, 'undefined is valid');
      assert(f.isEmpty({}), 'no fields is empty');
      // assert(f.isEmpty({test: ''}), 'no fields is empty');
    });
    f = new FieldObject({fields: {name: new FieldText(), other: new FieldText()}});
    it('one field', () => {
      logger.clear();
      assert(f.validate('obj', {name: 'test'}, logger) === true, 'field available is valid');
      assert(f.validate('obj', {name: 'test', other: 2}, logger) === true, 'field available is valid');
      assert(f.validate('obj', {name: 'test', wrong: 2}, logger) === false, 'field does not exist');
      assert(logger.errors[0].fieldName === 'obj.wrong', 'field is defined');
      logger.clear();
    });
    it('subprocess fields', async () => {
      f = new FieldObject({fields: {bool: new FieldTextBoolean(), email: new FieldTextEmail()}});
      let r = await f.convert('obj', {bool: 0, email:'INFO@test.com'}, logger);
      assert(typeof r.bool === 'boolean', 'changed');
      assert(f.isEmpty({bool: undefined}), 'is empty');
    });
    it('remove empty allowed fields',async () => {
      f = new FieldObject({fields: {bool: new FieldTextBoolean(), email: new FieldTextEmail(), _source: new FieldText({emptyAllow: true})}});
      let r = await f.convert('obj', {bool: undefined, _source : '1234'}, logger);
      assert(_.isEmpty(r), '_source is flexible');
    })
  });

  describe('array', () => {
    let f = new FieldArray();
    it('empty', () => {
      assert(f.validate('array', [], logger) === true, 'empty is valid');
      logger.clear();
      f.validate('array', {}, logger);
      assert(logger.hasErrors(), 'wrong type');
      assert(f.isEmpty([]), 'no elements is empty');
      assert(f.isEmpty(['a'] === false), 'an elements is not empty');
      assert(f.isEmpty(['', '']), 'empty string is empty')
    });
    it('fields', () => {
      assert(f.validate('array', ['test', 'test2'], logger) === true, 'is valid');
    });
    it('convert', async () => {
      logger.clear();
      let r = await f.convert('array', ['test', '', 'nr 3'], logger);
      assert(r.length === 2, 'removed one');
    });
    let f2 = new FieldArray({type: new FieldTextEmail()});
    assert(f2.validate('array.email', ['not@example.com'], logger), 'is valid')
  });


  describe('composed', () => {
    let f = new FieldComposed();
    logger.clear();
    it('empty', async () => {
      let r = await f.convert('composed', {}, logger);
      assert(_.isEmpty(r), 'empty');
      r = await f.convert('composed', {value: ''}, logger);
      assert(_.isEmpty(r), 'empty');
      r = await f.convert('composed', {value: undefined}, logger);
      assert(_.isEmpty(r), 'empty');
    });
    it('not valid field', async () => {
      try {
        let r = await f.convert('composed', {unknownField: 'test'}, logger);
        assert(false, 'should fail, unknown field');
      } catch (e) {
        assert(e.type === 'ErrorFieldNotAllowed', 'right version');
        assert(e.fields.length === 1, 'one field');
        assert(e.fields[0] === 'unknownField', 'the name');
      }
    });
    it('remove empty fields', async () => {
      let r = await f.convert('composed', {type: '', value:'some value', _source: '123'}, logger);
      assert(r.type === undefined, 'removed');
      assert(r._source === '123', 'left the others');
    });
  });

  describe('telephone',  () => {
    let f = new FieldTelephone();
    logger.clear();
    it('empty', async () => {
      let r = await f.convert('telephone', {telephone: '', _source: 'master'}, logger);
      assert(_.isEmpty(r), 'should clear a empty record')
    });
    it('select field', async () => {
      let r = await f.convert('telephone', {telephone: '0123456789', _source: 'master'}, logger);
      assert(r.value === '012-3456789', 'select tel en convert');
      r = await f.convert('telephone', {telephone: '0123456789', telephoneInt: '0123456789', _source: 'master'}, logger);
      assert(r.value === '+31 (12) 3456789', 'select tel international');
      r = await f.convert('telephone', {value: '09876543210', telephone: '0123456789', telephoneInt: '0123456789', _source: 'master'}, logger);
      assert(r.value === '09876543210', 'value is most favor');
    });
  });

  describe('email',  () => {
    let f = new FieldEmail();
    logger.clear();
    it('empty', async () => {
      let r = await f.convert('email', {email: '', _source: 'master'}, logger);
      assert(_.isEmpty(r), 'should clear a empty record')
    });
    it('select field', async () => {
      let r = await f.convert('email', {email: 'INFO@test.com', _source: 'master'}, logger);
      assert(r.value === 'info@test.com', 'select email en convert');
      r = await f.convert('email', {email: 'INFO@test.com', value: 'test@test.com', _source: 'master'}, logger);
      assert(r.value === 'test@test.com', 'select value not email');
    });
  });

  describe('code',  () => {
    let f = new FieldCode();
    logger.clear();
    it('empty', async () => {
      let r = await f.convert('code', {code: '', codeId: '', _source: 'master'}, logger);
      assert(_.isEmpty(r), 'should clear a empty record')
    });
    it('select field', async () => {
      let r = await f.convert('code', {code: 'test', codeId: '1234', _source: 'master'}, logger);
      assert(r.value === '1234', 'select code Id');
    });
  });

  describe('Memo',  () => {
    let f = new FieldMemo();
    logger.clear();
    it('empty', async () => {
      let r = await f.convert('memo', {description: '', typeId: '', _source: 'master'}, logger);
      assert(_.isEmpty(r), 'should clear a empty record')
    });
    it('select field', async () => {
      let r = await f.convert('memo', {description: 'test', typeId: '1234', _source: 'master'}, logger);
      assert(r.typeId === '1234', 'select code Id');
      assert(r.description === 'test', 'just copied');
    });
  });

  describe('location',  () => {
    let f = new FieldLocation();
    logger.clear();
    it('empty', async () => {
      let r = await f.convert('location', {street: '', city: '', zipcode: '', country: '',  _source: 'master'}, logger);
      assert(_.isEmpty(r), 'remove all')
    });
    it('find country', async() => {
      let r = await f.convert('location', {street: '', city: 'Amsterdam', zipcode: '', country: 'nederland',  _source: 'master'}, logger);
      assert(r.countryId === Countries.nl, 'found us');
      r = await f.convert('location', {street: '', city: 'Amsterdam', zipcode: '', country: 'België',  _source: 'master'}, logger);
      assert(r.countryId === Countries.be, 'found');
      r = await f.convert('location', {street: '', city: 'Amsterdam', zipcode: 'B-1234',  _source: 'master'}, logger);
      assert(r.countryId === Countries.be, 'found');
      r = await f.convert('location', {street: '', city: 'Amsterdam', zipcode: '12345',  _source: 'master'}, logger);
      assert(r.countryId === Countries.de, 'found');
    });
    it('split street', async() => {
      let r = await f.convert('location', {
        streetNumber: 'Westerstraat 12 huis',
        city: 'Amsterdam',
        zipcode: '',
        _source: 'master'
      }, logger);
      assert(r.street === 'Westerstraat', 'found');
      assert(r.number === '12', 'found');
      assert(r._source === 'master', 'no process but still there')
    });
    it('lookup street from zipcode', async() => {
      let r = await f.convert('location', { street: '', city: 'Amsterdam', number: '67', zipcode: '1017 TE', country: 'nederland', _source: 'master'}, logger);
      assert(r.street === 'damrak', 'found');
    });
    it('lookup zipcode from street', async() => {
      let r = await f.convert('location', { street: 'Damrak', city: 'Amsterdam', number: '67', country: 'nederland', _source: 'master'}, logger);
      assert(r.zipcode === '1001 ML', 'found');
    });
  });

  describe('contact',  () => {
    let f = new FieldContact();
    logger.clear();
    it('fullname', async () => {
      let r = await f.convert('contact', {fullName: 'Jan de Hond'}, logger);
      assert(r.firstName === 'Jan' && r.name === 'Hond' && r.namePrefix === 'de' , 'got all');
      r = await f.convert('contact', {fullName: 'dr. J. de Hond'}, logger);
      assert(r.title === 'dr.' && r.firstName === undefined && r.firstLetters === 'J.' && r.name === 'Hond' && r.namePrefix === 'de' , 'got all');
      r = await f.convert('contact', {fullName: 'Jan Willem de Boer'}, logger);
      assert(r.firstLetters = 'J.W.' && r.firstName === 'Jan' && r.middleName === 'Willem' && r.name === 'Boer' && r.namePrefix === 'de' , 'got all');
      r = await f.convert('contact', {fullName: 'Jack (mojo) Man'}, logger);
      assert(r.firstName === 'Jack' && r.name === 'Man' && r.firstLetters === 'J.' && r.nickName === 'mojo' , 'got all');
      r = await f.convert('contact', {fullName: 'Jan Willem Overmars'}, logger);
      assert(r.firstName === 'Jan' && r.middleName === 'Willem' && r.firstLetters === 'J.W.' && r.name === 'Overmars' , 'got all');

      r = await f.convert('contact', {fullName: 'sergeant majoor Bert de Vries'}, logger);
      assert(r.firstName === 'Bert' && r.name === 'Vries' && r.firstLetters === 'B.' && r.title === 'sergeant majoor' , 'got all');
      r = await f.convert('contact', {fullName: 'Abt Jan'}, logger);
      assert(r.name === 'Jan' && r.title === 'Abt' , 'got all');
      r = await f.convert('contact', {fullName: 'Familie E. de Boer-Brenninkmeijer'}, logger);
      assert(r.name === 'Boer-Brenninkmeijer' && r.firstLetters === 'E.' && r.namePrefix === 'de' , 'got all');
      r = await f.convert('contact', {fullName: 'Vera de Boer-van Woerdens'}, logger);
      assert(r.name === 'Woerdens' && r.firstLetters === 'V.B.' && r.middleName === 'Boer-van' , 'got all');
      r = await f.convert('contact', {fullName: 'Jaap-Wieger van der Kreeft'}, logger);
      assert(r.name === 'Kreeft' && r.firstLetters === 'J.' && r.namePrefix === 'van der' && r.firstName === 'Jaap-Wieger' , 'got all');
      r = await f.convert('contact', {fullName: 'Jaap Wieger van der Kreeft'}, logger);
      assert(r.name === 'Kreeft' && r.firstLetters === 'J.W.' && r.namePrefix === 'van der' && r.firstName === 'Jaap' && r.middleName === 'Wieger', 'got all')


    });

  });
});