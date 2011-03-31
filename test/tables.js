////////////////////////////////////////////////////////////////////////////////
// 1000 record table for testing jOrder
////////////////////////////////////////////////////////////////////////////////
jOrder.test = function (test) {
	// table with 77 rows and 2 columns
	test.table77 = new jOrder.table(jOrder.test.json77 || [])
		.index('id', ['ID'], { ordered: true, type: jOrder.number })
		.index('id_nosort', ['ID'])
		.index('group', ['GroupID'], { ordered: true, grouped: true, type: jOrder.number })
		.index('total', ['Total'], { ordered: true, grouped: true, type: jOrder.number })
		.index('date', ['StartDate'], { ordered: true, grouped: true })
		.index('signature', ['Total', 'Currency'], { ordered: true, grouped: true });

	test.table77n = new jOrder.table(jOrder.test.json77 || []);

	// table with 1000 rows and 2 columns
	test.table1000 = new jOrder.table(jOrder.test.json1000 || [])
		.index('id', ['id'], { ordered: true, type: jOrder.number })
		.index('name', ['name'], { ordered: true, grouped: true })
		.index('fulltext', ['name'], { ordered: true, grouped: true, type: jOrder.text });
	
	test.table1000n = new jOrder.table(jOrder.test.json1000 || []);

	return test;
}(jOrder.test || {});

