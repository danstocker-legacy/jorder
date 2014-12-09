/*global dessert, troop, sntls, jorder */
troop.postpone(jorder, 'Table', function () {
    "use strict";

    var base = sntls.Collection,
        self = base.extend();

    /**
     * Instantiates class.
     * @name jorder.Table.create
     * @function
     * @param {object[]} json
     * @return {jorder.Table}
     */

    /**
     * Indexed table. For quick table queries.
     * In technical terms, a table is a collection of rows, therefore it extends the Collection API.
     * @class jorder.Table
     * @extends sntls.Collection
     */
    jorder.Table = self
        .addMethods(/** @lends jorder.Table# */{
            /**
             * @param {object[]} json
             * @ignore
             */
            init: function (json) {
                dessert.isArrayOptional(json, "Invalid table buffer");

                base.init.call(this, json || []);

                /**
                 * Indexes associated with table
                 * @type {jorder.IndexCollection}
                 */
                this.indexCollection = jorder.IndexCollection.create();
            },

            /**
             * Sets row at given row ID.
             * @param {string|number} rowId
             * @param {object} row
             * @return {jorder.Table}
             */
            setItem: function (rowId, row) {
                // updating indexes
                this.indexCollection
                    .removeRow(this.getItem(rowId), rowId)
                    .addRow(row, rowId);

                base.setItem.call(this, rowId, row);

                return this;
            },

            /**
             * Sets multiple rows at once.
             * @param {object} rowIdRowPairs
             * @return {jorder.Table}
             */
            setItems: function (rowIdRowPairs) {
                var that = this;
                sntls.Collection.create(rowIdRowPairs)
                    .forEachItem(function (row, rowId) {
                        that.setItem(rowId, row);
                    });
                return this;
            },

            /**
             * Deletes a row from the given row ID.
             * @param {string|number} rowId
             * @return {jorder.Table}
             */
            deleteItem: function (rowId) {
                // updating indexes
                this.indexCollection
                    .removeRow(this.getItem(rowId), rowId);

                base.deleteItem.call(this, rowId);

                return this;
            },

            /**
             * Clones table.
             * @return {jorder.Table}
             */
            clone: function () {
                // cloning collection
                var result = /** @type jorder.Table */base.clone.call(this);

                // adding table specific properties
                this.indexCollection.forEachItem(function (/**jorder.Index*/ index) {
                    var rowSignature = index.rowSignature;
                    result.addIndex(rowSignature.fieldNames, rowSignature.signatureType);
                });

                return result;
            },

            /**
             * Adds an index to the table.
             * @param {string[]} fieldNames Names of fields included in the index
             * @param {string} [signatureType] Index type
             * @param {boolean} [isCaseInsensitive=false] Whether signature is case insensitive.
             * @param {string} [orderType='ascending'] Order type. Either 'ascending' or 'descending'.
             * @return {jorder.Table}
             */
            addIndex: function (fieldNames, signatureType, isCaseInsensitive, orderType) {
                var index = jorder.Index.create(fieldNames, signatureType, isCaseInsensitive, orderType);

                // adding index to collection
                this.indexCollection.setItem(index);

                // initializing index with table rows
                this.forEachItem(index.addRow, index);

                return this;
            },

            /**
             * Re-indexes table by rebuilding all indexes associated with table.
             * @return {jorder.Table}
             */
            reIndex: function () {
                var indexCollection = this.indexCollection;

                // clearing index buffer
                indexCollection.clearBuffers();

                // re-building each index
                this.forEachItem(indexCollection.addRow, indexCollection);

                return this;
            },

            /**
             * Retrieves rows assigned to the specified row IDs, wrapped in a hash.
             * @param {string[]|number[]} rowIds
             * @returns {sntls.Hash}
             */
            queryByRowIdsAsHash: function (rowIds) {
                return sntls.StringDictionary.create(rowIds)
                    .combineWith(this.toDictionary());
            },

            /**
             * Retrieves rows assigned to the specified row IDs.
             * @param {string[]|number[]} rowIds
             * @returns {object[]}
             */
            queryByRowIds: function (rowIds) {
                return this.queryByRowIdsAsHash(rowIds).items;
            },

            /**
             * Fetches table rows that match specified row expression and wraps them in a hash.
             * @param {object} rowExpr Row expression.
             * @return {sntls.Hash}
             */
            queryByRowAsHash: function (rowExpr) {
                var index = this.indexCollection.getBestIndexForRow(rowExpr);

                dessert.assert(!!index, "No index matches row");

                return index
                    // obtaining matching row IDs
                    .getRowIdsForKeysAsHash(index.rowSignature.getKeysForRow(rowExpr))
                    // joining actual rows that match
                    .toStringDictionary()
                    .combineWith(this.toDictionary());
            },

            /**
             * Fetches table rows that match specified row expression.
             * @param {object} rowExpr Table row or relevant field w/ value
             * @return {Array}
             */
            queryByRow: function (rowExpr) {
                return this.queryByRowAsHash(rowExpr).items;
            },

            /**
             * Fetches table rows that match specified rows or row fractions and wraps them in a hash.
             * @param {object[]} rows Table rows or relevant fields w/ values
             * @return {sntls.Hash}
             */
            queryByRowsAsHash: function (rows) {
                dessert.isArray(rows, "Invalid rows expression");

                var index = this.indexCollection.getBestIndexForRow(rows[0]);

                dessert.assert(!!index, "No index matches row");

                return sntls.Collection.create(rows)
                    // getting a collection of all keys fitting expression
                    .passEachItemTo(index.rowSignature.getKeysForRow, index.rowSignature)
                    // obtaining unique signatures matching rows
                    .toStringDictionary()
                    .getUniqueValuesAsHash()
                    // obtaining row IDs based on keys
                    .toCollection()
                    .passEachItemTo(index.getRowIdsForKeys, index)
                    // obtaining unique row IDs
                    .toStringDictionary()
                    .getUniqueValuesAsHash()
                    // joining matching rows to selected row IDs
                    .toStringDictionary()
                    .combineWith(this.toDictionary());
            },

            /**
             * Fetches table rows that match specified rows or row fractions.
             * @param {object[]} rows Table rows or relevant fields w/ values
             * @return {Array}
             */
            queryByRows: function (rows) {
                return this.queryByRowsAsHash(rows).items;
            },

            /**
             * Fetches table rows at the specified offset on the specified field, and wraps it in a hash.
             * @param {string[]} fieldNames Names of fields in which the offset must be matched.
             * @param {number} offset Position of row inside the table, in the order of the specified field.
             * @returns {sntls.Dictionary}
             */
            queryByOffsetAsHash: function (fieldNames, offset) {
                var index = this.indexCollection.getBestIndexForFields(fieldNames);

                return index
                    // obtaining row IDs matching offset
                    .getRowIdsBetweenAsHash(offset, offset + 1)
                    // joining actual rows that match
                    .toStringDictionary()
                    .combineWith(this.toDictionary());
            },

            /**
             * Fetches table rows at the specified offset on the specified field.
             * @param {string[]} fieldNames Name of field in which the offset must be matched.
             * @param {number} offset Position of row inside the table, in the order of the specified field.
             * @returns {object[]}
             */
            queryByOffset: function (fieldNames, offset) {
                return this.queryByOffsetAsHash(fieldNames, offset).items;
            },

            /**
             * Fetches table rows falling between the specified offsets by the specified field, and wraps it in a hash.
             * @param {string[]} fieldNames Names of fields in which the offset range must be matched.
             * @param {number} startOffset Start of offset range
             * @param {number} endOffset End of offset range
             * @returns {sntls.Dictionary}
             */
            queryByOffsetRangeAsHash: function (fieldNames, startOffset, endOffset) {
                var index = this.indexCollection.getBestIndexForFields(fieldNames);

                return index
                    // obtaining row IDs matching offset
                    .getRowIdsBetweenAsHash(startOffset, endOffset)
                    // joining actual rows that match
                    .toStringDictionary()
                    .combineWith(this.toDictionary());
            },

            /**
             * Fetches table rows falling between the specified offsets by the specified field, and wraps it in a hash.
             * @param {string[]} fieldNames Names of fields in which the offset range must be matched.
             * @param {number} startOffset Start of offset range
             * @param {number} endOffset End of offset range
             * @returns {object[]}
             */
            queryByOffsetRange: function (fieldNames, startOffset, endOffset) {
                return this.queryByOffsetRangeAsHash(fieldNames, startOffset, endOffset).items;
            },

            /**
             * Fetches table rows matching value range on the specified field, and wraps it in a hash.
             * @param {string[]} fieldNames Names of fields in which the value range must be matched.
             * @param {string|number} startValue Start of value range
             * @param {string|number} endValue End of value range
             * @param {number} [offset=0] Number of items to skip at the start of the result set.
             * @param {number} [limit=Infinity] Maximum number of items in result set.
             * @returns {sntls.Dictionary}
             */
            queryByRangeAsHash: function (fieldNames, startValue, endValue, offset, limit) {
                var index = this.indexCollection.getBestIndexForFields(fieldNames);

                return index
                    // obtaining row IDs matching interval
                    .getRowIdsForKeyRangeAsHash(startValue, endValue, offset, limit)
                    // joining actual rows that match
                    .toStringDictionary()
                    .combineWith(this.toDictionary());
            },

            /**
             * Fetches table rows matching value range on the specified field.
             * @param {string[]} fieldNames Names of fields in which the value range must be matched.
             * @param {string|number} startValue Start of value range
             * @param {string|number} endValue End of value range
             * @param {number} [offset=0] Number of items to skip at the start of the result set.
             * @param {number} [limit=Infinity] Maximum number of items in result set.
             * @returns {Object[]}
             */
            queryByRange: function (fieldNames, startValue, endValue, offset, limit) {
                return this.queryByRangeAsHash(fieldNames, startValue, endValue, offset, limit).items;
            },

            /**
             * Fetches table rows matching the specified prefix on the specified field, and wraps it in a hash.
             * @param {string[]} fieldNames Names of fields in which the prefix must be matched.
             * @param {string} prefix Prefix that must be matched.
             * @param {number} [offset=0] Number of items to skip at the start of the result set.
             * @param {number} [limit=Infinity] Maximum number of items in result set.
             * @returns {sntls.Hash}
             */
            queryByPrefixAsHash: function (fieldNames, prefix, offset, limit) {
                var index = this.indexCollection.getBestIndexForFields(fieldNames);

                dessert.assert(!!index, "No index matches row");

                return index
                    // obtaining row IDs matching prefix
                    .getRowIdsForPrefixAsHash(prefix, offset, limit)
                    // joining actual rows that match
                    .toStringDictionary()
                    .combineWith(this.toDictionary());
            },

            /**
             * Fetches table rows matching the specified prefix on the specified field.
             * @param {string[]} fieldNames Names of fields in which the prefix must be matched.
             * @param {string} prefix Prefix that must be matched.
             * @param {number} [offset=0] Number of items to skip at the start of the result set.
             * @param {number} [limit=Infinity] Maximum number of items in result set.
             * @returns {object[]}
             */
            queryByPrefix: function (fieldNames, prefix, offset, limit) {
                return this.queryByPrefixAsHash(fieldNames, prefix, offset, limit).items;
            },

            /**
             * Inserts single row into the table, updating all relevant indexes.
             * @param {object} row Table row
             * @returns {jorder.Table}
             */
            insertRow: function (row) {
                // adding row to table
                var rowId = this.items.push(row);

                // adding row to indexes
                this.indexCollection
                    // selecting fitting indexes
                    .getIndexesForRow(row)
                    // adding row to fitting indexes
                    .addRow(row, rowId - 1 + '');

                return this;
            },

            /**
             * Inserts multiple rows into the table. Updates all relevant indexes.
             * @param {object[]} rows Array of table rows.
             * @return {jorder.Table}
             */
            insertRows: function (rows) {
                sntls.Collection.create(rows)
                    .passEachItemTo(this.insertRow, this);
                return this;
            },

            /**
             * Updates rows that match the specified expression. The specified row will be assigned to
             * the matching row(s) by reference.
             * @param {object} rowExpr Row expression to be matched.
             * @param {object} row Row value after update.
             * @param {jorder.Index} [index] Index to be used for identifying row IDs. (For ambiguous indexes)
             * @returns {jorder.Table}
             */
            updateRowsByRow: function (rowExpr, row, index) {
                dessert
                    .isObject(rowExpr, "Invalid row expression")
                    .isObject(row, "Invalid row")
                    .isIndexOptional(index, "Invalid index");

                var indexCollection = this.indexCollection;

                // getting an index for the row
                index = index || indexCollection.getBestIndexForRow(rowExpr);

                dessert.assert(!!index, "No index matches row");

                var affectedRowIds = index
                    .getRowIdsForKeysAsHash(index.rowSignature.getKeysForRow(rowExpr))
                    .toCollection();

                // updating affected rows in indexes
                affectedRowIds.forEachItem(function (rowId) {
                    indexCollection
                        .removeRow(rowExpr, rowId)
                        .addRow(row, rowId);
                });

                // updating row in table
                affectedRowIds.passEachItemTo(base.setItem, this, 0, row);

                return this;
            },

            /**
             * Removes rows from the table that match the specified row.
             * @param {object} rowExpr Row expression to be matched.
             * @param {jorder.Index} [index] Index to be used for identifying row IDs. (For ambiguous indexes)
             * @return {jorder.Table}
             */
            deleteRowsByRow: function (rowExpr, index) {
                dessert
                    .isObject(rowExpr, "Invalid row expression")
                    .isIndexOptional(index, "Invalid index");

                var indexCollection = this.indexCollection;

                // getting an index for the row
                index = index || indexCollection.getBestIndexForRow(rowExpr);

                dessert.assert(!!index, "No index matches row");

                var affectedRowIds = index
                    .getRowIdsForKeysAsHash(index.rowSignature.getKeysForRow(rowExpr))
                    .toCollection();

                // removing affected rows from affected indexes
                affectedRowIds.passEachItemTo(indexCollection.removeRow, indexCollection, 1, rowExpr);

                // removing row from table
                affectedRowIds.passEachItemTo(base.deleteItem, this);

                return this;
            },

            /**
             * Clears rows and associated indexes.
             * @return {jorder.Table}
             */
            clear: function () {
                base.clear.call(this);

                // clearing indexes
                this.indexCollection.clear();

                return this;
            }
        });

    // aliases
    jorder.Table.addMethods(/** @lends jorder.Table# */{
        /**
         * @function
         * @param {string|number} rowId
         * @param {object} row
         * @return {jorder.Table}
         * @see jorder.Table#setItem
         */
        setRow: self.setItem,

        /**
         * @function
         * @param {object} rowIdRowPairs
         * @return {jorder.Table}
         * @see jorder.Table#setItems
         */
        setRows: self.setItems,

        /**
         * @function
         * @param {string|number} rowId
         * @return {jorder.Table}
         * @see jorder.Table#deleteItem
         */
        deleteRow: self.deleteItem
    });
});

troop.amendPostponed(sntls, 'Hash', function () {
    "use strict";

    sntls.Hash.addMethods(/** @lends sntls.Hash */{
        /**
         * Reinterprets hash as table. Hash must contain array buffer.
         * @return {jorder.Table}
         */
        toTable: function () {
            return jorder.Table.create(this.items);
        }
    });
});

(function () {
    "use strict";

    dessert.addTypes(/** @lends dessert */{
        /** @param {jorder.Table} expr */
        isTable: function (expr) {
            return jorder.Table.isBaseOf(expr);
        },

        /** @param {jorder.Table} [expr] */
        isTableOptional: function (expr) {
            return typeof expr === 'undefined' ||
                   jorder.Table.isBaseOf(expr);
        }
    });
}());
