/**
 * Datastore Index
 */
/*global dessert, troop, sntls, jorder */
troop.postpone(jorder, 'Index', function () {
    "use strict";

    /**
     * @class jorder.Index
     * @extends troop.Base
     */
    jorder.Index = troop.Base.extend()
        .addMethods(/** @lends jorder.Index */{
            /**
             * @name jorder.Index.create
             * @return {jorder.Index}
             */

            /**
             * @param {string[]} fieldNames Field names
             * @param {number} [signatureType='string'] Signature type, see SIGNATURE_TYPES
             */
            init: function (fieldNames, signatureType) {
                /**
                 * Row signature associated with index.
                 * Provides validation and index key generation.
                 * @type {jorder.RowSignature}
                 */
                this.rowSignature = jorder.RowSignature.create(fieldNames, signatureType);

                /**
                 * Holds index key -> row ID associations.
                 * One index key may reference more than one row IDs.
                 * @type {sntls.StringDictionary}
                 */
                this.rowIdLookup = sntls.StringDictionary.create();

                /**
                 * Holds index keys in ascending order. (With multiplicity)
                 * @type {sntls.OrderedStringList}
                 */
                this.sortedKeys = sntls.OrderedStringList.create();
            },

            /**
             * Adds single row to index.
             * @param {object} row Table row
             * @param {string|number} rowId Row ID: original index of row in table
             * @return {jorder.Index}
             */
            addRow: function (row, rowId) {
                // calculating index keys based on row
                var keys = this.rowSignature.getKeysForRow(row);

                // adding key / rowId pairs to lookup index
                this.rowIdLookup.addItems(keys, rowId);

                // adding keys to ordered index (w/ multiplicity)
                this.sortedKeys.addItems(keys);

                return this;
            },

            /**
             * Removes single row from index.
             * @param {object} row Table row
             * @param {string} rowId Row ID: original index of row in table
             * @return {jorder.Index}
             */
            removeRow: function (row, rowId) {
                // calculating index keys based on row
                var keys = this.rowSignature.getKeysForRow(row);

                // removing key / rowId pairs from lookup index
                this.rowIdLookup.removeItems(keys, rowId);

                // removing keys from ordered index (w/ multiplicity)
                this.sortedKeys.removeItems(keys);

                return this;
            },

            /**
             * Clears index buffers.
             * @return {jorder.Index}
             */
            clearBuffers: function () {
                // clearing lookup buffers
                this.rowIdLookup.clear();
                this.sortedKeys.clear();

                return this;
            },

            /**
             * Retrieves a list of row ids associated with the specified keys.
             * @param {string[]|number[]|string|number} keys
             * @return {string[]}
             */
            getRowIdsForKeys: function (keys) {
                if (!(keys instanceof Array)) {
                    keys = [keys];
                }

                return sntls.StringDictionary.create(keys)
                    // selecting row IDs for specified keys
                    .combineWith(this.rowIdLookup)
                    // collapsing unique row IDs
                    .reverse()
                    .getKeys();
            },

            /**
             * Retrieves a list of row ids associated with the specified keys, wrapped in a hash.
             * @param {string[]|number[]|string|number} keys
             * @return {sntls.Hash}
             */
            getRowIdsForKeysAsHash: function (keys) {
                return sntls.Hash.create(this.getRowIdsForKeys(keys));
            },

            /**
             * Retrieves a list of unique row IDs matching index values
             * that fall between the specified bounds.
             * @param {string|number} startValue Lower index bound
             * @param {string|number} endValue Upper index bound
             * @return {string[]}
             */
            getRowIdsForKeyRange: function (startValue, endValue /*, offset, limit*/) {
                return this.sortedKeys.getRangeAsHash(startValue, endValue)
                    // collapsing unique index values
                    .toStringDictionary()
                    .reverse()
                    // getting unique index values in a hash
                    .getKeysAsHash()
                    // obtaining row IDs from lookup
                    .toStringDictionary()
                    .combineWith(this.rowIdLookup)
                    // collapsing unique row IDs
                    .reverse()
                    .getKeys();
            },

            /**
             * Retrieves a list of unique row IDs matching index values
             * that fall between the specified bounds, wrapped in a hash.
             * @param {string|number} startValue Lower index bound
             * @param {string|number} endValue Upper index bound
             * @returns {sntls.Hash}
             */
            getRowIdsForKeyRangeAsHash: function (startValue, endValue /*, offset, limit*/) {
                return sntls.Hash.create(this.getRowIdsForKeyRange(startValue, endValue));
            }
        });
});

(function () {
    "use strict";

    dessert.addTypes(/** @lends dessert */{
        isIndex: function (expr) {
            return jorder.Index.isBaseOf(expr);
        },

        isIndexOptional: function (expr) {
            return typeof expr === 'undefined' ||
                   jorder.Index.isBaseOf(expr);
        }
    });
}());

