/*global dessert, troop, sntls, jorder */
troop.postpone(jorder, 'Table', function () {
    "use strict";

    var Collection = sntls.Collection,
        IndexCollection = jorder.IndexCollection,
        base = sntls.Collection;

    /**
     * Instantiates class.
     * @name jorder.Table.create
     * @function
     * @param {object[]} json
     * @return {jorder.Table}
     */

    /**
     * Indexed table. For quick table queries.
     * @class jorder.Table
     * @extends sntls.Collection
     */
    jorder.Table = base.extend()
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
                this.indexCollection = IndexCollection.create();
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
             * @return {jorder.Table}
             */
            addIndex: function (fieldNames, signatureType) {
                var index = jorder.Index.create(fieldNames, signatureType);

                // adding index to collection
                this.indexCollection.setItem(index);

                // initializing index with table rows
                this.forEachItem(index.addRow.bind(index));

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
                this.forEachItem(indexCollection.addRow.bind(indexCollection));

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
                return /** @type {object[]} */this.queryByRowIdsAsHash(rowIds).items;
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

                index = index || this.indexCollection.getBestIndexForRow(rowExpr);

                dessert.assert(!!index, "No index matches row");

                index
                    // obtaining matching row IDs
                    .getRowIdsForKeysAsHash(index.rowSignature.getKeysForRow(rowExpr))
                    // changing value to specified row on each row ID
                    .toCollection()
                    .passEachItemTo(this.setItem, this, 0, row);

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

                // getting an index for the row
                index = index || this.indexCollection.getBestIndexForRow(rowExpr);

                dessert.assert(!!index, "No index matches row");

                index
                    // obtaining matching row IDs
                    .getRowIdsForKeysAsHash(index.rowSignature.getKeysForRow(rowExpr))
                    // deleting rows one by one
                    .toCollection()
                    .forEachItem(Collection.deleteItem.bind(this));

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
});

(function () {
    "use strict";

    dessert.addTypes(/** @lends dessert */{
        isTable: function (expr) {
            return jorder.Table.isBaseOf(expr);
        },

        isTableOptional: function (expr) {
            return typeof expr === 'undefined' ||
                   jorder.Table.isBaseOf(expr);
        }
    });

    sntls.Hash.addMethods(/** @lends sntls.Hash */{
        /**
         * Reinterprets hash as table. Hash must contain array buffer.
         * @return {jorder.Table}
         */
        toTable: function () {
            return jorder.Table.create(this.items);
        }
    });
}());


