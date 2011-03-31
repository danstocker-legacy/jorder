////////////////////////////////////////////////////////////////////////////////
// 1000 record table for testing jOrder
////////////////////////////////////////////////////////////////////////////////
/*global jOrder */

jOrder.testing = function (testing) {
	// table with 77 rows and 5 columns
	testing.table77 = new jOrder.table(jOrder.testing.json77 || [])
		.index('id', ['ID'], { ordered: true, type: jOrder.number })
		.index('id_nosort', ['ID'])
		.index('group', ['GroupID'], { ordered: true, grouped: true, type: jOrder.number })
		.index('total', ['Total'], { ordered: true, grouped: true, type: jOrder.number })
		.index('date', ['StartDate'], { ordered: true, grouped: true })
		.index('signature', ['Total', 'Currency'], { ordered: true, grouped: true });

	// unindexed version of 77-row table
	testing.table77n = new jOrder.table(jOrder.testing.json77 || []);

	// table with 1000 rows and 2 columns
	testing.table1000 = new jOrder.table(jOrder.testing.json1000 || [])
		.index('id', ['id'], { ordered: true, type: jOrder.number })
		.index('name', ['name'], { ordered: true, grouped: true })
		.index('fulltext', ['name'], { ordered: true, grouped: true, type: jOrder.text });
	
	// unindexed version of 77-row table
	testing.table1000n = new jOrder.table(jOrder.testing.json1000 || []);

	return testing;
}(jOrder.testing || {});

