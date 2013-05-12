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
                'foo|bar': index
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
}());
