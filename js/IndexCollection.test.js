/*global module, test, expect, ok, raises, equal, strictEqual, deepEqual */
/*global sntls, jorder */
(function () {
    "use strict";

    module("Index Collection");

    test("Index containment", function () {
        expect(2);

        var myRow = {},
            index = jorder.Index.create(['foo', 'bar']);

        jorder.RowSignature.addMock({
            containedByRow: function (row) {
                strictEqual(row, myRow, "Row passed");
                strictEqual(this, index.rowSignature, "Index matches");
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
            "Index signature field count"
        );
    });

    test("DESC Numeric comparator", function () {
        equal(jorder.IndexCollection._descNumericComparator(1, 2), 1, "First is lower");
        equal(jorder.IndexCollection._descNumericComparator(3, 2), -1, "First is higher");
        equal(jorder.IndexCollection._descNumericComparator(3, 3), 0, "Equal");
    });

    test("Index addition", function () {
        var index = jorder.Index.create(['foo', 'bar']),
            indexCollection = jorder.IndexCollection.create();

        indexCollection.setItem(index);

        deepEqual(
            indexCollection.items,
            {
                'foo|bar%string': index
            },
            "Index added to collection"
        );
    });

    test("Exact index lookup by field names", function () {
        var index1 = jorder.Index.create(['foo', 'bar']),
            index2 = jorder.Index.create(['field1', 'field2']),
            indexCollection = jorder.IndexCollection.create();

        indexCollection
            .setItem(index1)
            .setItem(index2);

        equal(typeof indexCollection.getIndexForFields(['foo']), 'undefined', "No matching index");

        strictEqual(
            indexCollection.getIndexForFields(['foo', 'bar']),
            index1,
            "Index retrieved"
        );
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

        ok(result.isA(jorder.IndexCollection), "Return type IndexCollection");
        deepEqual(
            result.getKeys().sort(),
            ['foo%string', 'foo|bar%string'],
            "Only fully matching indexes returned"
        );
    });

    test("Fetching index for row", function () {
        var indexCollection = jorder.IndexCollection.create()
                .setItem(jorder.Index.create(['foo', 'bar']))
                .setItem(jorder.Index.create(['foo']))
                .setItem(jorder.Index.create(['foo', 'baz']))
                .setItem(jorder.Index.create(['foo', 'moo'])),
            result;

        // could yield any of the first 3 indexes
        result = indexCollection.getIndexForRow({foo: 'hello', bar: 'world', baz: '!!!'});

        ok(result.isA(jorder.Index), "Return type Index");
        ok(
            result.rowSignature.fieldSignature === 'foo|bar%string' ||
            result.rowSignature.fieldSignature === 'foo%string' ||
            result.rowSignature.fieldSignature === 'foo|baz%string',
            "Result index signature"
        );
    });

    test("Fetching best index for row", function () {
        var indexCollection = jorder.IndexCollection.create()
                .setItem(jorder.Index.create(['foo', 'bar']))
                .setItem(jorder.Index.create(['foo']))
                .setItem(jorder.Index.create(['foo', 'bar', 'baz'])),
            result;

        result = indexCollection.getBestIndexForRow({hello: 'world'});

        equal(typeof result, 'undefined', "No fitting index");

        // yields the one with the most matching fields
        result = indexCollection.getBestIndexForRow({foo: 'hello', bar: 'world', baz: '!!!'});

        ok(result.isA(jorder.Index), "Return type");
        equal(result.rowSignature.fieldSignature, 'foo|bar|baz%string', "Result index signature");

        result = indexCollection.getBestIndexForRow({foo: 'hello', bar: 'world'});
        equal(result.rowSignature.fieldSignature, 'foo|bar%string', "Result index signature");
    });

    test("Row addition", function () {
        var index1 = jorder.Index.create(['foo', 'bar']),
            index2 = jorder.Index.create(['foo', 'moo']),
            indexCollection = jorder.IndexCollection.create()
                .setItem(index1)
                .setItem(index2);

        indexCollection.addRow({foo: 'hello', bar: 'world', moo: 'cow'}, 0);

        deepEqual(
            index1.rowIdLookup.items,
            {
                'hello|world': 0
            },
            "First lookup index"
        );

        deepEqual(
            index2.rowIdLookup.items,
            {
                'hello|cow': 0
            },
            "Second lookup index"
        );

        raises(function () {
            indexCollection.addRow({foo: 'hello', bar: 'world'}, 1);
        }, "Row doesn't fit all indexes");
    });
}());
