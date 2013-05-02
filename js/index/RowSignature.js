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
             */
            FIELD_SEPARATOR: '_',

            /**
             * Signature must be one of these types
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

                if (fieldNames.length > 1) {
                    // validating signature type vs. field count
                    dessert
                        .assert(signatureType !== SIGNATURE_TYPES.fullText, "Full text row signature is restricted to a single field")
                        .assert(signatureType !== SIGNATURE_TYPES.number, "Number row signature is restricted to a single field");
                }

                // default signature type is string
                signatureType = signatureType || SIGNATURE_TYPES.string;

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
                return '';
            },

            /**
             * Generates multiple keys for the submitted row based on the current signature rules.
             * @param {object} row Raw table row
             * @return {string[]}
             */
            getKeysForRow: function (row) {
                return [];
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
