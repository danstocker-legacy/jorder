/*global module, test, expect, ok, raises, equal, strictEqual, notStrictEqual, deepEqual */
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

    test("Item setting", function () {
        var table = jorder.Table.create()
            .addIndex(['foo'])
            .setItem(0, {foo: "hello"});

        deepEqual(
            table.items,
            [
                {foo: "hello"}
            ],
            "Table contents"
        );
        deepEqual(
            table.indexCollection.getIndexForFields(['foo']).rowIdLookup.items,
            {'hello': 0},
            "Row ID lookup"
        );
    });

    test("Item deletion", function () {
        var table = jorder.Table.create(
            [
                {foo: "hello"},
                {foo: "world"}
            ])
            .addIndex(['foo'])
            .deleteItem(0);

        deepEqual(
            table.items,
            [
                undefined,
                {foo: "world"}
            ],
            "Table contents"
        );
        deepEqual(
            table.indexCollection.getIndexForFields(['foo']).rowIdLookup.items,
            { 'world': '1' },
            "Row ID lookup"
        );
    });

    test("Cloning", function () {
        var table = jorder.Table.create(
                [
                    {foo: "hello"},
                    {foo: "world"}
                ])
                .addIndex(['foo']),
            cloneTable;

        cloneTable = table.clone();

        notStrictEqual(table.items, cloneTable.items, "Rows buffer not the same");
        deepEqual(table.items, cloneTable.items, "Rows match");
        notStrictEqual(
            table.indexCollection.getIndexForFields(['foo']).rowIdLookup.items,
            cloneTable.indexCollection.getIndexForFields(['foo']).rowIdLookup.items,
            "Lookup buffers not the same"
        );
        deepEqual(
            table.indexCollection.getIndexForFields(['foo']).rowIdLookup.items,
            cloneTable.indexCollection.getIndexForFields(['foo']).rowIdLookup.items,
            "Lookups match"
        );
        notStrictEqual(
            table.indexCollection.getIndexForFields(['foo']).sortedKeys.items,
            cloneTable.indexCollection.getIndexForFields(['foo']).sortedKeys.items,
            "Order buffers not the same"
        );
        deepEqual(
            table.indexCollection.getIndexForFields(['foo']).sortedKeys.items,
            cloneTable.indexCollection.getIndexForFields(['foo']).sortedKeys.items,
            "Orders match"
        );
    });

    test("Table merge", function () {
        var table = jorder.Table.create(
                [
                    {foo: "hello"},
                    {foo: "world"}
                ])
                .addIndex(['foo']),
            result;

        result = /** @type jorder.Table */ table.mergeWith(jorder.Table.create([
            undefined,
            {foo: "howdy"},
            {foo: "yall"}
        ]));

        deepEqual(
            result.items,
            [
                {foo: "hello"},
                {foo: "world"},
                {foo: "yall"}
            ],
            "Merged tables w/ conflicting rows discarded"
        );

        var index = result.indexCollection.getIndexForFields(['foo']);

        deepEqual(
            index.rowIdLookup.items,
            {
                hello: '0',
                world: '1',
                yall : '2'
            },
            "Merged lookup index"
        );

        deepEqual(
            index.sortedKeys.items,
            ['hello', 'world', 'yall'],
            "Merged key order"
        );
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

        table.addMocks({
            queryByRowAsHash: function () {
                return {items: items};
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

    test("Deletion", function () {
        var table = jorder.Table.create([
                {foo: "hello", bar: "world", baz: "!!!"},
                {foo: "howdy", bar: "yall", baz: "!"},
                {foo: "greetings", bar: "everyone", baz: "."}
            ]),
            result;

        table
            .addIndex(['foo', 'bar'])
            .addIndex(['foo'])
            .addIndex(['foo', 'baz']);

        raises(function () {
            table.deleteRowsByRow({hello: "world"});
        }, "No index for row");

        result = table.deleteRowsByRow({foo: "hello", bar: "world"});

        strictEqual(result, table, "Deletion is chainable");

        deepEqual(
            table.items,
            [
                undefined,
                {foo: "howdy", bar: "yall", baz: "!"},
                {foo: "greetings", bar: "everyone", baz: "."}
            ],
            "Row deleted"
        );

        table.deleteRowsByRow({foo: "greetings"});

        deepEqual(
            table.items,
            [
                undefined,
                {foo: "howdy", bar: "yall", baz: "!"},
                undefined
            ],
            "Row deleted"
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
