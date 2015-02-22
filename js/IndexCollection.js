/*global dessert, troop, sntls, jorder */
troop.postpone(jorder, 'IndexCollection', function () {
    "use strict";

    var base = sntls.Collection;

    /**
     * Instantiates class.
     * @name jorder.IndexCollection.create
     * @function
     * @param {object|Array} [items] Initial contents.
     * @returns {jorder.IndexCollection}
     */

    /**
     * Collection of indexes. Selects index(es) contained by the collection that fit data row(s).
     * @class jorder.IndexCollection
     * @extends sntls.Collection
     * @extends jorder.Index
     */
    jorder.IndexCollection = sntls.Collection.of(jorder.Index).extend()
        .addPrivateMethods(/** @lends jorder.IndexCollection */{
            /**
             * Determines whether all fields of the specified index
             * are present in the specified row.
             * @param {object} row Table row
             * @param {jorder.Index} index
             * @returns {Boolean}
             * @private
             */
            _isIndexContainedByRow: function (row, index) {
                return index.rowSignature.containedByRow(row);
            },

            /**
             * Returns the field count for the specified index.
             * @param {jorder.Index} index
             * @returns {Number}
             * @private
             */
            _indexFieldCountMapper: function (index) {
                return index.rowSignature.fieldNames.length;
            },

            /**
             * Array.sort() comparator for descending order.
             * @param {number} a
             * @param {number} b
             * @returns {Number}
             * @private
             */
            _descNumericComparator: function (a, b) {
                return a < b ? 1 : a > b ? -1 : 0;
            },

            /**
             * @param {jorder.Index} index
             * @private
             */
            _getIndexSignature: function (index) {
                return index.rowSignature.fieldSignature + '%' + index.sortedKeys.orderType;
            },

            /**
             * @param {jorder.RowSignature} rowSignature
             * @param {string} orderType
             * @returns {string}
             * @private
             */
            _getIndexSignatureFromRowSignature: function (rowSignature, orderType) {
                return rowSignature.fieldSignature + '%' + (orderType || sntls.OrderedList.orderTypes.ascending);
            }
        })
        .addMethods(/** @lends jorder.IndexCollection# */{
            /**
             * Sets an index in the collection.
             * Item key is calculated based index signature.
             * @param {jorder.Index} index
             * @returns {jorder.IndexCollection}
             */
            setItem: function (index) {
                dessert.isIndex(index, "Invalid index");
                base.setItem.call(this, this._getIndexSignature(index), index);
                return this;
            },

            /**
             * Removes an index from the collection.
             * Item key is calculated based index signature.
             * @param {jorder.Index} index
             * @returns {jorder.IndexCollection}
             */
            deleteItem: function (index) {
                dessert.isIndex(index, "Invalid index");
                base.deleteItem.call(this, this._getIndexSignature(index), index);
                return this;
            },

            /**
             * Retrieves a collection of indexes that fully match the specified row.
             * @param {object} row
             * @returns {jorder.IndexCollection}
             */
            getIndexesForRow: function (row) {
                return /** @type {jorder.IndexCollection} */ this
                    .filterBySelector(this._isIndexContainedByRow.bind(this, row));
            },

            /**
             * Retrieves the first index matching the specified row.
             * @param {object} row
             * @returns {jorder.Index}
             */
            getIndexForRow: function (row) {
                return this
                    // keeping indexes that match row
                    .getIndexesForRow(row)
                    // picking first we can find
                    .getFirstValue();
            },

            /**
             * Retrieves the index best matching the specified row
             * @param {object} row
             * @returns {jorder.Index}
             */
            getBestIndexForRow: function (row) {
                return this
                    // keeping indexes that match row
                    .getIndexesForRow(row)
                    // assigning number of matching fields to each value
                    .mapKeys(this._indexFieldCountMapper)
                    // picking index with highest field count
                    .getSortedValues(this._descNumericComparator)[0];
            },

            /**
             * Retrieves the index best matching the specified field names.
             * @param {string[]} fieldNames
             * @returns {jorder.Index}
             */
            getBestIndexForFields: function (fieldNames) {
                var rowExpr = fieldNames.toStringDictionary().reverse();
                return this.getBestIndexForRow(rowExpr.items);
            },

            /**
             * Retrieves an index matching the specified fields
             * @param {string[]} fieldNames
             * @param {string} [signatureType]
             * @param {string} [orderType]
             * @returns {jorder.Index}
             */
            getIndexForFields: function (fieldNames, signatureType, orderType) {
                var rowSignature = jorder.RowSignature.create(fieldNames, signatureType);
                return this.getItem(this._getIndexSignatureFromRowSignature(rowSignature, orderType));
            }
        });
});
