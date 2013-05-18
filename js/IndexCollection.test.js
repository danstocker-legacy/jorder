/*global module, test, ok, raises, equal, strictEqual, deepEqual */
/*global sntls, jorder */
(function () {
    "use strict";

    module("Index Collection");

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

    test("Index lookup", function () {
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

    test("Fetching index for row", function () {
        var indexCollection = jorder.IndexCollection.create()
                .setItem(jorder.Index.create(['foo', 'bar']))
                .setItem(jorder.Index.create(['foo']))
                .setItem(jorder.Index.create(['foo', 'baz']))
                .setItem(jorder.Index.create(['foo', 'moo'])),
            result;

        // could yield any of the first 3 indexes
        result = indexCollection.getIndexForRow({foo: 'hello', bar: 'world', baz: '!!!'});

        ok(result.isA(jorder.Index), "Return type");
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

        // yields the one with the most matching fields
        result = indexCollection.getBestIndexForRow({foo: 'hello', bar: 'world', baz: '!!!'});

        ok(result.isA(jorder.Index), "Return type");
        equal(result.rowSignature.fieldSignature, 'foo|bar|baz%string', "Result index signature");
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
