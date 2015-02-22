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
     * @param {string} [orderType='ascending'] Order type. Either 'ascending' or 'descending'.
     * @returns {jorder.Index}
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
             * @param {string} [orderType='ascending'] Order type. Either 'ascending' or 'descending'.
             * @ignore
             */
            init: function (fieldNames, signatureType, isCaseInsensitive, orderType) {
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
                this.sortedKeys = sntls.OrderedStringList.create([], orderType);
            },

            /**
             * Adds single row to index.
             * @param {object} row Table row
             * @param {string|number} rowId Row ID: original index of row in table
             * @returns {jorder.Index}
             */
            addRow: function (row, rowId) {
                // calculating index keys based on row
                var keys = this.rowSignature.getKeysForRow(row);

                if (keys.length) {
                    // only when suitable keys can be extracted from row

                    // adding key / rowId pairs to lookup index
                    this.rowIdLookup.addItems(keys, rowId);

                    // adding keys to ordered index (w/ multiplicity)
                    this.sortedKeys.addItems(keys);
                }

                return this;
            },

            /**
             * Removes single row from index.
             * @param {object} row Table row
             * @param {string} rowId Row ID: original index of row in table
             * @returns {jorder.Index}
             */
            removeRow: function (row, rowId) {
                // calculating index keys based on row
                var keys = this.rowSignature.getKeysForRow(row);

                if (keys.length) {
                    // only when suitable keys can be extracted from row

                    // removing key / rowId pairs from lookup index
                    this.rowIdLookup.removeItems(keys, rowId);

                    // removing keys from ordered index (w/ multiplicity)
                    this.sortedKeys.removeItems(keys);
                }

                return this;
            },

            /**
             * Clears index buffers.
             * @returns {jorder.Index}
             */
            clearBuffers: function () {
                // clearing lookup buffers
                this.rowIdLookup.clear();
                this.sortedKeys.clear();

                return this;
            },

            /**
             * Retrieves a row ID (or row IDs if index is not unique) associated with the specified offset in the index.
             * Supposed to be used on unique indexes, where position in the index is unambiguous.
             * @param {number} offset
             * @returns {number|number[]}
             */
            getRowIdAt: function (offset) {
                return this.sortedKeys.items.slice(offset, offset + 1)
                    .toStringDictionary()
                    .combineWith(this.rowIdLookup)
                    .getFirstValue();
            },

            /**
             * Retrieves a list of row IDs that are associated with the index entries between the specified positions,
             * wrapped in a hash. Result may contain array items in case the index is not unique.
             * Supposed to be used on unique indexes, where position in the index is unambiguous.
             * @param {number} startOffset
             * @param {number} endOffset
             * @returns {sntls.Dictionary}
             */
            getRowIdsBetweenAsHash: function (startOffset, endOffset) {
                return this.sortedKeys.items.slice(startOffset, endOffset)
                    .toStringDictionary()
                    .combineWith(this.rowIdLookup);
            },

            /**
             * Retrieves a list of row ids that are associated with the index entries between the specified positions,
             * wrapped in a hash.
             * @param {number} startOffset
             * @param {number} endOffset
             * @returns {number[]}
             */
            getRowIdsBetween: function (startOffset, endOffset) {
                return this.getRowIdsBetweenAsHash(startOffset, endOffset).items;
            },

            /**
             * Retrieves a list of row ids associated with the specified keys.
             * @param {string[]|number[]|string|number} keys Index keys to be looked up, expected to be
             * in correct case (ie. lowercase when index is case insensitive).
             * @returns {string[]}
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
             * @returns {sntls.Hash}
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
             * @returns {string[]}
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
        /** @param {jorder.Index} expr */
        isIndex: function (expr) {
            return jorder.Index.isBaseOf(expr);
        },

        /** @param {jorder.Index} [expr] */
        isIndexOptional: function (expr) {
            return typeof expr === 'undefined' ||
                   jorder.Index.isBaseOf(expr);
        }
    });

    troop.Properties.addProperties.call(
        Array.prototype,
        /** @lends Array# */{
            /**
             * Creates a new Index instance based on the current array, as a list of field names.
             * @param {string} [signatureType='string'] Signature type, see SIGNATURE_TYPES.
             * @param {boolean} [isCaseInsensitive=false] Whether signature is case insensitive.
             * @param {string} [orderType='ascending'] Order type. Either 'ascending' or 'descending'.
             * @returns {jorder.Index}
             */
            toIndex: function (signatureType, isCaseInsensitive, orderType) {
                return jorder.Index.create(this, signatureType, isCaseInsensitive, orderType);
            }
        },
        false, false, false);
}());

