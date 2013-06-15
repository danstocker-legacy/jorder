/**
 * Datastore Table
 */
/*global dessert, troop, sntls, jorder */
troop.postpone(jorder, 'Table', function () {
    "use strict";

    var Collection = sntls.Collection,
        IndexCollection = jorder.IndexCollection,
        base = sntls.Collection;

    /**
     * @class jorder.Table
     * @extends sntls.Collection
     */
    jorder.Table = base.extend()
        .addMethods(/** @lends jorder.Table */{
            /**
             * @name jorder.Table.create
             * @return {jorder.Table}
             */

            /**
             * @param {object[]} json
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
             * Fetches table rows that match specified row and wraps them in a hash.
             * @param {object} row Table row or relevant fields w/ value
             * @return {sntls.Hash}
             */
            queryByRowAsHash: function (row) {
                var index = this.indexCollection.getBestIndexForRow(row);

                dessert.assert(!!index, "No index matches row");

                return index
                    // obtaining matching row IDs
                    .getRowIdsForKeys(index.rowSignature.getKeysForRow(row))
                    // joining actual rows that match
                    .toStringDictionary()
                    .combineWith(this.toDictionary());
            },

            /**
             * Fetches table rows that match specified row.
             * @param {object} row Table row or relevant field w/ value
             * @return {Array}
             */
            queryByRow: function (row) {
                return this.queryByRowAsHash(row).items;
            },

            /**
             * Inserts row into table, updating all relevant indexes
             * @param {object} row Table row
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
             * Removes rows from the table that match the specified row.
             * @param {object} row Table row or relevant fields w/ value
             * @return {jorder.Table}
             */
            deleteRowsByRow: function (row) {
                // getting an index for the row
                var index = this.indexCollection.getBestIndexForRow(row);

                dessert.assert(!!index, "No index matches row");

                index
                    // obtaining matching row IDs
                    .getRowIdsForKeys(index.rowSignature.getKeysForRow(row))
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
         * @return {jorder.Table}
         */
        toTable: function () {
            return jorder.Table.create(this.items);
        }
    });
}());


