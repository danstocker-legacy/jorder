/**
 * Row Signature
 *
 * Implements typed primitive representation of a table row,
 * its validation and generation.
 */
/*global dessert, troop, sntls, jorder */
troop.promise(jorder, 'RowSignature', function () {
    "use strict";

    var hOP = Object.prototype.hasOwnProperty;

    /**
     * @class jorder.RowSignature
     * @extends troop.Base
     */
    jorder.RowSignature = troop.Base.extend()
        .addConstant(/** @lends jorder.RowSignature */{
            /**
             * Field separator, must be escapable w/ encodeURI
             * @type {string}
             * @constant
             */
            FIELD_SEPARATOR_STRING: '|',

            /**
             * Field separator for numeric signature.
             * Signature is calculated by (quasi-) shifting field
             * values by 32 bits.
             * @type {number}
             * @constant
             */
            FIELD_SEPARATOR_NUMBER: Math.pow(2, 32),

            /**
             * Regular expression for splitting along word boundaries
             * @type {RegExp}
             * @constant
             */
            RE_WORD_DELIMITER: /\s+/g,

            /**
             * Separates signature type in field signature from fields, must be escapable w/ encodeURI
             * @type {string}
             * @constant
             */
            SIGNATURE_TYPE_SEPARATOR: '%',

            /**
             * Signature must be one of these types
             * @constant
             */
            SIGNATURE_TYPES: {
                array   : 'array',
                fullText: 'fullText',
                number  : 'number',
                string  : 'string'
            }
        })
        .addPrivateMethod(/** @lends jorder.RowSignature */{
            /**
             * Collection iteration handler URI encoding string items.
             * @param {string} item Collection item
             * @return {string}
             * @private
             */
            _uriEncoder: function (item) {
                return encodeURI(item);
            },

            /**
             * Creates an array of specified length & filled with
             * the specified value at each position.
             * @param {number} length
             * @param {*} value
             * @return {*[]}
             * @private
             */
            _createUniformArray: function (length, value) {
                var result = new Array(length),
                    i;
                for (i = 0; i < length; i++) {
                    result[i] = value;
                }
                return result;
            },

            /**
             * Collection iteration handler URI encoding string array items.
             * @param {*[]} item Item in an array collection.
             * @return {*[]}
             * @private
             */
            _arrayUriEncoder: function (item) {
                var i, elem;
                for (i = 0; i < item.length; i++) {
                    elem = item[i];
                    if (typeof elem === 'string') {
                        item[i] = encodeURI(elem);
                    }
                }
                return item;
            }
        })
        .addMethod(/** @lends jorder.RowSignature */{
            /**
             * @name jorder.RowSignature.create
             * @return {jorder.RowSignature}
             */

            /**
             * @param {string[]} fieldNames Field names
             * @param {number} [signatureType='string'] Signature type, see SIGNATURE_TYPES
             */
            init: function (fieldNames, signatureType) {
                dessert
                    .isArray(fieldNames, "Invalid field names")
                    .assert(!!fieldNames.length, "Empty field name list")
                    .isStringOptional(signatureType, "Invalid signature type");

                var SIGNATURE_TYPES = this.SIGNATURE_TYPES;

                // conditional assertions
                if (signatureType) {
                    // validating signature type
                    dessert.assert(SIGNATURE_TYPES.hasOwnProperty(signatureType), "Invalid signature type");
                }

                /**
                 * @type {String[]}
                 */
                this.fieldNames = fieldNames;

                /**
                 * Lookup object for field names
                 * @type {object}
                 */
                this.fieldNameLookup = sntls.StringDictionary
                    .create({
                        1: fieldNames
                    })
                    .reverse()
                    .items;

                /**
                 * @type {string}
                 * @default SIGNATURE_TYPES.string
                 */
                this.signatureType = signatureType || SIGNATURE_TYPES.string;

                /**
                 * Signature composed of field names and type
                 * This is the signature that may identify an index
                 * (Row signatures don't contain type info)
                 * @type {String}
                 */
                this.fieldSignature = [
                    this._arrayUriEncoder(fieldNames)
                        .join(this.FIELD_SEPARATOR_STRING),
                    this.signatureType
                ].join(this.SIGNATURE_TYPE_SEPARATOR);
            },

            /**
             * Generates a key for the submitted row based on the current signature rules.
             * @param {object} row Raw table row
             * @return {string|number}
             */
            getKeyForRow: function (row) {
                dessert.assert(this.containedByRow(row), "Row doesn't fit signature");

                var SIGNATURE_TYPES = this.SIGNATURE_TYPES,
                    fieldNames = this.fieldNames,
                    radices, digits;

                switch (this.signatureType) {
                case SIGNATURE_TYPES.number:
                    // extracting numeric key
                    if (fieldNames.length === 1) {
                        return row[fieldNames[0]];
                    } else {
                        radices = this._createUniformArray(fieldNames.length, this.FIELD_SEPARATOR_NUMBER);
                        digits = sntls.Collection.create(row)
                            .filterByKeys(fieldNames)
                            .getValues();

                        return jorder.IrregularNumber.create(radices)
                            .setDigits(digits)
                            .asScalar;
                    }
                    break;

                case SIGNATURE_TYPES.string:
                    // extracting string key
                    if (fieldNames.length === 1) {
                        return this._uriEncoder(row[fieldNames[0]]);
                    } else {
                        return sntls.StringCollection.create(row)
                            // reducing row to relevant fields
                            .filterByKeys(fieldNames)
                            .forEachItem(this._uriEncoder)
                            .getValues()
                            .join(this.FIELD_SEPARATOR_STRING);
                    }
                    break;

                default:
                    dessert.assert(false, "Invalid signature type");
                    return ''; // will never be reached
                }
            },

            /**
             * Generates multiple keys for the submitted row based on the current signature rules.
             * @param {object} row Raw table row
             * @return {string[]}
             */
            getKeysForRow: function (row) {
                var SIGNATURE_TYPES = this.SIGNATURE_TYPES,
                    fieldNames = this.fieldNames;

                switch (this.signatureType) {
                case SIGNATURE_TYPES.array:
                    if (fieldNames.length === 1) {
                        // quick solution for single-field signature
                        // returning first field as is (already array)
                        return this._arrayUriEncoder(row[fieldNames[0]]);
                    } else {
                        // calculating all possible signatures for row
                        return sntls.Collection.create(row)
                            // reducing row to relevant fields
                            .filterByKeys(fieldNames)
                            // discarding field names in row
                            .getValuesAsHash()
                            // getting all combinations w/ each field contributing one of their items
                            .toMultiArray()
                            .getCombinationsAsHash()
                            // joining combinations to make strings
                            .toCollection()
                            .forEachItem(this._arrayUriEncoder)
                            .callOnEachItem('join', this.FIELD_SEPARATOR_STRING)
                            // finalizing results
                            .getValues();
                    }
                    break;

                case SIGNATURE_TYPES.fullText:
                    if (fieldNames.length === 1) {
                        // quick solution for single-field signature
                        // extracting multiple keys by splitting into words
                        return this._arrayUriEncoder(row[fieldNames[0]].split(this.RE_WORD_DELIMITER));
                    } else {
                        // calculating all possible signatures for row
                        return sntls.StringCollection.create(row)
                            // reducing row to relevant fields
                            .filterByKeys(fieldNames)
                            // splitting all fields into words
                            .split(this.RE_WORD_DELIMITER)
                            // discarding field names in row
                            .getValuesAsHash()
                            // getting all word combinations w/ each field contributing one word
                            .toMultiArray()
                            .getCombinationsAsHash()
                            // joining combinations to make strings
                            .toCollection()
                            .forEachItem(this._arrayUriEncoder)
                            .callOnEachItem('join', this.FIELD_SEPARATOR_STRING)
                            // finalizing results
                            .getValues();
                    }
                    break;

                default:
                case SIGNATURE_TYPES.number:
                case SIGNATURE_TYPES.string:
                    // extracting single key wrapped in array
                    return [this.getKeyForRow(row)];
                }
            },

            /**
             * Tells whether all signature fields are present in the row,
             * ie. that the row fits the signature fully.
             * @param {object} row Raw table row
             * @return {boolean}
             * TODO: adding type check
             */
            containedByRow: function (row) {
                var fieldNames = this.fieldNames,
                    i;

                for (i = 0; i < fieldNames.length; i++) {
                    if (!hOP.call(row, fieldNames[i])) {
                        // signature field is not in row
                        return false;
                    }
                }

                return true;
            },

            /**
             * Tells whether all row fields are present in the signature.
             * @param {object} row Raw table row
             * @return {boolean}
             */
            containsRow: function (row) {
                var fieldNameLookup = this.fieldNameLookup,
                    rowFieldNames = Object.keys(row),
                    i;

                for (i = 0; i < rowFieldNames.length; i++) {
                    if (!hOP.call(fieldNameLookup, rowFieldNames[i])) {
                        // row field is not in signature
                        return false;
                    }
                }

                return true;
            }
        });
});
