/*global module, test, ok, raises, equal, strictEqual, deepEqual */
/*global sntls, jorder */
(function () {
    "use strict";

    module("MultiArray");

    test("Instantiation", function () {
        raises(function () {
            jorder.MultiArray.create('foo');
        }, "Invalid items");

        var arr = [
                [1, 2],
                [3],
                [4, 5]
            ],
            list = jorder.MultiArray.create(arr);

        strictEqual(list.items, arr, "Item buffer added");
    });

    test("Type conversion", function () {
        var hash = sntls.Hash.create([
                [1, 2],
                [3],
                [4, 5]
            ]),
            multiArray = hash.toMultiArray();

        ok(multiArray.isA(jorder.MultiArray), "Hash converted to prob. array");
    });

    test("Item length measurement", function () {
        var list = jorder.MultiArray.create([
            [1, 2],
            [3],
            [4, 5]
        ]);

        deepEqual(list._getItemLengths(), [2, 1, 2], "Item lengths");
    });

    test("Selection", function () {
        var list = jorder.MultiArray.create([
            [1, 2],
            [3],
            [4, 5]
        ]);

        deepEqual(list.selectCombination([1, 0, 0]), [2, 3, 4], "Selected combination");
    });

    test("Combination", function () {
        var list = jorder.MultiArray.create([
            [1, 2],
            [3],
            [4, 5]
        ]);

        deepEqual(
            list.getCombinations(),
            [
                [1, 3, 4],
                [1, 3, 5],
                [2, 3, 4],
                [2, 3, 5]
            ],
            "All available combinations"
        );
    });
}());