/**
 * Datastore Table
 */
/*global dessert, troop, sntls, jorder */
troop.promise(jorder, 'Table', function () {
    "use strict";

    var Collection = sntls.Collection,
        IndexCollection = jorder.IndexCollection,
        base = sntls.Hash;

    /**
     * @class jorder.Table
     * @extends sntls.Hash
     */
    jorder.Table = base.extend()
        .addMethod({
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

                /**
                 * Table rows
                 * @type {sntls.Collection}
                 */
                this.rowCollection = Collection.create(this.items);
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
                this.rowCollection
                    .forEachItem(index.addRow.bind(index));

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
                this.rowCollection
                    .forEachItem(indexCollection.addRow.bind(indexCollection));

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
                    .forEachItem(Collection.deleteItem.bind(this.rowCollection));

                return this;
            },

            /**
             * Clears rows and associated indexes.
             * @return {jorder.Table}
             */
            clear: function () {
                // clearing indexes
                this.indexCollection.clear();

                // clearing rows
                this.rowCollection.clear();

                // keeping hash and row collection item buffer in sync
                this.items = this.rowCollection.items;

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

    sntls.Hash.addMethod(/** @lends sntls.Hash */{
        /**
         * @return {jorder.Table}
         */
        toTable: function () {
            return jorder.Table.create(this.items);
        }
    });
}());


