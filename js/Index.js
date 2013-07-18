/*global dessert, troop, sntls, jorder */
troop.postpone(jorder, 'Index', function () {
    "use strict";

    /**
     * Instantiates class.
     * @name jorder.Index.create
     * @function
     * @param {string[]} fieldNames Field names
     * @param {string} [signatureType='string'] Signature type, see SIGNATURE_TYPES.
     * @param {boolean} [isCaseInsensitive=false] Whether signature is case insensitive.
     * @return {jorder.Index}
     */

    /**
     * Table index. Keeps track of single of composite fields, enables binary search in tables.
     * @class jorder.Index
     * @extends troop.Base
     */
    jorder.Index = troop.Base.extend()
        .addPrivateMethods(/** @lends jorder.Index# */{
            /**
             * Retrieves unique row IDs for non-unique list of keys (row signatures).
             * @param {sntls.Hash} keysAsHash
             * @returns {string[]}
             * @private
             */
            _getUniqueRowIdsForKeys: function (keysAsHash) {
                return keysAsHash
                    // collapsing unique index values
                    .toStringDictionary()
                    .getUniqueValuesAsHash()
                    // obtaining row IDs from lookup
                    .toStringDictionary()
                    .combineWith(this.rowIdLookup)
                    // collapsing unique row IDs
                    .getUniqueValues();
            }
        })
        .addMethods(/** @lends jorder.Index# */{
            /**
             * @param {string[]} fieldNames Field names
             * @param {string} [signatureType='string'] Signature type, see SIGNATURE_TYPES.
             * @param {boolean} [isCaseInsensitive=false] Whether signature is case insensitive.
             * @ignore
             */
            init: function (fieldNames, signatureType, isCaseInsensitive) {
                /**
                 * Row signature associated with index.
                 * Provides validation and index key generation.
                 * @type {jorder.RowSignature}
                 */
                this.rowSignature = jorder.RowSignature.create(fieldNames, signatureType, isCaseInsensitive);

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
             * @param {string[]|number[]|string|number} keys Index keys to be looked up, expected to be
             * in correct case (ie. lowercase when index is case insensitive).
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
                    .getUniqueValues();
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
             * @param {number} [offset=0] Number of index entries to skip at start.
             * @param {number} [limit=Infinity] Maximum number of index entries to fetch.
             * @return {string[]}
             */
            getRowIdsForKeyRange: function (startValue, endValue, offset, limit) {
                if (this.rowSignature.isCaseInsensitive) {
                    // preparing key bounds for case insensitivity
                    startValue = startValue.toLowerCase();
                    endValue = endValue.toLowerCase();
                }

                return this.sortedKeys.getRangeAsHash(startValue, endValue, offset, limit)
                    .passSelfTo(this._getUniqueRowIdsForKeys, this);
            },

            /**
             * Retrieves a list of unique row IDs matching index values
             * that fall between the specified bounds, wrapped in a hash.
             * @param {string|number} startValue Lower index bound
             * @param {string|number} endValue Upper index bound
             * @param {number} [offset=0] Number of index entries to skip at start.
             * @param {number} [limit=Infinity] Maximum number of index entries to fetch.
             * @returns {sntls.Hash}
             */
            getRowIdsForKeyRangeAsHash: function (startValue, endValue, offset, limit) {
                return sntls.Hash.create(this.getRowIdsForKeyRange(startValue, endValue, offset, limit));
            },

            /**
             * Retrieves a list of unique row IDs matching index values
             * that start with the specified prefix.
             * @param {string} prefix Key prefix to be matched.
             * @param {number} [offset=0] Number of index entries to skip at start.
             * @param {number} [limit=Infinity] Maximum number of index entries to fetch.
             * @returns {*}
             */
            getRowIdsForPrefix: function (prefix, offset, limit) {
                if (this.rowSignature.isCaseInsensitive) {
                    // preparing key prefix for case insensitivity
                    prefix = prefix.toLowerCase();
                }

                return this.sortedKeys.getRangeByPrefixAsHash(prefix, false, offset, limit)
                    .passSelfTo(this._getUniqueRowIdsForKeys, this);
            },

            /**
             * Retrieves a list of unique row IDs matching index values
             * that start with the specified prefix, wrapped in a hash.
             * @param {string} prefix Key prefix to be matched.
             * @param {number} [offset=0] Number of index entries to skip at start.
             * @param {number} [limit=Infinity] Maximum number of index entries to fetch.
             * @returns {sntls.Hash}
             */
            getRowIdsForPrefixAsHash: function (prefix, offset, limit) {
                return sntls.Hash.create(this.getRowIdsForPrefix(prefix, offset, limit));
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

