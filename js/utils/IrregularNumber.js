/*global dessert, troop, sntls, jorder */
troop.postpone(jorder, 'IrregularNumber', function () {
    "use strict";

    /**
     * Instantiates class.
     * @name jorder.IrregularNumber.create
     * @function
     * @param {number[]} radices
     * @return {jorder.IrregularNumber}
     */

    /**
     * Irregular Number. Number represented in an irregular number system, where each digit
     * might have a different radix.
     * @class jorder.IrregularNumber
     * @extends troop.Base
     */
    jorder.IrregularNumber = troop.Base.extend()
        .addPrivateMethods(/** @lends jorder.IrregularNumber */{
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
             * @param {number} scalar
             * @return {number[]}
             * @private
             */
            _convertToDigits: function (scalar) {
                var radixProducts = this._radixProducts,
                    result = [],
                    i;

                for (i = 0; i < radixProducts.length; i++) {
                    result.push(Math.floor(scalar / radixProducts[i]));
                    scalar = scalar % radixProducts[i];
                }
                result.push(scalar);

                return result;
            },

            /**
             * Converts scalar value to digits according to radices
             * @param {number[]} digits
             * @return {number}
             * @private
             */
            _convertToScalar: function (digits) {
                var radixProducts = this._radixProducts,
                    result = 0,
                    i, j;

                for (i = digits.length, j = radixProducts.length; i--; j--) {
                    result += digits[i] * (radixProducts[j] || 1);
                }

                return result;
            }
        })
        .addMethods(/** @lends jorder.IrregularNumber# */{
            /**
             * @param {number[]} radices Array of custom radices for each item.
             * @ignore
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
             * Sets scalar value on irregular number
             * @param {number} value
             * @return {jorder.IrregularNumber}
             */
            setScalar: function (value) {
                dessert.assert(value <= this.maxValue, "Value out of bounds");

                // assigning scalar value
                this.asScalar = value;

                // assigning digits
                this.asDigits = this._convertToDigits(value);

                return this;
            },

            /**
             * Sets irregular number digits
             * @param {number[]} digits
             * @return {jorder.IrregularNumber}
             */
            setDigits: function (digits) {
                var radices = this.radices,
                    asDigits,
                    i, j;

                dessert
                    .isArray(digits, "Invalid digits")
                    .assert(digits.length <= radices.length, "Too many digits");

                // assigning digits
                asDigits = this.asDigits;
                for (i = radices.length, j = digits.length - 1; i--; j--) {
                    asDigits[i] = digits[j] || 0;
                }

                // assigning scalar value
                this.asScalar = this._convertToScalar(digits);

                return this;
            },

            /**
             * Increments current value
             * @return {jorder.IrregularNumber}
             */
            inc: function () {
                var digits = this.asDigits,
                    radices = this.radices,
                    i;

                // incrementing digit representation
                for (i = radices.length - 1;
                     digits[i] === radices[i] - 1;
                     i--
                    ) {
                    digits[i] = 0;
                }
                if (i >= 0) {
                    digits[i]++;
                }

                // incrementing scalar representation
                this.asScalar++;

                return this;
            }
        });
});
