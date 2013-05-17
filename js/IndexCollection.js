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
