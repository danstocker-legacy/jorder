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
                this.indexCollection.setItem(jorder.Index.create(fieldNames, signatureType));
                return this;
            },

            /**
             * Fetches an index from the table's index pool.
             * @return {jorder.Index}
             */
            getIndex: function (fieldNames, signatureType) {
                return this.indexCollection.getIndexForFields(fieldNames, signatureType);
            },

            /**
             * Re-indexes table by rebuilding all indexes associated with table.
             * @return {jorder.Table}
             */
            reIndex: function () {
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


