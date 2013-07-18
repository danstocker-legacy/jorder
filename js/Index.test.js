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

    test('Case sensitive lookup', function () {
        var index = jorder.Index.create(['foo'], 'string')
            .addRow({foo: "e"}, 0)
            .addRow({foo: "C"}, 1)
            .addRow({foo: "D"}, 2)
            .addRow({foo: "c"}, 3)
            .addRow({foo: "c"}, 4)
            .addRow({foo: "e"}, 5)
            .addRow({foo: "E"}, 6)
            .addRow({foo: "A"}, 7)
            .addRow({foo: "a"}, 8)
            .addRow({foo: "A"}, 9);

        deepEqual(
            index.getRowIdsForKeys(['c', 'd']).sort(),
            ['3', '4'],
            "Row IDs for index keys 'c' and 'd'"
        );
    });

    test('Case insensitive lookup', function () {
        var index = jorder.Index.create(['foo'], 'string', true)
            .addRow({foo: "e"}, 0)
            .addRow({foo: "C"}, 1)
            .addRow({foo: "D"}, 2)
            .addRow({foo: "c"}, 3)
            .addRow({foo: "c"}, 4)
            .addRow({foo: "e"}, 5)
            .addRow({foo: "E"}, 6)
            .addRow({foo: "A"}, 7)
            .addRow({foo: "a"}, 8)
            .addRow({foo: "A"}, 9);

        deepEqual(
            index.getRowIdsForKeys(['c', 'd']).sort(),
            ['1', '2', '3', '4'],
            "Row IDs for index keys 'c' and 'd'"
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

    test("Case sensitive unique row IDs", function () {
        var index = jorder.Index.create(['foo'], 'string')
                .addRow({foo: "e"}, 0)
                .addRow({foo: "C"}, 1)
                .addRow({foo: "D"}, 2)
                .addRow({foo: "c"}, 3)
                .addRow({foo: "c"}, 4)
                .addRow({foo: "e"}, 5)
                .addRow({foo: "E"}, 6)
                .addRow({foo: "A"}, 7)
                .addRow({foo: "a"}, 8)
                .addRow({foo: "A"}, 9),
            range,
            rowIds;

        range = index.sortedKeys.getRangeAsHash('c', 'e');
        deepEqual(range.items, ['c', 'c'], "Initial keys");
        rowIds = index._getUniqueRowIdsForKeys(range);
        deepEqual(rowIds.sort(), ['3', '4'], "Unique Row Ids");

        range = index.sortedKeys.getRangeAsHash('a', 'd');
        deepEqual(range.items, ['a', 'c', 'c'], "Initial keys");
        rowIds = index._getUniqueRowIdsForKeys(range);
        deepEqual(rowIds.sort(), ['3', '4', '8'], "Unique Row Ids");
    });

    test("Case insensitive unique row IDs", function () {
        var index = jorder.Index.create(['foo'], 'string', true)
                .addRow({foo: "e"}, 0)
                .addRow({foo: "C"}, 1)
                .addRow({foo: "D"}, 2)
                .addRow({foo: "c"}, 3)
                .addRow({foo: "c"}, 4)
                .addRow({foo: "e"}, 5)
                .addRow({foo: "E"}, 6)
                .addRow({foo: "A"}, 7)
                .addRow({foo: "a"}, 8)
                .addRow({foo: "A"}, 9),
            range,
            rowIds;

        range = index.sortedKeys.getRangeAsHash('c', 'e');
        deepEqual(range.items, ['c', 'c', 'c', 'd'], "Initial keys");
        rowIds = index._getUniqueRowIdsForKeys(range);
        deepEqual(rowIds.sort(), ['1', '2', '3', '4'], "Unique Row Ids");

        range = index.sortedKeys.getRangeAsHash('a', 'd');
        deepEqual(range.items, ['a', 'a', 'a', 'c', 'c', 'c'], "Initial keys");
        rowIds = index._getUniqueRowIdsForKeys(range);
        deepEqual(rowIds.sort(), ['1', '3', '4', '7', '8', '9'], "Unique Row Ids");
    });

    test("Row ID retrieval by range", function () {
        expect(6);

        var index = jorder.Index.create(['foo'], 'number'),
            foo = sntls.Hash.create({}),
            result = [];

        index.sortedKeys.addMocks({
            getRangeAsHash: function (startValue, endValue, offset, limit) {
                equal(startValue, 'foo');
                equal(endValue, 'bar');
                equal(offset, 1);
                equal(limit, 2);
                return foo;
            }
        });

        index.addMocks({
            _getUniqueRowIdsForKeys: function (keysAsHash) {
                strictEqual(keysAsHash, foo);
                return result;
            }
        });

        strictEqual(index.getRowIdsForKeyRange('foo', 'bar', 1, 2), result, "Both functions called");
    });

    test("Row ID retrieval by range (case insensitive)", function () {
        expect(4);

        var index = jorder.Index.create(['foo'], 'string', true),
            foo = sntls.Hash.create({}),
            result = [];

        index.sortedKeys.addMocks({
            getRangeAsHash: function (startValue, endValue) {
                equal(startValue, 'foo');
                equal(endValue, 'bar');
                return foo;
            }
        });

        index.addMocks({
            _getUniqueRowIdsForKeys: function (keysAsHash) {
                strictEqual(keysAsHash, foo);
                return result;
            }
        });

        strictEqual(index.getRowIdsForKeyRange('FOO', 'BAR'), result, "Both functions called");
    });

    test("Row ID retrieval by prefix", function () {
        expect(6);

        var index = jorder.Index.create(['foo'], 'number'),
            foo = sntls.Hash.create({}),
            result = [];

        index.sortedKeys.addMocks({
            getRangeByPrefixAsHash: function (prefix, excludeOrig, offset, limit) {
                equal(prefix, 'foo');
                equal(excludeOrig, false);
                equal(offset, 1);
                equal(limit, 2);
                return foo;
            }
        });

        index.addMocks({
            _getUniqueRowIdsForKeys: function (keysAsHash) {
                strictEqual(keysAsHash, foo);
                return result;
            }
        });

        strictEqual(index.getRowIdsForPrefix('foo', 1, 2), result, "Both functions called");
    });

    test("Row ID retrieval by prefix (case insensitive)", function () {
        expect(3);

        var index = jorder.Index.create(['foo'], 'string', true),
            foo = sntls.Hash.create({}),
            result = [];

        index.sortedKeys.addMocks({
            getRangeByPrefixAsHash: function (prefix) {
                equal(prefix, 'foo');
                return foo;
            }
        });

        index.addMocks({
            _getUniqueRowIdsForKeys: function (keysAsHash) {
                strictEqual(keysAsHash, foo);
                return result;
            }
        });

        strictEqual(index.getRowIdsForPrefix('FOO'), result, "Both functions called");
    });
}());
