/**
 * Field Compose like email, telephone etc
 */

const FieldText = require('./field-text').FieldText;
const FieldGuid = require('./field-text').FieldGuid;
const FieldObject = require('./field-object').FieldObject;
const FieldBoolean = require('./field-text-boolean').FieldTextBoolean;

const TYPE_UNKNOWN = 999999;

class FieldComposed extends FieldObject {

  constructor(options = {}) {
    super(options);
    this._fields = {
      type: new FieldText({emptyAllow: true}),        // the name of the code
      typeId: new FieldGuid({emptyAllow: true}),      // the id, overrules the type
      value: options.valueType ? options.valueType : new FieldText(),  // the field to store
      isDefault: new FieldBoolean(),
      _type: new FieldText({emptyAllow: true}),
      _source: new FieldText({emptyAllow: true}),      // textual version of the sourceId. Overrulde if _sourceId is set
      _sourceId: new FieldText({emptyAllow: true}),    // the codeId to sync with. if not storage space, places in typeId
    };
    // this._lookup = options.lookup;
  }

  /**
   * retrieve the base type from a string
   *   name: rec.email[0]  => email
   *         rec.location[3] => location
   * @param name
   * @private
   */
  _baseType(name) {
    let index = name.indexOf('[');
    if (index > -1) {
      let start = name.indexOf('.') + 1;
      return name.substr(start, index - start)
    } else {
      return name;
    }
  }
  /**
   * must translate type into typeId
   *
   * @param fieldName
   * @param fields the field parsers
   * @param data the data given
   * @param logger Class where to store the errors
   */
  async processKeys(fieldName, fields, data, logger) {
    if (! (fields['typeId'] && ! fields['typeId'].isEmpty(data['typeId']))) {
      let baseType = this._baseType(fieldName);
      if (this.lookup[baseType]) {
        data.typeId = await this.lookup[baseType](fieldName, data.type, 0, data);
      } else {
        this.log(logger, 'error', fieldName, `there is no lookup definition for ${this._baseType(fieldName)}`);
      }
    } else if (!fields.typeId) {
      this.log(logger, 'warn', fieldName, `no type or typeId set. marking unknown`);
      data['typeId'] = TYPE_UNKNOWN;
    }
    delete data.type;
    let cFields = this.remapFields(data);
    return super.processKeys(fieldName, cFields, data, logger);
  }
}

module.exports.FieldComposed = FieldComposed;
module.exports.TYPE_UNKNOWN = TYPE_UNKNOWN;