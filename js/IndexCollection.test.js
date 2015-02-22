/*global module, test, expect, ok, raises, equal, strictEqual, deepEqual */
/*global sntls, jorder */
(function () {
    "use strict";

    module("Index Collection");

    test("Index containment", function () {
        expect(2);

        var myRow = {},
            index = jorder.Index.create(['foo', 'bar']);

        jorder.RowSignature.addMocks({
            containedByRow: function (row) {
                strictEqual(this, index.rowSignature, "should check whether index is contained by row");
                strictEqual(row, myRow, "should pass row to containment checker");
            }
        });

        jorder.IndexCollection._isIndexContainedByRow(myRow, index);

        jorder.RowSignature.removeMocks();
    });

    test("Field count mapper", function () {
        var index = jorder.Index.create(['foo', 'bar']);

        equal(
            jorder.IndexCollection._indexFieldCountMapper(index),
            index.rowSignature.fieldNames.length,
            "should return number of fields involved in index");
    });

    test("DESC Numeric comparator", function () {
        equal(jorder.IndexCollection._descNumericComparator(1, 2), 1,
            "should return 1 when second argument is higher");
        equal(jorder.IndexCollection._descNumericComparator(3, 2), -1,
            "should return -1 when second argument is lower");
        equal(jorder.IndexCollection._descNumericComparator(3, 3), 0,
            "should return zero when arguments are equal");
    });

    test("Index addition", function () {
        var index = jorder.Index.create(['foo', 'bar']),
            indexCollection = jorder.IndexCollection.create();

        strictEqual(indexCollection.setItem(index), indexCollection, "should be chainable");

        deepEqual(indexCollection.items, {
            'foo|bar%string%ascending': index
        }, "should add index to items");
    });

    test("Index removal", function () {
        var index1 = jorder.Index.create(['foo', 'bar']),
            index2 = jorder.Index.create(['hello', 'world']),
            indexCollection = jorder.IndexCollection.create()
                .setItem(index1)
                .setItem(index2);

        strictEqual(indexCollection.deleteItem(index2), indexCollection, "should be chainable");

        deepEqual(indexCollection.items, {
            'foo|bar%string%ascending': index1
        }, "should remove index from items");
    });

    test("Exact index lookup by field names", function () {
        var index1 = jorder.Index.create(['foo', 'bar']),
            index2 = jorder.Index.create(['field1', 'field2']),
            indexCollection = jorder.IndexCollection.create()
                .setItem(index1)
                .setItem(index2);

        equal(typeof indexCollection.getIndexForFields(['foo']), 'undefined',
            "should return undefined when no matching index is found");

        strictEqual(
            indexCollection.getIndexForFields(['foo', 'bar']),
            index1,
            "should return matching index");
    });

    test("Fetching indexes matching a row", function () {
        var indexCollection = jorder.IndexCollection.create()
                .setItem(jorder.Index.create(['foo', 'bar']))
                .setItem(jorder.Index.create(['foo']))
                .setItem(jorder.Index.create(['foo', 'baz']))
                .setItem(jorder.Index.create(['foo', 'moo'])),
            result;

        // full match (ie. all index fields are present in row)
        result = indexCollection.getIndexesForRow({foo: 'hello', bar: 'world'});

        ok(result.isA(jorder.IndexCollection), "should return IndexCollection instance");
        deepEqual(
            result.getKeys().sort(),
            ['foo%string%ascending', 'foo|bar%string%ascending'],
            "should return only matching indexes");
    });

    test("Fetching single index for row", function () {
        var indexCollection = jorder.IndexCollection.create()
                .setItem(jorder.Index.create(['foo', 'bar']))
                .setItem(jorder.Index.create(['foo']))
                .setItem(jorder.Index.create(['foo', 'baz']))
                .setItem(jorder.Index.create(['foo', 'moo'])),
            result;

        // could yield any of the first 3 indexes
        result = indexCollection.getIndexForRow({foo: 'hello', bar: 'world', baz: '!!!'});

        ok(result.isA(jorder.Index), "should return Index instance");
        ok(
            result.rowSignature.fieldSignature === 'foo|bar%string' ||
            result.rowSignature.fieldSignature === 'foo%string' ||
            result.rowSignature.fieldSignature === 'foo|baz%string',
            "should return either of the matching indexes");
    });

    test("Fetching best index for row", function () {
        var indexCollection = jorder.IndexCollection.create()
                .setItem(jorder.Index.create(['foo', 'bar']))
                .setItem(jorder.Index.create(['foo']))
                .setItem(jorder.Index.create(['foo', 'bar', 'baz'])),
            result;

        result = indexCollection.getBestIndexForRow({hello: 'world'});

        equal(typeof result, 'undefined', "should return undefined for no matching index");

        // yields the one with the most matching fields
        result = indexCollection.getBestIndexForRow({foo: 'hello', bar: 'world', baz: '!!!'});

        ok(result.isA(jorder.Index), "should return Index instance");
        equal(result.rowSignature.fieldSignature, 'foo|bar|baz%string',
            "should return index with the right row signature");

        result = indexCollection.getBestIndexForRow({foo: 'hello', bar: 'world'});
        equal(result.rowSignature.fieldSignature, 'foo|bar%string',
            "should return index with the right row signature");
    });

    test("Fetching best index for multiple fields", function () {
        expect(2);

        var indexCollection = jorder.IndexCollection.create(),
            bestIndex = {};

        indexCollection.addMocks({
            getBestIndexForRow: function (row) {
                deepEqual(row, {foo: '0', 'bar': '1', baz: '2'},
                    "should pass dummy row to index-by-row getter");
                return bestIndex;
            }
        });

        strictEqual(
            indexCollection.getBestIndexForFields(['foo', 'bar', 'baz']),
            bestIndex,
            "should return index returned by by-row getter");
    });
}());
