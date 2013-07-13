/*global dessert, troop, sntls, jorder */
troop.postpone(jorder, 'MultiArray', function () {
    "use strict";

    var base = sntls.Hash;

    /**
     * Instantiates class.
     * @name jorder.MultiArray.create
     * @function
     * @param {Array[]} items Array of arrays
     * @return {jorder.MultiArray}
     */

    /**
     * An array that for each of its items holds an even distribution
     * of possible values (represented as arrays).
     * @class jorder.MultiArray
     * @extends sntls.Hash
     * @example
     * [[1, 2], [3], [4, 5]]
     */
    jorder.MultiArray = base.extend()
        .addPrivateMethods(/** @lends jorder.MultiArray */{
            /**
             * Measures the number of possibilities for each item
             * and returns the counts in an array
             * @return {Array}
             * @private
             */
            _getItemLengths: function () {
                var items = this.items,
                    result = [],
                    i;

                for (i = 0; i < items.length; i++) {
                    result.push(items[i].length);
                }

                return result;
            }
        })
        .addMethods(/** @lends jorder.MultiArray# */{
            /**
             * @param {Array[]} items Array of arrays
             * @ignore
             */
            init: function (items) {
                dessert.isArray(items, "Invalid items");

                base.init.apply(this, arguments);
            },

            /**
             * Fetches one specific combination according to the specified indices.
             * @param {number[]} indices Pin-point values for each item to fetch.
             */
            selectCombination: function (indices) {
                dessert
                    .isArray(indices, "Invalid indices")
                    .assert(this.items.length === indices.length, "Indices length doesn't match list length");

                var items = this.items,
                    result = [],
                    i;

                for (i = 0; i < items.length; i++) {
                    result.push(items[i][indices[i]]);
                }

                return result;
            },

            /**
             * Retrieves all possible combinations for the array
             * @return {Array[]} Array of all possible outcomes
             */
            getCombinations: function () {
                var result = [],
                    itemLengths = this._getItemLengths(),
                    itemPosition;

                for (itemPosition = jorder.IrregularNumber.create(itemLengths);
                     itemPosition.asScalar <= itemPosition.maxValue;
                     itemPosition.inc()
                    ) {
                    result.push(this.selectCombination(itemPosition.asDigits));
                }

                return result;
            },

            /**
             * Retrieves all combinations wrapped in a hash object
             * @return {sntls.Hash}
             */
            getCombinationsAsHash: function () {
                return sntls.Hash.create(this.getCombinations());
            }
        });
});

(function () {
    "use strict";

    sntls.Hash.addMethods(/** @lends sntls.Hash */{
        /**
         * @return {jorder.MultiArray}
         */
        toMultiArray: function () {
            return jorder.MultiArray.create(this.items);
        }
    });
}());
