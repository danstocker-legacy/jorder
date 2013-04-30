/*global console, jOrder, module, test, ok, equal, deepEqual, raises */
(function (testing, constants, jOrder) {
    module("Order");

    var

    // test indexes
        string = jOrder.index(testing.jsonX, ['author'], {ordered: true}),
        number = jOrder.index(testing.jsonX, ['volumes'], {type: jOrder.number, grouped: true, ordered: true}),

        json;

    test("Binary search", function () {
        // searching in empty order
        equal(string
            .unbuild()
            .bsearch("Mil", constants.start), -1, "Searching in empty index, yields NOT FOUND");

        // building erased index
        string.rebuild();

        // author:"Milne" is at index 1
        equal(string.bsearch("Mil", constants.start), 1, "Looking up 'Milne' as start of interval (inclusive)");
        equal(string.bsearch("Mil", constants.end), 0, "Looking up 'Milne' as end of interval (exclusive)");

        // author:"Verne" is off the index (too high)
        equal(string.bsearch("Vern", constants.start), 3, "Off-index 'Verne' as start of interval (inclusive)");
        equal(string.bsearch("Vern", constants.end), 2, "Off-index 'Verne' as end of interval (exclusive)");

        // author:"Aldiss" is off the index (too low)
        equal(string.bsearch("Ald", constants.start), 0, "Off-index 'Aldiss' as start of interval (inclusive)");
        equal(string.bsearch("Ald", constants.end), -1, "Off-index 'Aldiss' as end of interval (exclusive)");

        // edge cases "Adimov" and "Tolkien" are at first and last indices
        equal(string.bsearch("Asim", constants.start), 0, "First item 'Asimov' is OK as interval start");
        equal(string.bsearch("Asim", constants.end), -1, "First item 'Asimov' is unsuitable as end of inerval");
        equal(string.bsearch("Tol", constants.start), 2, "Last item 'Tolkien' is OK as interval start (interval length = 1)");
        equal(string.bsearch("Tol", constants.end), 1, "Last item 'Tolkien' is OK as interval end");

        equal(number.bsearch(1, constants.start), 0, "Exact result as start in grouped numeric index");
        equal(number.bsearch(1, constants.end), -1, "Exact result as end in grouped numeric index");
        equal(number.bsearch(1.5, constants.start), 2, "In between result as start in grouped numeric index");
        equal(number.bsearch(1.5, constants.end), 1, "In between result as end in grouped numeric index");
    });

    // heavily redundant data
    json = [
        {val: 5, str: "testx"},
        {val: 1, str: "test"},
        {val: 5, str: "testA"},
        {val: 5, str: "test"},
        {val: 9, str: "blah"},
        {val: 5, str: "blahhh"},
        {val: 5, str: "lab"}
    ];

    test("Bsearch edge cases (numeric)", function () {
        var

            index = jOrder.index(json, ['val'], {grouped: true, ordered: true, type: jOrder.number}),
            random_order = [5, 4, 0, 2, 6, 3, 1],
            expected = [
                {key: 1, rowId: 1},
                {key: 5, rowId: 0},
                {key: 5, rowId: 2},
                {key: 5, rowId: 3},
                {key: 5, rowId: 5},
                {key: 5, rowId: 6},
                {key: 9, rowId: 4}
            ],
            i;

        deepEqual(index.order(), expected, "Index is ordered by key, then rowId");

        // locating items by key (and optionally rowId)
        equal(index.bsearch(5, constants.start), 1, "Bsearch returns the lowest suitable item id by default");
        equal(index.bsearch(5, constants.start, 5), 4, "Bsearch may locate a specific item within the index");

        // demonstrating that addition preserves integrity on both key and rowId
        index.unbuild();
        for (i = 0; i < 7; i++) {
            index.add(json[random_order[i]], random_order[i]);
        }
        deepEqual(index.order(), expected, "Order of additions has no effect on final index");
    });

    test("Bsearch edge cases (string)", function () {
        // heavily redundant data
        var
            index = jOrder.index(json, ['str'], {grouped: true, ordered: true, type: jOrder.string}),
            expected = [
                {key: "blah", rowId: 4},
                {key: "blahhh", rowId: 5},
                {key: "lab", rowId: 6},
                {key: "test", rowId: 1},
                {key: "test", rowId: 3},
                {key: "testA", rowId: 2},
                {key: "testx", rowId: 0}
            ],
            i;

        deepEqual(index.order(), expected, "Index is ordered by key, then rowId");

        // locating items by key (and optionally rowId)
        equal(index.bsearch("test", constants.start), 3, "Bsearch returns the lowest suitable item id by default");
        equal(index.bsearch("test", constants.start, 3), 4, "Bsearch may locate a specific item within the index");
    });

    test("Modifying order", function () {
        var expected;

        //////////////////////////////
        // unique index (string type)

        // first element
        expected = [
            {key: 'Tolkien', rowId: 0}
        ];
        string
            .unbuild()
            .add(testing.jsonX[0], 0);
        deepEqual(string.order(), expected, "Adding FIRST item to UNIQUE order");

        // second element
        expected = [
            {key: 'Milne', rowId: 1},
            {key: 'Tolkien', rowId: 0}
        ];
        string
            .add(testing.jsonX[1], 1);
        deepEqual(string.order(), expected, "Adding SECOND item to UNIQUE order");

        //////////////////////////////
        // grouped index (numeric type)

        // first element
        expected = [
            {key: 1, rowId: 1}
        ];
        number
            .unbuild()
            .add(testing.jsonX[1], 1);
        deepEqual(number.order(), expected, "Adding FIRST item to GROUPED order");

        // second element
        expected = [
            {key: 1, rowId: 1},
            {key: 3, rowId: 0}
        ];
        number
            .add(testing.jsonX[0], 0);
        deepEqual(number.order(), expected, "Adding SECOND item to GROUPED order");

        // third element
        expected = [
            {key: 1, rowId: 1},
            {key: 1, rowId: 2},
            {key: 3, rowId: 0}
        ];
        number
            .add(testing.jsonX[2], 2);
        deepEqual(number.order(), expected, "Adding THIRD item to GROUPED order");

        // removing first element
        expected = [
            {key: 1, rowId: 2},
            {key: 3, rowId: 0}
        ];
        number
            .remove(testing.jsonX[1], 1);
        deepEqual(number.order(), expected, "Removing FIRST item from GROUPED order");
    });

    test("Retrieval", function () {
        // empty order
        string.unbuild();
        deepEqual(string.order(), [], "Empty index");

        // reference by default
        string.rebuild();
        equal(string.order(), string.order(), "Reference to index on no arguments");

        var expected;

        //////////////////////////////
        // full forward order

        expected = [
            {
                "key"  : "Asimov",
                "rowId": 2
            },
            {
                "key"  : "Milne",
                "rowId": 1
            },
            {
                "key"  : "Tolkien",
                "rowId": 0
            }
        ];
        deepEqual(string.order(jOrder.asc, {offset: 0, limit: 3}), expected, "Copy of full forward order");

        //////////////////////////////
        // full reverse order

        expected = [
            {
                "key"  : "Tolkien",
                "rowId": 0
            },
            {
                "key"  : "Milne",
                "rowId": 1
            },
            {
                "key"  : "Asimov",
                "rowId": 2
            }
        ];
        deepEqual(string.order(jOrder.desc, {offset: 0, limit: 3}), expected, "Copy of full reverse order");

        //////////////////////////////
        // forward fractional order

        expected = [
            {
                "key"  : "Milne",
                "rowId": 1
            },
            {
                "key"  : "Tolkien",
                "rowId": 0
            }
        ];
        deepEqual(string.order(jOrder.asc, {offset: 1, limit: 2}), expected, "Copy of forward fractional order");

        //////////////////////////////
        // reverse fractional order

        expected = [
            {
                "key"  : "Milne",
                "rowId": 1
            },
            {
                "key"  : "Asimov",
                "rowId": 2
            }
        ];
        deepEqual(string.order(jOrder.desc, {offset: 1, limit: 2}), expected, "Copy of reverse fractional order");
    });

    test("Range search", function () {
        var index1000 = jOrder.index(testing.json1000, ['id'], { ordered: true, type: constants.number });
        equal(index1000.range().length, 100, "Default limit is 100");

        // string type, unique
        string.rebuild();
        deepEqual(string.range({lower: 'Asi', upper: 'Tol'}, {limit: 1000}), [2, 1
        ], "Higher limit returns all items in range");
        deepEqual(string.range({lower: 'Asi', upper: 'Tolz'}, {limit: 1000}), [2, 1, 0
        ], "Inclusive search returns upper bound, too");

        deepEqual(string.range(), [2, 1, 0], "NO bounds specified");
        deepEqual(string.range({lower: 'Mil'}), [1, 0], "Only LOWER bound specified");
        deepEqual(string.range({upper: 'Milz'}), [2, 1], "Only UPPER bound specified");

        // number type
        number.rebuild();
        deepEqual(number.range({lower: 1, upper: 1.00001}, {limit: 1000}), [1, 2], "Grouped numeric range");
        deepEqual(number.range({lower: 1, upper: 3.00001}, {limit: 1000}), [1, 2, 0], "Grouped numeric range");
    });
}(jOrder.testing,
    jOrder.constants,
    jOrder));

