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


