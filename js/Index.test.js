/*global module, test, expect, ok, raises, equal, strictEqual, deepEqual */
/*global sntls, jorder */
(function () {
    "use strict";

    module("Index");

    test("Instantiation", function () {
        var index = jorder.Index.create(['foo', 'bar'], 'number', false, 'descending');

        ok(index.rowSignature.isA(jorder.RowSignature), "should add rowSignature property");
        deepEqual(index.rowSignature.fieldNames, ['foo', 'bar'], "should set field names on row signature");
        equal(index.rowSignature.signatureType, 'number', "should set signature type on row signature");
        equal(index.rowSignature.isCaseInsensitive, false, "should set case sensitivity flag on row signature");
        ok(index.rowIdLookup.isA(sntls.Dictionary), "should add rowIdLookup property");
        ok(index.sortedKeys.isA(sntls.OrderedList), "should add sortedKeys property");
        equal(index.sortedKeys.orderType, 'descending', "should set order type on sortedKeys");
    });

    test("Row addition", function () {
        var index = jorder.Index.create(['foo', 'bar']);

        index.addRow({foo: 5, bar: 7}, 0);

        deepEqual(index.rowIdLookup.items, {
            '5|7': 0
        }, "should add signature to row ID lookup");

        deepEqual(index.sortedKeys.items,
            ['5|7'],
            "should add signature to sorted keys");
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

    test("Row removal", function () {
        var index = jorder.Index.create(['foo', 'bar'])
            .addRow({foo: 5, bar: 7}, 0)
            .addRow({foo: 3, bar: 2}, 1);

        strictEqual(index.removeRow({foo: 5, bar: 7}, 0), index, "should be chainable");

        deepEqual(index.rowIdLookup.items, {
            '3|2': 1
        }, "should remove signature from row ID lookup");

        deepEqual(index.sortedKeys.items, [
            '3|2'
        ].sort(), "should remove signature from sorted keys");
    });

    test("Failed row removal", function () {
        var index = jorder.Index.create(['foo', 'bar'])
            .addRow({foo: 5, bar: 7}, 0)
            .addRow({foo: 3, bar: 2}, 1);

        strictEqual(index.removeRow({foo: 5}, 0), index, "should be chainable");

        deepEqual(index.rowIdLookup.items, {
            '5|7': 0,
            '3|2': 1
        }, "should leave row ID lookup unchanged");

        deepEqual(index.sortedKeys.items, [
            '5|7',
            '3|2'
        ].sort(), "should leave sorted keys unchanged");
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

    test("Row ID retrieval by position", function () {
        expect(5);

        var index = jorder.Index.create(['foo'], 'number')
                .addRow({foo: 5}, 1)
                .addRow({foo: 3}, 2)
                .addRow({foo: 2}, 3)
                .addRow({foo: 1}, 4)
                .addRow({foo: 3}, 5)
                .addRow({foo: 4}, 6),
            combineResult = sntls.Dictionary.create({foo: 'bar'});

        sntls.StringDictionary.addMocks({
            combineWith: function (stringDictionary) {
                strictEqual(stringDictionary, index.rowIdLookup, "should join matching keys w/ row ID lookup");
                return combineResult;
            }
        });

        equal(index.getRowIdAt(1), 'bar', "should return first value in combined data");

        sntls.StringDictionary.removeMocks();

        deepEqual(index.getRowIdAt(1), 3, "should return correct row ID");
        deepEqual(index.getRowIdAt(2), [2, 5], "should return correct row ID list");
        deepEqual(index.getRowIdAt(3), [2, 5], "should return correct row ID list");
    });

    test("Row ID retrieval between positions", function () {
        expect(5);

        var index = jorder.Index.create(['foo'], 'number')
                .addRow({foo: 5}, 1)
                .addRow({foo: 3}, 2)
                .addRow({foo: 2}, 3)
                .addRow({foo: 1}, 4)
                .addRow({foo: 3}, 5)
                .addRow({foo: 4}, 6),
            combineResult = sntls.Dictionary.create({foo: 'bar'}),
            result;

        sntls.StringDictionary.addMocks({
            combineWith: function (stringDictionary) {
                deepEqual(this.items, [2, 3], "should join specified slice of sorted keys");
                strictEqual(stringDictionary, index.rowIdLookup, "should join with row ID lookup");
                return combineResult;
            }
        });

        result = index.getRowIdsBetweenAsHash(1, 3);
        ok(result.isA(sntls.Hash), "should return Hash instance");
        strictEqual(result, combineResult, "should return joined sorted keys joined with row ID lookup");

        sntls.StringDictionary.removeMocks();

        deepEqual(
            index.getRowIdsBetweenAsHash(1, 3).items,
            [3, [2, 5]],
            "should return correct row IDs");
    });

    test("Hash-less row ID retrieval between positions", function () {
        expect(3);

        var index = jorder.Index.create(['foo'], 'number'),
            hashBuffer = {},
            hash = sntls.Hash.create(hashBuffer);

        index.addMocks({
            getRowIdsBetweenAsHash: function (start, end) {
                equal(start, 1, "should pass start position to hash getter");
                equal(end, 100, "should pass end position to hash getter");
                return hash;
            }
        });

        strictEqual(
            index.getRowIdsBetween(1, 100),
            hashBuffer,
            "should return buffer of hash returned by hash getter");
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
