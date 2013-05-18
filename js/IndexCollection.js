/**
 * Collection of Indexes
 */
/*global dessert, troop, sntls, jorder */
troop.promise(jorder, 'IndexCollection', function () {
    "use strict";

    var base = sntls.Collection;

    /**
     * @class jorder.IndexCollection
     * @extends sntls.Collection
     * @extends jorder.Index
     */
    jorder.IndexCollection = sntls.Collection.of(jorder.Index)
        .addMethod({
            /**
             * @name jorder.IndexCollection.create
             * @return {jorder.IndexCollection}
             */

            /**
             * Sets an index in the collection.
             * Item key is calculated based index signature.
             * @param {jorder.Index} index
             * @return {jorder.IndexCollection}
             */
            setItem: function (index) {
                dessert.isIndex(index, "Invalid index");

                base.setItem.call(this, index.rowSignature.fieldSignature, index);

                return this;
            },

            /**
             * Retrieves the first index matching the specified row.
             * @param {object} row
             * @return {jorder.Index}
             */
            getIndexForRow: function (row) {
                return this
                    // keeping indexes that match row
                    .filterByExpr(function (/**jorder.Index*/index) {
                        return index.rowSignature.containedByRow(row);
                    })
                    // picking first we can find
                    .getValues()[0];
            },

            /**
             * Retrieves the index best matching the specified row
             * @param {object} row
             * @return {jorder.Index}
             */
            getBestIndexForRow: function (row) {
                return this
                    // keeping indexes that match row
                    .filterByExpr(function (/**jorder.Index*/index) {
                        return index.rowSignature.containedByRow(row);
                    })
                    // getting number of matching fields for each
                    .mapContents(function (/**jorder.Index*/index) {
                        return index.rowSignature.fieldNames.length;
                    })
                    // flipping to field count -> index ID
                    .toStringDictionary()
                    .reverse()
                    // assigning indexes to field counts
                    .combineWith(this.toDictionary())
                    // picking index with highest field count
                    .toCollection()
                    .getSortedValues(function (a, b) {
                        return a < b ? 1 : a > b ? -1 : 0;
                    })[0];
            },

            /**
             * Retrieves an index matching the specified fields
             * @param {string[]} fieldNames
             * @param {string} [signatureType]
             * @return {jorder.Index}
             */
            getIndexForFields: function (fieldNames, signatureType) {
                var rowSignature = jorder.RowSignature.create(fieldNames, signatureType);
                return this.getItem(rowSignature.fieldSignature);
            }
        });
});
