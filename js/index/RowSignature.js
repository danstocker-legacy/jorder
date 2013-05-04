/**
 * Row Signature
 *
 * Manages
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
             * Field separator
             * @type {string}
             * @constant
             */
            FIELD_SEPARATOR: '_',

            /**
             * Regular expression for splitting along word boundaries
             * @type {RegExp}
             * @constant
             */
            RE_WORD_DELIMITER: /\s+/g,

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

                // default signature type is string
                signatureType = signatureType || SIGNATURE_TYPES.string;

                if (fieldNames.length > 1 && signatureType === SIGNATURE_TYPES.number) {
                    dessert.assert(false, "Signature type is restricted to a single field", signatureType);
                }

                /**
                 * @type {String[]}
                 */
                this.fieldNames = fieldNames;

                /**
                 * Lookup object for field names
                 * @type {object}
                 */
                this.fieldNameLookup = sntls.Dictionary
                    .create({
                        1: fieldNames
                    })
                    .reverse()
                    .items;

                /**
                 * @type {string}
                 */
                this.signatureType = signatureType;

                /**
                 * Signature composed of field names
                 * @type {String}
                 */
                this.fieldSignature = encodeURI(fieldNames.join(this.FIELD_SEPARATOR));
            },

            /**
             * Generates a key for the submitted row based on the current signature rules.
             * @param {object} row Raw table row
             * @return {string}
             */
            getKeyForRow: function (row) {
                dessert.assert(this.containedByRow(row), "Row doesn't fit signature");

                var SIGNATURE_TYPES = this.SIGNATURE_TYPES,
                    fieldNames = this.fieldNames,
                    result, i;

                switch (this.signatureType) {
                case SIGNATURE_TYPES.number:
                    // extracting numeric key
                    // TODO: multi-field signatures for numeric types
                    return row[fieldNames[0]];

                case SIGNATURE_TYPES.string:
                    // extracting (composite) key from any other type
                    result = [];
                    for (i = 0; i < fieldNames.length; i++) {
                        result.push(row[fieldNames[i]]);
                    }
                    return encodeURI(result.join(this.FIELD_SEPARATOR));

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
                        return row[fieldNames[0]];
                    } else {
                        // calculating all possible signatures for row
                        return sntls.Collection.create(row)
                            // reducing row to relevant fields
                            .select(fieldNames)
                            // discarding field names in row
                            .asArrayInHash()
                            // getting all combinations w/ each field contributing one of their items
                            .toMultiArray()
                            .getCombinationsAsHash()
                            // joining combinations to make strings
                            .toArrayCollection()
                            .join(this.FIELD_SEPARATOR)
                            // finalizing results
                            .asArray();
                    }
                    break;

                case SIGNATURE_TYPES.fullText:
                    if (fieldNames.length === 1) {
                        // quick solution for single-field signature
                        // extracting multiple keys by splitting into words
                        return row[fieldNames[0]].split(this.RE_WORD_DELIMITER);
                    } else {
                        // calculating all possible signatures for row
                        return sntls.StringCollection.create(row)
                            // reducing row to relevant fields
                            .select(fieldNames)
                            // splitting all fields into words
                            .split(this.RE_WORD_DELIMITER)
                            // discarding field names in row
                            .asArrayInHash()
                            // getting all word combinations w/ each field contributing one word
                            .toMultiArray()
                            .getCombinationsAsHash()
                            // joining combinations to make strings
                            .toArrayCollection()
                            .join(this.FIELD_SEPARATOR)
                            // finalizing results
                            .asArray();
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
