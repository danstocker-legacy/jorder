/*global module, test, expect, ok, raises, equal, strictEqual, deepEqual */
/*global sntls, jorder */
(function () {
    "use strict";

    module("Table");

    // for querying only. DO NOT modify from code
    var json = [
        {
            'title'  : 'Lord of the rings',
            'data'   : [5, 6, 43, 21, 88],
            'author' : 'Tolkien',
            'volumes': 3
        },
        {
            'title'  : 'Winnie the Pooh',
            'data'   : [1, 2, 34, 5],
            'author' : 'Milne',
            'volumes': 1
        },
        {
            'title'  : 'Prelude to Foundation',
            'data'   : [99, 1],
            'author' : 'Asimov',
            'volumes': 1
        }
    ];

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

    test("Index addition", function () {
        var table = jorder.Table.create([
            {foo: 'hello', bar: 'world'}
        ]);

        table.addIndex(['foo', 'bar']);

        equal(table.indexCollection.count, 1, "Index count increased");
        deepEqual(table.indexCollection.getKeys(), ['foo|bar%string'], "Index keys");

        var index = table.indexCollection.getIndexForFields(['foo', 'bar']);

        ok(index.isA(jorder.Index), "Index instance");
        deepEqual(
            index.rowIdLookup.items,
            {
                'hello|world': '0'
            },
            "Lookup of index"
        );
        deepEqual(
            index.sortedKeys.items,
            ['hello|world'],
            "Keys in index"
        );
    });

    test("Re-indexing", function () {
        var table = jorder.Table.create([
            {foo: 'hello', bar: 'world'}
        ]);

        table.addIndex(['foo', 'bar']);

        var index = table.indexCollection.getIndexForFields(['foo', 'bar']);

        // adding row inconsistently
        table.items.push({foo: 'howdy', bar: 'yall'});

        // index is not updated yet
        deepEqual(
            index.rowIdLookup.items,
            {
                'hello|world': '0'
            },
            "Lookup before reindex"
        );
        deepEqual(
            index.sortedKeys.items,
            ['hello|world'],
            "Keys before reindex"
        );

        table.reIndex();

        // updated indexes
        deepEqual(
            index.rowIdLookup.items,
            {
                'hello|world': '0',
                'howdy|yall' : '1'
            },
            "Lookup after reindex"
        );
        deepEqual(
            index.sortedKeys.items,
            [
                'hello|world',
                'howdy|yall'
            ],
            "Keys after reindex"
        );
    });

    test("Query by single row", function () {
        var SIGNATURE_TYPES = jorder.RowSignature.SIGNATURE_TYPES,
            table = jorder.Table.create(json)
                .addIndex(['title'], SIGNATURE_TYPES.fullText)
                .addIndex(['author'], SIGNATURE_TYPES.string)
                .addIndex(['volumes'], SIGNATURE_TYPES.number);

        deepEqual(
            table.queryByRowAsHash({author: 'Tolkien'}).items,
            [json[0]],
            "Fitting rows fetched"
        );

        deepEqual(
            table.queryByRowAsHash({title: 'the'}).items,
            [json[0], json[1]],
            "Fitting rows fetched"
        );

        deepEqual(
            table.queryByRowAsHash({volumes: 1}).items,
            [json[1], json[2]],
            "Fitting rows fetched"
        );

        var items = {};

        table.addMock({
            queryByRowAsHash: function () {
                return {items:items};
            }
        });

        strictEqual(table.queryByRow({}), items, "Items of return value of .queryByRowAsHash");
    });

    test("Insertion", function () {
        var table = jorder.Table.create(),
            result;

        table
            .addIndex(['foo', 'bar'])
            .addIndex(['foo'])
            .addIndex(['foo', 'baz']);

        deepEqual(table.items, [], "Table is empty by default");

        result = table.insertRow({foo: 'hello', bar: 'world'});

        strictEqual(result, table, "Insertion is chainable");

        deepEqual(
            table.items,
            [
                {foo: 'hello', bar: 'world'}
            ],
            "Row contents added to table"
        );

        deepEqual(
            table.indexCollection.getIndexForFields(['foo', 'bar']).rowIdLookup.items,
            {'hello|world': '0'},
            "First lookup okay"
        );
        deepEqual(
            table.indexCollection.getIndexForFields(['foo']).rowIdLookup.items,
            {'hello': '0'},
            "Second lookup okay"
        );
        deepEqual(
            table.indexCollection.getIndexForFields(['foo', 'baz']).rowIdLookup.items,
            {},
            "Third index not relevant for row"
        );
    });

    test("Clearing table", function () {
        expect(2);

        var table = jorder.Table.create([
            {foo: 'bar', hello: 'world'}
        ]);

        table.clear();

        deepEqual(table.items, [], "Table buffer cleared");
        deepEqual(table.indexCollection.items, {}, "Index collection cleared");
    });
}());
