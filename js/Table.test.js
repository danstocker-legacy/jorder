/*global module, test, expect, ok, raises, equal, strictEqual, deepEqual */
/*global sntls, jorder */
(function () {
    "use strict";

    module("Table");

    test("Type conversion", function () {
        var hash = sntls.Hash.create([
                {foo: 'bar', hello: 'world'}
            ]),
            table = hash.toTable();

        ok(table.isA(jorder.Table), "Hash converted to table");
    });

    test("Instantiation", function () {
        raises(function () {
            jorder.Table.create({foo: 'bar'});
        }, "Invalid buffer");

        var table = jorder.Table.create([
            {foo: 'bar', hello: 'world'}
        ]);

        deepEqual(
            table.items,
            [
                {foo: 'bar', hello: 'world'}
            ],
            "Table rows"
        );

        ok(table.indexCollection.isA(jorder.IndexCollection), "Index collection");
        equal(table.indexCollection.count, 0, "No indexes initially");
    });

    test("Clearing table", function () {
        expect(2);

        var table = jorder.Table.create([
            {foo: 'bar', hello: 'world'}
        ]);

        table.indexCollection.addMock({
            clear: function () {
                ok(true, "Index collection cleared");
            }
        });

        table.clear();

        deepEqual(table.items, [], "Table buffer cleared");
    });

    test("Index addition", function () {
        var table = jorder.Table.create([
            {foo: 'bar', hello: 'world'}
        ])
            .addIndex(['foo', 'bar']);

        equal(table.indexCollection.count, 1, "Index count increased");
        deepEqual(table.indexCollection.getKeys(), ['foo|bar%string'], "Index keys");
        ok(table.indexCollection.items['foo|bar%string'].isA(jorder.Index), "Index instance");
    });
}());
