/*global jOrder */
jOrder.testing = jOrder.testing || {};
(function (testing, constants) {
    // table with 77 rows and 5 columns
    testing.table77 = jOrder(testing.json77 || [])
        .index('id', ['ID'], { ordered: true, type: constants.number })
        .index('id_nosort', ['ID'])
        .index('group', ['GroupID'], { ordered: true, grouped: true, type: constants.number })
        .index('total', ['Total'], { ordered: true, grouped: true, type: constants.number })
        .index('date', ['StartDate'], { ordered: true, grouped: true })
        .index('signature', ['Total', 'Currency'], { ordered: true, grouped: true });

    // unindexed version of 77-row table
    testing.table77n = jOrder(testing.json77 || []);

    // table with 1000 rows and 2 columns
    testing.table1000 = jOrder(testing.json1000 || [])
        .index('id', ['id'], { ordered: true, type: constants.number })
        .index('name', ['name'], { ordered: true, grouped: true })
        .index('fulltext', ['name'], { ordered: true, grouped: true, type: constants.text });

    // unindexed version of 77-row table
    testing.table1000n = jOrder(testing.json1000 || []);
}(jOrder.testing,
    jOrder.constants));
