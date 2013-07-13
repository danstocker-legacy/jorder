/*global module, test, expect, ok, raises, equal, strictEqual, deepEqual */
/*global sntls, jorder */
(function () {
    "use strict";

    module("Index");

    test("Instantiation", function () {
        var index = jorder.Index.create(['foo', 'bar'], 'number');

        ok(index.rowSignature.isA(jorder.RowSignature), "Row signature");
        ok(index.rowIdLookup.isA(sntls.Dictionary), "Index lookup");
        ok(index.sortedKeys.isA(sntls.OrderedList), "Index order");
    });

    test("Row addition", function () {
        var index = jorder.Index.create(['foo', 'bar']);

        raises(function () {
            index.addRow({invalid: 1}, 0);
        }, "Row doesn't match signature");

        index.addRow({foo: 5, bar: 7}, 0);

        deepEqual(
            index.rowIdLookup.items,
            {
                '5|7': 0
            },
            "Lookup after first row"
        );

        deepEqual(
            index.sortedKeys.items,
            ['5|7'],
            "Order after first row"
        );
    });

    test("Index population", function () {
        var index = jorder.Index.create(['foo', 'bar'])
            .addRow({foo: 5, bar: 7}, 0)
            .addRow({foo: 3, bar: 2}, 1)
            .addRow({foo: 4, bar: 1}, 2)
            .addRow({foo: 3, bar: 2}, 3)
            .addRow({foo: 3, bar: 3}, 4)
            .addRow({foo: 5, bar: 7}, 5)
            .addRow({foo: 5, bar: 1}, 6)
            .addRow({foo: 1, bar: 7}, 7)
            .addRow({foo: 1, bar: 1}, 8)
            .addRow({foo: 1, bar: 1}, 9);

        deepEqual(
            index.rowIdLookup.items,
            {
                '5|7': [0, 5],
                '3|2': [1, 3],
                '4|1': 2,
                '3|3': 4,
                '5|1': 6,
                '1|7': 7,
                '1|1': [8, 9]
            },
            "Populated lookup index"
        );

        deepEqual(
            index.sortedKeys.items,
            [
                '5|7',
                '3|2',
                '4|1',
                '3|2',
                '3|3',
                '5|7',
                '5|1',
                '1|7',
                '1|1',
                '1|1'
            ].sort(),
            "Populated order index"
        );
    });

    test("Clearing", function () {
        expect(2);

        var index = jorder.Index.create(['foo'], 'number')
            .addRow({foo: 5}, 0)
            .addRow({foo: 3}, 1)
            .addRow({foo: 4}, 2)
            .addRow({foo: 3}, 3)
            .addRow({foo: 3}, 4)
            .addRow({foo: 5}, 5)
            .addRow({foo: 5}, 6)
            .addRow({foo: 1}, 7)
            .addRow({foo: 1}, 8)
            .addRow({foo: 1}, 9);

        index.rowIdLookup.addMocks({
            clear: function () {
                ok("Row ID lookup cleared");
            }
        });

        index.sortedKeys.addMocks({
            clear: function () {
                ok("Row ID lookup cleared");
            }
        });

        index.clearBuffers();
    });

    test('Lookup', function () {
        var index = jorder.Index.create(['foo'], 'number')
            .addRow({foo: 5}, 0)
            .addRow({foo: 3}, 1)
            .addRow({foo: 4}, 2)
            .addRow({foo: 3}, 3)
            .addRow({foo: 3}, 4)
            .addRow({foo: 5}, 5)
            .addRow({foo: 5}, 6)
            .addRow({foo: 1}, 7)
            .addRow({foo: 1}, 8)
            .addRow({foo: 1}, 9);

        deepEqual(
            index.getRowIdsForKeysAsHash(['3', '4']).items.sort(),
            ['1', '2', '3', '4'],
            "Row IDs for index keys 3 and 4"
        );

        deepEqual(
            index.getRowIdsForKeys(['3', '4']).sort(),
            ['1', '2', '3', '4'],
            "Row IDs for index keys 3 and 4"
        );
    });

    test("Unique row IDs", function () {
        var index = jorder.Index.create(['foo'], 'number')
                .addRow({foo: 5}, 0)
                .addRow({foo: 3}, 1)
                .addRow({foo: 4}, 2)
                .addRow({foo: 3}, 3)
                .addRow({foo: 3}, 4)
                .addRow({foo: 5}, 5)
                .addRow({foo: 5}, 6)
                .addRow({foo: 1}, 7)
                .addRow({foo: 1}, 8)
                .addRow({foo: 1}, 9),
            range,
            rowIds;

        range = index.sortedKeys.getRangeAsHash(3, 5);
        deepEqual(range.items, [3, 3, 3, 4], "Initial keys");
        rowIds = index._getUniqueRowIdsForKeys(range);
        deepEqual(rowIds.sort(), ['1', '2', '3', '4'], "Unique Row Ids");

        range = index.sortedKeys.getRangeAsHash(1, 4);
        deepEqual(range.items, [1, 1, 1, 3, 3, 3], "Initial keys");
        rowIds = index._getUniqueRowIdsForKeys(range);
        deepEqual(rowIds.sort(), ['1', '3', '4', '7', '8', '9'], "Unique Row Ids");
    });

    test("Range retrieval", function () {
        var index = jorder.Index.create(['foo'], 'number')
            .addRow({foo: 5}, 0)
            .addRow({foo: 3}, 1)
            .addRow({foo: 4}, 2)
            .addRow({foo: 3}, 3)
            .addRow({foo: 3}, 4)
            .addRow({foo: 5}, 5)
            .addRow({foo: 5}, 6)
            .addRow({foo: 1}, 7)
            .addRow({foo: 1}, 8)
            .addRow({foo: 1}, 9);

        deepEqual(
            index.getRowIdsForKeyRangeAsHash(3, 4).items.sort(),
            ['1', '3', '4'],
            "Row IDs between index key 3 and 4 (excl.)"
        );

        deepEqual(
            index.getRowIdsForKeyRange(3, 4).sort(),
            ['1', '3', '4'],
            "Row IDs between index key 3 and 4 (excl.)"
        );

        deepEqual(
            index.getRowIdsForKeyRangeAsHash(4, 6).items.sort(),
            ['0', '2', '5', '6'],
            "Row IDs between index key 4 and 6 (excl.)"
        );

        deepEqual(
            index.getRowIdsForKeyRange(4, 6).sort(),
            ['0', '2', '5', '6'],
            "Row IDs between index key 4 and 6 (excl.)"
        );
    });
}());
