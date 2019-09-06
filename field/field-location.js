/**
 * Field Location
 */

const FieldText = require('./field-text').FieldText;
const FieldGuid = require('./field-text').FieldGuid;

const FieldObject = require('./field-object').FieldObject;
const FieldZipcode = require('./field-text-zipcode').FieldTextZipcode;

// const Countries = require('../lib/lookup').Countries;
//const countryNumberRightId = require('../lib/lookup').countryNumberRightId;
// const Lookup = require('../lib/lookup');

class FieldLocation extends FieldObject {

  constructor(options = {}) {
    super(options);
    this._fields = {
      type: new FieldText(),        // the name of the code
      typeId: new FieldGuid(),      // the id, overrules the type

      street: new FieldText(),
      number: new FieldText(),
      suffix: new FieldText(),
      streetNumber: new FieldText(),
      zipcode: new FieldZipcode(options),
      city: new FieldText(),
      country: new FieldText({emptyAllow: true}),
      countryId: new FieldGuid({emptyAllow: true}),

      _source: new FieldText({ emptyAllow: true }),      // the ref to only update our own info
    }
  }

  /**
   * just process all keys individual
   *
   * @param fieldName
   * @param fields the field parsers
   * @param data the data given
   * @param logger Class where to store the errors
   */
  async processKeys(fieldName, fields, data, logger) {
    let result = {};
    let lookup = false;

    if (!data.countryId) {
      if  (data.country) {
        lookup = { baseType: 'country', value: data.country }
      } else if (data.zipcode) {
        result.countryId = await this._fields.zipcode.countryId(data.zipcode, false);
        if (result.countryId === false) {
          lookup = { baseType: 'country.zipcode', value: data.zipcode }
        }
      }
      if (lookup && this._lookup) {
        data.countryId = await this.lookup(lookup.value, lookup.baseType, fields, data, logger, undefined);
      }
    }

    let countryNumberRight = data.countryId === undefined || // the default
      (await this.lookup(data.countryId, 'country.numberRight', fields, data, logger, true));

    // streetNumber can be split if street and number do NOT exist
    if (data.street === undefined || data.number === undefined) {
      if (data.streetNumber) {
        if (countryNumberRight) {
          const re = /^(\d*[\wäöüß\d '\-\.]+)[,\s]+(\d+)\s*([\wäöüß\d\-\/]*)$/i;
          let match = data.streetNumber.match(re);
          if (match) {
            match.shift(); // verwijder element 0=het hele item
            //match is nu altijd een array van 3 items
            data.street = match[0].trim();
            data.number = match[1].trim();
            data.suffix = match[2].trim();
          } else {
            this.log(logger, 'warn', fieldName + '.streetNumber', `can not parse: "${data.streetNumber}"`);
            data.street = field.data.streetNumber;
          }
        } else {
          // we do not parse other formats
          data.street = data.streetNumber;
        }
      }
    }

    if (data.zipcode && !data.street) {
      // do a lookup on zipcode for nl && b
      data.street = await this.lookup({ zipcode: data.zipcode, number: data.number, countryId: data.countryId}, 'street', fields, data, logger, undefined )
    }
    if (!data.zipcode && (data.street && data.number && data.city)) {
      data.zipcode = await this.lookup({ street: data.street, number: data.number, city: data.city, countryId: data.countryId}, 'zipcode', fields, data, logger,undefined )
    }

    this.copyFieldsToResult(result, data, ['country', 'streetNumber']);

    let cFields = this.remapFields(result);
    return super.processKeys(fieldName, cFields, result, logger);
  }

}

module.exports.FieldLocation = FieldLocation;