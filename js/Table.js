/**
 * Datastore Table
 */
/*global dessert, troop, sntls, jorder */
troop.promise(jorder, 'Table', function () {
    "use strict";

    var base = sntls.Hash;

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
                this.indexCollection = jorder.IndexCollection.create();
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
                this.toCollection()
                    .forEachItem(index.addRow.bind(index));

                return this;
            },

            /**
             * Re-indexes table by rebuilding all indexes associated with table.
             * TODO: might need performance improvement; perhaps iterate over indexes first, then rows
             * @return {jorder.Table}
             */
            reIndex: function () {
                var indexCollection = this.indexCollection;

                // clearing index buffer
                indexCollection.clearBuffers();

                // re-building each index
                this.toCollection()
                    .forEachItem(indexCollection.addRow.bind(indexCollection));

                return this;
            },

            /**
             * Inserts row into table, updating all relevant indexes
             * @param row
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
             * Clears table and associated indexes.
             * @return {jorder.Table}
             */
            clear: function () {
                // clearing table buffer
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

    sntls.Hash.addMethod(/** @lends sntls.Hash */{
        /**
         * @return {jorder.Table}
         */
        toTable: function () {
            return jorder.Table.create(this.items);
        }
    });
}());


