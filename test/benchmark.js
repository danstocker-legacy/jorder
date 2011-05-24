////////////////////////////////////////////////////////////////////////////////
// jOrder performance tests
////////////////////////////////////////////////////////////////////////////////
/*global jQuery, jOrder, jOB, DB, jLinq */

// registering benchmarks on document ready
(function ($, jOrder, jOB) {
	var
	
	// jOrder
	jorder77 = jOrder.testing.table77,
	jorder1000 = jOrder.testing.table1000,
	
	// db.js
	db77 = DB(jOrder.testing.json77),
	db1000 = DB(jOrder.testing.json1000);
		
	// Exact search on 77 rows
	jOB.benchmark("Search on small table", "jOrder", "native", "db.js", "jLinq");
	jOB.test("'GroupID' being either 107 or 185", function () {
		return jorder77.where([{ 'GroupID': 107 }, { 'GroupID': 185 }], { renumber: true });
	}, function () {
		var result = [], i, row;
		for (i = 0; i < jOrder.testing.json77.length; i++) {
			row = jOrder.testing.json77[i];
			if (row.GroupID === 107 || row.GroupID === 185) {
				result.push(row);
			}
		}
		return result;
	}, function () {
		return db77
			.find({'GroupID': db77.isin(['107', '185'])})
			.select('*');
	}, function () {
		return jLinq.from(jOrder.testing.json77)
			.equals('GroupID', 107).or(185)
			.select();
	});

	// Exact search on composite index
	jOB.test("where 'Total' = 8 and 'Currency' = 'USD'", function () {
		return jorder77.where([{ 'Currency': 'USD', 'Total': 8 }], { renumber: true });
	}, function () {
		var result = [], i, row;
		for (i = 0; i < jOrder.testing.json77.length; i++) {
			row = jOrder.testing.json77[i];
			if (row.Currency === 'USD' && row.Total === 8) {
				result.push(row);
			}
		}
		return result;		
	}, function () {
		return db77
			.find({'Currency': 'USD', 'Total': 8})
			.select('*');
	}, function () {
		return jLinq.from(jOrder.testing.json77)
			.equals('Total', 8)
			.and('Currency', 'USD')
			.select();
	});

	// Range search on 77 rows
	jOB.test("'Total' between 11 and 15", function () {
		return jOrder.testing.table77.where([{ 'Total': { lower: 11, upper: 15 } }], { mode: jOrder.range, renumber: true });
	}, function () {
		var result = [], i, row;
		for (i = 0; i < jOrder.testing.json77.length; i++) {
			row = jOrder.testing.json77[i];
			if (row.Total >= 11 && row.Total <= 15) {
				result.push(row);
			}
		}
		return result;
	}, function () {
		return db77
			.find(db77('Total', '>= 11'))
			.select('*');
	}, function () {
		return jLinq.from(jOrder.testing.json77)
			.betweenEquals('Total', 11, 15)
			.select();
	});

	// Sorting on 77 rows
	jOB.benchmark("Sorting on small table", "jOrder", "native", "db.js", "jLinq");
	jOB.test("by 'ID'", function () {
		return jorder77.orderby(['ID'], jOrder.asc, { indexName: 'id' });
	}, function () {
		return jOrder.shallow(jOrder.testing.json77).sort(function (a, b) {
			return a.ID > b.ID ? 1 : a.ID < b.ID ? -1 : 0;
		});
	}, function () {
		return db77
			.order('ID', 'asc')
			.select('*');
	}, function () {
		return jLinq.from(jOrder.testing.json77)
			.sort('ID')
			.select();
	});	

	// Exact search on 1000 rows
	jOB.benchmark("Search on big table", "jOrder", "native", "db.js", "jLinq");
	jOB.test("'id' being either 107 or 115", function () {
		return jorder1000.where([{ 'id': 107 }, { 'id': 115 }], {renumber: true});
	}, function () {
		var result = [], i, row;
		for (i = 0; i < jOrder.testing.json1000.length; i++) {
			row = jOrder.testing.json1000[i];
			if (row.id === 107 || row.id === 115) {
				result.push(row);
			}
		}
		return result;
	}, function () {
		return db1000
			.find({'id': db77.isin([107, 115])})
			.select('*');
	}, function () {
		return jLinq.from(jOrder.testing.json1000)
			.equals('id', 107).or(115)
			.select();
	});

	// Range search on 1000 rows
	jOB.test("'id' between 203 and 315", function () {
		return jorder1000.where([{ 'id': { lower: 203, upper: 315 } }], { mode: jOrder.range, renumber: true, limit: 1000 });
	}, function () {
		var result = [], i, row;
		for (i = 0; i < jOrder.testing.json1000.length; i++) {
			row = jOrder.testing.json1000[i];
			if (row.id >= 203 && row.id <= 315) {
				result.push(row);
			}
		}
		return result;
	}, function () {
		return db1000
			.find(db1000('id', '>= 203'))
			.select('*');
	}, function () {
		return jLinq.from(jOrder.testing.json1000)
			.betweenEquals('id', 203, 315)
			.select();
	});

	// Range search on 1000 rows with limit
	jOB.test("'id' between 203 and 315; hits #20 to #40", function () {
		return jorder1000.where([{ 'id': { lower: 203, upper: 315 } }], {
			mode: jOrder.range,
			renumber: true,
			offset: 20,
			limit: 20
		}, {renumber: true});
	}, function () {
		var result = [], i, row, counter = 0;
		for (i = 0; i < jOrder.testing.json1000.length; i++) {
			row = jOrder.testing.json1000[i];
			if (row.id >= 203 && row.id <= 315) {
				if (counter > 40) {
					break;
				} else if (counter < 20) {
					counter++;
					continue;
				} else {
					counter++;
					result.push(row);
				}
			}
		}
		return result;
	}, function () {
		return db1000
			.find(db1000('id', '>= 203'))
			.select('*')
			.slice(20, 40);
	}, function () {
		return jLinq.from(jOrder.testing.json1000)
			.betweenEquals('id', 203, 315)
			.skipTake(20, 20);
	});
	
	// Freetext search on 1000 rows
	jOB.test("rows with 'name' field starting with \"con\"", function () {
		return jorder1000.where([{ 'name': 'con' }], { mode: jOrder.startof, indexName: 'fulltext', limit: 1000, renumber: true });
	}, function () {
		var result = [], i, row;
		for (i = 0; i < jOrder.testing.json1000.length; i++) {
			row = jOrder.testing.json1000[i];
			if (null !== row.name.match(/\bcon/i)) {
				result.push(row);
			}
		}
		return result;		
	}, function () {
		return db1000
			.find({'name': db1000.like('con')})
			.select('*');
	}, function () {
		return jLinq.from(jOrder.testing.json1000)
			.starts('name', 'con')
			.select();
	});

	// Sorting on 1000 rows
	jOB.benchmark("Sorting on big table", "jOrder", "native", "db.js", "jLinq");
	jOB.test("by 'name'", function () {
		return jorder1000.orderby(['name'], jOrder.asc, { indexName: 'name' });
	}, function () {
		return jOrder.shallow(jOrder.testing.json1000).sort(function (a, b) {
			return a.name > b.name ? 1 : a.name < b.name ? -1 : 0;
		});
	}, function () {
		return db1000
			.order('name', 'asc')
			.select('*');
	}, function () {
		return jLinq.from(jOrder.testing.json1000)
			.sort('name')
			.select();
	}, { lengthonly: true });

	// Sorting on 1000 rows, limited
	jOB.test("by 'name' (first 20 hits)", function () {
		return jorder1000.orderby(['name'], jOrder.asc, { indexName: 'name', offset: 0, limit: 20 });
	}, function () {
		return jOrder.shallow(jOrder.testing.json1000).sort(function (a, b) {
			return a.name > b.name ? 1 : a.name < b.name ? -1 : 0;
		}).slice(0, 20);
	}, function () {
		return db1000
			.order('name', 'asc')
			.select('*')
			.slice(0, 20);
	}, function () {
		return jLinq.from(jOrder.testing.json1000)
			.sort('name')
			.take(20);
	});
	
	jOrder.logging = false;
}(jQuery,
	jOrder,
	jOB));

