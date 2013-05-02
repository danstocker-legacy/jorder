/**
 * Irregular Number
 *
 * Number represented in an irregular number system,
 * where each digit might have a different radix.
 */
/*global dessert, troop, sntls, jorder */
troop.promise(jorder, 'IrregularNumber', function () {
    "use strict";

    /**
     * @class jorder.IrregularNumber
     * @extends troop.Base
     */
    jorder.IrregularNumber = troop.Base.extend()
        .addPrivateMethod(/** @lends jorder.IrregularNumber */{
            /**
             * Calculates the maximum value possible in this number system
             * @return {Number}
             * @private
             */
            _getMaxValue: function () {
                var radices = this.radices,
                    result = 1,
                    i;

                for (i = 0; i < radices.length; i++) {
                    result *= radices[i];
                }

                return result - 1;
            },

            /**
             * Calculates cumulative product of radices
             * @return {Array}
             * @private
             */
            _getRadixProducts: function () {
                var radices = this.radices,
                    product = 1,
                    result = [],
                    i;

                for (i = radices.length; --i;) {
                    result.unshift(product *= radices[i]);
                }

                return result;
            },

            /**
             * Converts scalar value to digits according to radices
             * @param {number} value
             * @return {number[]}
             * @private
             */
            _convertToDigits: function (value) {
                var radixProducts = this._radixProducts,
                    result = [],
                    i;

                for (i = 0; i < radixProducts.length; i++) {
                    result.push(Math.floor(value / radixProducts[i]));
                    value = value % radixProducts[i];
                }
                result.push(value);

                return result;
            }
        })
        .addMethod(/** @lends jorder.IrregularNumber */{
            /**
             * @name jorder.IrregularNumber.create
             * @return {jorder.IrregularNumber}
             */

            /**
             * Initializes number with custom radix
             * @param {number[]} radices
             */
            init: function (radices) {
                dessert.isArray(radices, "Invalid radices");

                /**
                 * Radix for each digit
                 * @type {Number[]}
                 */
                this.radices = radices;

                /**
                 * Cumulative products of radices (from right to left)
                 * @type {number[]}
                 * @private
                 */
                this._radixProducts = this._getRadixProducts();

                /**
                 * Maximum assignable value
                 * @type {Number}
                 */
                this.maxValue = this._getMaxValue();

                /**
                 * Current value as scalar
                 * @type {Number}
                 */
                this.asScalar = 0;

                /**
                 * Current value as series of digits
                 * @type {number[]}
                 */
                this.asDigits = this._convertToDigits(0);
            },

            /**
             * Sets value on irregular number
             * @param {number} value
             * @return {jorder.IrregularNumber}
             */
            setValue: function (value) {
                dessert.assert(value <= this.maxValue, "Value out of bounds");

                // assigning scalar value
                this.asScalar = value;

                // assigning digits
                this.asDigits = this._convertToDigits(value);

                return this;
            },

            /**
             * Increments current value
             * @return {jorder.IrregularNumber}
             */
            inc: function () {
                var digits,
                    radices,
                    i;

                if (this.asScalar < this.maxValue) {
                    digits = this.asDigits;
                    radices = this.radices;

                    // incrementing digit representation
                    for (i = radices.length - 1; digits[i] === radices[i] - 1; i--) {
                        digits[i] = 0;
                    }
                    digits[i]++;

                    // incrementing scalar representation
                    this.asScalar++;
                }

                return this;
            }
        });
});
