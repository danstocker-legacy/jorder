/*global module, test, expect, ok, raises, equal, strictEqual, notStrictEqual, deepEqual */
/*global sntls, jorder */
(function () {
    "use strict";

    module("Table");

    // for querying only. DO NOT modify from code
    var json = [
        {
            'order'  : 0,
            'title'  : 'Lord of the rings',
            'data'   : [5, 6, 43, 21, 88],
            'author' : 'Tolkien',
            'volumes': 3
        },
        {
            'order'  : 1,
            'title'  : 'Winnie the Pooh',
            'data'   : [1, 2, 34, 5],
            'author' : 'Milne',
            'volumes': 1
        },
        {
            'order'  : 2,
            'title'  : 'Prelude to Foundation',
            'data'   : [99, 1],
            'author' : 'Asimov',
            'volumes': 1
        }
    ];

    function order(a, b) {
        return a.order > b.order ? 1 : a.order < b.order ? -1 : 0;
    }

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
        equal(table.indexCollection.getKeyCount(), 0, "No indexes initially");
    });

    test("Item setting", function () {
        var table = jorder.Table.create()
            .addIndex(['foo'].toIndex())
            .setItem('0', {foo: "hello"});

        deepEqual(
            table.items,
            [
                {foo: "hello"}
            ],
            "Table contents"
        );
        deepEqual(
            table.indexCollection.getIndexForFields(['foo']).rowIdLookup.items,
            {'hello': '0'},
            "Row ID lookup"
        );
    });

    test("Setting multiple items", function () {
        var table = jorder.Table.create()
            .addIndex(['foo'].toIndex())
            .setItem('0', {foo: "hello"});

        table.setItems({
            1: {foo: "world"},
            2: {foo: "bar"}
        });

        deepEqual(
            table.items,
            [
                {foo: "hello"},
                {foo: "world"},
                {foo: "bar"}
            ],
            "Table contents"
        );
        deepEqual(
            table.indexCollection.getIndexForFields(['foo']).rowIdLookup.items,
            {'hello': '0', 'world': '1', 'bar': '2'},
            "Row ID lookup"
        );
    });

    test("Item deletion", function () {
        var table = jorder.Table.create(
                [
                    {foo: "hello"},
                    {foo: "world"}
                ])
            .addIndex(['foo'].toIndex())
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
                .addIndex(['foo'].toIndex()),
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
                .addIndex(['foo'].toIndex()),
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
            ]),
            index = ['foo', 'bar'].toIndex('string', false, 'descending');

        strictEqual(table.addIndex(index), table, "should be chainable");

        equal(table.indexCollection.getKeyCount(), 1, "should increase index collection count");
        deepEqual(table.indexCollection.getKeys(), ['foo|bar%string%descending'],
            "should set index in collection by the signature as key");

        strictEqual(
            table.indexCollection.getIndexForFields(['foo', 'bar'], 'string', 'descending'),
            index,
            "should set index on table");
    });

    test("Index addition by field names", function () {
        var table = jorder.Table.create([
            {foo: 'hello', bar: 'world'}
        ]);

        table.addIndexByFieldNames(['foo', 'bar'], 'string', false, 'descending');

        equal(table.indexCollection.getKeyCount(), 1, "should increase index collection count");
        deepEqual(table.indexCollection.getKeys(), ['foo|bar%string%descending'],
            "should set index in collection by the signature as key");

        var index = table.indexCollection.getIndexForFields(['foo', 'bar'], 'string', 'descending');

        ok(index.isA(jorder.Index), "Index instance");
        equal(index.rowSignature.isCaseInsensitive, false, "Case sensitive by default");

        deepEqual(
            index.rowIdLookup.items,
            {
                'hello|world': '0'
            },
            "Lookup of index");

        deepEqual(
            index.sortedKeys.items,
            ['hello|world'],
            "Keys in index");
    });

    test("Re-indexing", function () {
        var table = jorder.Table.create([
            {foo: 'hello', bar: 'world'}
        ]);

        table.addIndex(['foo', 'bar'].toIndex());

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

    test("Querying by row IDs", function () {
        var table = jorder.Table.create(json);

        deepEqual(table.queryByRowIds([2]), [json[2]], "Single row match");
        deepEqual(table.queryByRowIds([0, 2]), [json[0], json[2]], "Multiple row match");
        deepEqual(table.queryByRowIdsAsHash([2]).items, [json[2]], "Single row match");
        deepEqual(table.queryByRowIdsAsHash([0, 2]).items, [json[0], json[2]], "Multiple row match");
    });

    test("Query by single row", function () {
        var SIGNATURE_TYPES = jorder.RowSignature.SIGNATURE_TYPES,
            table = jorder.Table.create(json)
                .addIndex(['title'].toIndex(SIGNATURE_TYPES.fullText))
                .addIndex(['author'].toIndex(SIGNATURE_TYPES.string))
                .addIndex(['volumes'].toIndex(SIGNATURE_TYPES.number));

        deepEqual(
            table.queryByRowAsHash({author: 'Tolkien'}).items,
            [json[0]],
            "Fitting rows fetched (string match)"
        );

        deepEqual(
            table.queryByRowAsHash({title: 'the'}).items,
            [json[0], json[1]],
            "Fitting rows fetched (full text)"
        );

        deepEqual(
            table.queryByRowAsHash({volumes: 1}).items,
            [json[1], json[2]],
            "Fitting rows fetched (number)"
        );

        var items = {};

        table.addMocks({
            queryByRowAsHash: function () {
                return {items: items};
            }
        });

        strictEqual(table.queryByRow({}), items, "Items of return value of .queryByRowAsHash");
    });

    test("Query by multiple rows", function () {
        var SIGNATURE_TYPES = jorder.RowSignature.SIGNATURE_TYPES,
            table = jorder.Table.create(json)
                .addIndex(['title'].toIndex(SIGNATURE_TYPES.fullText))
                .addIndex(['author'].toIndex(SIGNATURE_TYPES.string))
                .addIndex(['volumes'].toIndex(SIGNATURE_TYPES.number));

        deepEqual(
            table.queryByRowsAsHash([
                {author: 'Tolkien'},
                {author: 'Milne'}
            ]).items,
            [json[0], json[1]],
            "Fitting rows fetched (string match)"
        );

        deepEqual(
            table.queryByRowsAsHash([
                {title: 'of'},
                {title: 'to'}
            ]).items,
            [json[0], json[2]],
            "Fitting rows fetched (full text)"
        );

        deepEqual(
            table.queryByRowsAsHash([
                    {volumes: 1},
                    {volumes: 3}
                ]).items.sort(function (a, b) {
                    return a.order - b.order;
                }),
            [json[0], json[1], json[2]],
            "Fitting rows fetched (number)"
        );
    });

    test("Querying by offset", function () {
        var SIGNATURE_TYPES = jorder.RowSignature.SIGNATURE_TYPES,
            table = jorder.Table.create(json)
                .addIndex(['title'].toIndex(SIGNATURE_TYPES.string)),
            result;

        result = table.queryByOffsetAsHash(['title'], 1);

        ok(result.isA(sntls.Hash), "should return Hash instance");
        strictEqual(result.getFirstValue(), json[2], "should return table row at specified offset");
    });

    test("Hash-less querying by offset", function () {
        var table = jorder.Table.create(json),
            hashBuffer = {};

        table.addMocks({
            queryByOffsetAsHash: function (fieldName, offset) {
                equal(fieldName, 'foo', "should pass field name to hash getter");
                equal(offset, 100, "should pass offset to hash getter");
                return sntls.Hash.create(hashBuffer);
            }
        });

        strictEqual(table.queryByOffset(['foo'], 100), hashBuffer, "should return hash buffer");
    });

    test("Querying by offset range", function () {
        var SIGNATURE_TYPES = jorder.RowSignature.SIGNATURE_TYPES,
            table = jorder.Table.create(json)
                .addIndex(['title'].toIndex(SIGNATURE_TYPES.string)),
            result;

        result = table.queryByOffsetRangeAsHash(['title'], 1, 3);

        ok(result.isA(sntls.Hash), "should return Hash instance");
        deepEqual(
            result.items,
            [ json[2], json[1] ],
            "should return table rows between specified offsets");
    });

    test("Hash-less querying by offset range", function () {
        var table = jorder.Table.create(json),
            hashBuffer = {};

        table.addMocks({
            queryByOffsetRangeAsHash: function (fieldName, startOffset, endOffset) {
                equal(fieldName, 'foo', "should pass field name to hash getter");
                equal(startOffset, 1, "should pass start offset to hash getter");
                equal(endOffset, 100, "should pass end offset to hash getter");
                return sntls.Hash.create(hashBuffer);
            }
        });

        strictEqual(table.queryByOffsetRange(['foo'], 1, 100), hashBuffer, "should return hash buffer");
    });

    test("Query by range (call stack)", function () {
        expect(4);

        var SIGNATURE_TYPES = jorder.RowSignature.SIGNATURE_TYPES,
            table = jorder.Table.create(json)
                .addIndex(['author'].toIndex(SIGNATURE_TYPES.string));

        jorder.Index.addMocks({
            getRowIdsForKeyRangeAsHash: function (startValue, endValue, offset, limit) {
                equal(startValue, "M");
                equal(endValue, "Z");
                equal(offset, 1);
                equal(limit, 2);
                return sntls.Hash.create();
            }
        });

        table.queryByRangeAsHash(['author'], "M", "Z", 1, 2);

        jorder.Index.removeMocks();
    });

    test("Query by range", function () {
        var SIGNATURE_TYPES = jorder.RowSignature.SIGNATURE_TYPES,
            table = jorder.Table.create(json)
                .addIndex(['title'].toIndex(SIGNATURE_TYPES.fullText))
                .addIndex(['author'].toIndex(SIGNATURE_TYPES.string));

        deepEqual(
            table.queryByRangeAsHash(['author'], "M", "Z").items
                .sort(order),
            [json[0], json[1]],
            "Fitting rows fetched (string)"
        );

        // matches "of" and "the"
        deepEqual(
            table.queryByRangeAsHash(['title'], "o", "ti").items
                .sort(order),
            [json[0], json[1]],
            "Fitting rows fetched (full text)"
        );
    });

    test("Query by range (case insensitive)", function () {
        var SIGNATURE_TYPES = jorder.RowSignature.SIGNATURE_TYPES,
            table = jorder.Table.create(json)
                .addIndex(['title'].toIndex(SIGNATURE_TYPES.fullText, true))
                .addIndex(['author'].toIndex(SIGNATURE_TYPES.string, true));

        deepEqual(
            table.queryByRangeAsHash(['author'], "m", "z").items
                .sort(order),
            [json[0], json[1]],
            "Fitting rows fetched (string)"
        );

        // matches "of" and "Pooh"
        deepEqual(
            table.queryByRangeAsHash(['title'], "O", "POP").items
                .sort(order),
            [json[0], json[1]],
            "Fitting rows fetched (full text)"
        );
    });

    test("Query by prefix (call stack)", function () {
        expect(3);

        var SIGNATURE_TYPES = jorder.RowSignature.SIGNATURE_TYPES,
            table = jorder.Table.create(json)
                .addIndex(['author'].toIndex(SIGNATURE_TYPES.string));

        jorder.Index.addMocks({
            getRowIdsForPrefixAsHash: function (prefix, offset, limit) {
                equal(prefix, "M");
                equal(offset, 1);
                equal(limit, 2);
                return sntls.Hash.create();
            }
        });

        table.queryByPrefixAsHash(['author'], "M", 1, 2);

        jorder.Index.removeMocks();
    });

    test("Query by prefix", function () {
        var SIGNATURE_TYPES = jorder.RowSignature.SIGNATURE_TYPES,
            table = jorder.Table.create(json)
                .addIndex(['title'].toIndex(SIGNATURE_TYPES.fullText))
                .addIndex(['author'].toIndex(SIGNATURE_TYPES.string));

        deepEqual(
            table.queryByPrefixAsHash(['author'], "Tol").items,
            [json[0]],
            "Fitting rows fetched (string)"
        );

        deepEqual(
            table.queryByPrefixAsHash(['title'], "th").items,
            [json[0], json[1]],
            "Fitting rows fetched (full text)"
        );

        deepEqual(
            table.queryByPrefixAsHash(['title'], "P").items,
            [json[1], json[2]],
            "Fitting rows fetched (full text)"
        );
    });

    test("Query by prefix (case insensitive)", function () {
        var SIGNATURE_TYPES = jorder.RowSignature.SIGNATURE_TYPES,
            table = jorder.Table.create(json)
                .addIndex(['title'].toIndex(SIGNATURE_TYPES.fullText, true))
                .addIndex(['author'].toIndex(SIGNATURE_TYPES.string, true));

        deepEqual(
            table.queryByPrefixAsHash(['author'], "tol").items,
            [json[0]],
            "Fitting rows fetched (string)"
        );

        deepEqual(
            table.queryByPrefixAsHash(['title'], "TH").items,
            [json[0], json[1]],
            "Fitting rows fetched (full text)"
        );

        deepEqual(
            table.queryByPrefixAsHash(['title'], "p").items,
            [json[1], json[2]],
            "Fitting rows fetched (full text)"
        );
    });

    test("Insertion", function () {
        var table = jorder.Table.create(),
            result;

        table
            .addIndex(['foo', 'bar'].toIndex())
            .addIndex(['foo'].toIndex())
            .addIndex(['foo', 'baz'].toIndex());

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

    test("Multiple insertion", function () {
        var table = jorder.Table.create(),
            result = [];

        table.addMocks({
            insertRow: function (row) {
                result.push(row.foo);
            }
        });

        table.insertRows([
            {foo: "hello"},
            {foo: "world"}
        ]);

        deepEqual(result, ["hello", "world"], "Insertion called for each new row");

        table.removeMocks();
    });

    test("Updating rows matching row expression", function () {
        var SIGNATURE_TYPES = jorder.RowSignature.SIGNATURE_TYPES,
            table = jorder.Table.create(sntls.Utils.shallowCopy(json))
                .addIndex(['volumes'].toIndex(SIGNATURE_TYPES.number)),
            row = {
                'order'  : 0,
                'title'  : 'Green Hills of Africa',
                'data'   : [9, 4, 22, 34],
                'author' : 'Hemingway',
                'volumes': 2
            },
            rowsRemoved = [],
            rowsAdded = [];

        raises(function () {
            table.updateRowsByRow('foo', row);
        }, "should raise exception on invalid row expression argument");

        raises(function () {
            table.updateRowsByRow({volumes: 1}, 'foo');
        }, "should raise exception on invalid row argument");

        raises(function () {
            table.updateRowsByRow({volumes: 1}, row, 'foo');
        }, "should raise exception on invalid index argument");

        jorder.Index.addMocks({
            removeRow: function (row, rowId) {
                rowsRemoved.push([row, rowId]);
                return this;
            },

            addRow: function (row, rowId) {
                rowsAdded.push([row, rowId]);
                return this;
            }
        });

        strictEqual(table.updateRowsByRow({volumes: 1}, row), table, "should be chainable");

        jorder.Index.removeMocks();

        deepEqual(table.items, [json[0], row, row],
            "should update all matching rows");

        deepEqual(rowsRemoved, [
            [
                {volumes: 1},
                '1'
            ],
            [
                {volumes: 1},
                '2'
            ]
        ], "should remove matching rows from affected indexes");

        deepEqual(rowsAdded, [
            [row, '1'],
            [row, '2']
        ], "should add row to affected indexes");
    });

    test("Deleting rows matching row expression", function () {
        expect(12);

        var table = jorder.Table.create([
                    {foo: "hello", bar: "world", baz: "!!!"},
                    {foo: "howdy", bar: "yall", baz: "!"},
                    {foo: "greetings", bar: "everyone", baz: "."}
                ])
                .addIndex(['foo', 'bar'].toIndex())
                .addIndex(['foo'].toIndex())
                .addIndex(['foo', 'baz'].toIndex()),
            rowExpression = {foo: "hello", bar: "world"},
            affectedSignatures = [];

        raises(function () {
            table.deleteRowsByRow('foo');
        }, "should raise exception on invalid row expression argument");

        raises(function () {
            table.deleteRowsByRow({foo: "hello", bar: "world"}, 'foo');
        }, "should raise exception on invalid index argument");

        raises(function () {
            table.deleteRowsByRow({hello: "world"});
        }, "should raise exception when no index fits specified row");

        jorder.Index.addMocks({
            removeRow: function (row, rowId) {
                // will be called 3x (for each index)
                affectedSignatures.push(this.rowSignature.getKeysForRow(row));
                strictEqual(row, rowExpression, "should remove row from affected index");
                equal(rowId, 0, "should pass row ID to removal from index");
            }
        });

        strictEqual(table.deleteRowsByRow(rowExpression), table,
            "should be chainable");

        jorder.Index.removeMocks();

        deepEqual(
            table.items,
            [
                undefined,
                {foo: "howdy", bar: "yall", baz: "!"},
                {foo: "greetings", bar: "everyone", baz: "."}
            ],
            "should set affected row(s) to undefined in table buffer"
        );

        deepEqual(affectedSignatures, [
            ['hello|world'],
            ['hello'],
            []
        ], "should remove row from all affected indexes");
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
