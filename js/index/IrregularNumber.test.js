/*global module, test, raises, equal, strictEqual, deepEqual */
/*global jorder */
(function () {
    "use strict";

    module("IrregularNumber");

    test("Instantiation", function () {
        raises(function () {
            jorder.IrregularNumber.create('foo');
        }, "Invalid radices");

        var num = jorder.IrregularNumber.create([3, 3, 4]);

        deepEqual(num.radices, [3, 3, 4], "Radices");
        equal(num.asScalar, 0, "Initial value");
    });

    test("Max value detection", function () {
        var num = jorder.IrregularNumber.create([3, 3, 4]);

        equal(num._getMaxValue(), 35, "Max value irregular number may take");
    });

    test("Radix products", function () {
        var num = jorder.IrregularNumber.create([3, 3, 4]);

        deepEqual(num._getRadixProducts(), [12, 4]);
    });

    test("Digital decomposition", function () {
        var num = jorder.IrregularNumber.create([3, 3, 4]);

        deepEqual(num._convertToDigits(19), [1, 1, 3], "Number 19");
    });

    test("Normalizing", function () {
        var num = jorder.IrregularNumber.create([3, 3, 4]);

        equal(num._convertToScalar([1, 1, 3]), 19, "Number 19");
        equal(num._convertToScalar([1, 3]), 7, "Number 7");
        equal(num._convertToScalar([3]), 3, "Number 3");
    });

    test("Value assignment", function () {
        var num = jorder.IrregularNumber.create([3, 3, 4]),
            result;

        result = num.setValue(15);

        strictEqual(result, num, "Setting value returns self");
        equal(num.asScalar, 15, "Scalar value set");
        deepEqual(num.asDigits, [1, 0, 3], "Digits set");
    });

    test("Digit assignment", function () {
        var num = jorder.IrregularNumber.create([3, 3, 4]),
            result;

        result = num.setDigits([1, 1, 3]);

        strictEqual(result, num, "Setting digits returns self");
        deepEqual(num.asDigits, [1, 1, 3], "Digits set");
        equal(num.asScalar, 19, "Scalar value set");

        num.setDigits([1, 2]);
        deepEqual(num.asDigits, [0, 1, 2], "Digits set");
        equal(num.asScalar, 6, "Scalar value set");
    });

    test("Incrementing", function () {
        var num = jorder.IrregularNumber.create([3, 3, 4]);

        num
            .setValue(5)// [0, 1, 1]
            .inc();

        equal(num.asScalar, 6, "Scalar incremented");
        deepEqual(num.asDigits, [0, 1, 2], "Digits incremented");

        num
            .setValue(15)// [1, 0, 3]
            .inc();

        deepEqual(num.asDigits, [1, 1, 0], "Single digit shift");

        num
            .setValue(11)// [0, 2, 3]
            .inc();

        deepEqual(num.asDigits, [1, 0, 0], "Multi digit shift");

        num
            .setValue(23)// [1, 2, 3]
            .inc();

        deepEqual(num.asDigits, [2, 0, 0], "Multi digit shift");

        num
            .setValue(35)// [2, 2, 3]
            .inc();

        deepEqual(num.asDigits, [0, 0, 0], "Overflow resets digit representation");
    });
}());