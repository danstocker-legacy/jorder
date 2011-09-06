////////////////////////////////////////////////////////////////////////////////
// jOrder performance tests
////////////////////////////////////////////////////////////////////////////////
/*global jQuery, jOrder, jOB, DB, jLinq, TAFFY, Jade */

// registering benchmarks on document ready
(function ($, jOrder, jOB) {
	var
	
	// jOrder
	jorder77 = jOrder.testing.table77,
	jorder1000 = jOrder.testing.table1000,
	
	// db.js
	db77 = DB(jOrder.testing.json77),
	db1000 = DB(jOrder.testing.json1000),
	
	// TAFFY
	// Taffy modofies the original json
	taffy77j,
	taffy77 = TAFFY(jOrder.testing.json77),
	taffy1000j,
	taffy1000 = TAFFY(jOrder.testing.json1000),
	
	// JaDE
	jade77 = new Jade({id: 'ID', index: 'GroupID, Total, StartDate, Currency'}),
	jade1000 = new Jade({index: 'name'}),
	
	// temp table buffers
	native77tj,
	jorder77t,
	db77t,
	taffy77t,
	i;
	
	for (i = 0; i < jOrder.testing.json77.length; i++) {
		jade77.add(jOrder.testing.json77[i]);
	}
	for (i = 0; i < jOrder.testing.json1000.length; i++) {
		jade1000.add(jOrder.testing.json1000[i]);
	}
	
	// object initialization	
	jOB.benchmark("Object initialization", "jOrder 1.2", "native", "db.js", "jLinq 3.0.1", "Taffy DB 2.0", "JaDE");
	
	// Initializing small table
	jOB.test("Small table w/ 6 indexes (5 ordered)", function () {
		var table = jOrder(jOrder.testing.json77)
			.index('id', ['ID'], { ordered: true, type: jOrder.number })
			.index('id_nosort', ['ID'])
			.index('group', ['GroupID'], { ordered: true, grouped: true, type: jOrder.number })
			.index('total', ['Total'], { ordered: true, grouped: true, type: jOrder.number })
			.index('date', ['StartDate'], { ordered: true, grouped: true })
			.index('signature', ['Total', 'Currency'], { ordered: true, grouped: true });
		return jOrder.testing.json77;
	}, 
	// native version needs no initialization
	null,
	function () {
		var table = DB(jOrder.testing.json77);
		return jOrder.testing.json77;
	},
	// jLinq needs no initialization
	null,
	function () {
		var table = TAFFY(jOrder.testing.json77);
		return jOrder.testing.json77;
	}, function () {
		var json = jOrder.testing.json77,
				table, i;
		table = new Jade({
			id: 'ID',
			index: 'GroupID, Total, StartDate, Currency'
		});
		// adding arrays is buggy, have to add rows one by one
		for (i = 0; i < json.length; i++) {
			table.add(json[i]);
		}
		return json;
	}, {lengthonly: true});

	// Initializing large table
	jOB.test("Large table w/ 3 ordered indexes", function () {
		var table = jOrder(jOrder.testing.json1000)
			.index('id', ['id'], { ordered: true, type: jOrder.number })
			.index('name', ['name'], { ordered: true, grouped: true })
			.index('fulltext', ['name'], { ordered: true, grouped: true, type: jOrder.text });
		return jOrder.testing.json1000;
	}, 
	// native version needs no initialization
	null,
	function () {
		var table = DB(jOrder.testing.json1000);
		return jOrder.testing.json1000;
	},
	// jLinq needs no initialization
	null,
	function () {
		var table = TAFFY(jOrder.testing.json1000);
		return jOrder.testing.json1000;
	}, function () {
		var json = jOrder.testing.json1000,
				table, i;
		table = new Jade({
			id: 'id',
			index: 'name'
		});
		// adding arrays is buggy, have to add rows one by one
		for (i = 0; i < json.length; i++) {
			table.add(json[i]);
		}
		return json;
	}, {lengthonly: true});

	// Exact search on 77 rows

	jOB.benchmark("Search on small table", "jOrder 1.2", "native", "db.js", "jLinq 3.0.1", "Taffy DB 2.0", "JaDE");
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
			.find({'GroupID': db77.isin([107, 185])})
			.select('*');
	}, function () {
		return jLinq.from(jOrder.testing.json77)
			.equals('GroupID', 107).or(185)
			.select();
	}, function () {
		return taffy77([{'groupid': 107}, {'groupid': 185}])
			.get();
	}, function () {
		return jade77
			.get({'GroupID': {within: ['107', '185']}});
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
	}, function () {
		return taffy77({'total': 8, 'currency': 'USD'})
			.select('id', 'currency', 'enddate', 'enddateutc', 'total', 'amount', 'product', 'startdate', 'startdateutc', 'status', 'statusstr', 'groupid');
	}, function () {
		return jade77
			.get({'Total': '8', 'Currency': 'USD'});
	});

	// Range search on 77 rows
	jOB.test("'Total' between 11 and 15", function () {
		return jorder77.where([{ 'Total': { lower: 10.9, upper: 15.1 } }], { mode: jOrder.range, renumber: true });
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
			.find(db77('Total', '>= 11'), db77('Total', '<= 15'))
			.select('*');
	}, function () {
		return jLinq.from(jOrder.testing.json77)
			.betweenEquals('Total', 11, 15)
			.select();
	}, function () {
		return taffy77({'total': {gte: 11, lte: 15}})
			.get()
	}, function () {
		return jade77
			.get({'Total': {gte: 11, lte: 15}});
	});

	// Sorting on 77 rows
	jOB.benchmark("Sorting on small table", "jOrder 1.2", "native", "db.js", "jLinq 3.0.1", "Taffy DB 2.0", "JaDE");
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
	}, function () {
		return taffy77()
			.order('id asec')
			.get();
	}, function () {
		return jade77
			.get({'_sort': 'ID'});
	});	
	var tStuff = [taffy1000().first(),taffy1000().last()];
	// Exact search on 1000 rows
	jOB.benchmark("Search on big table", "jOrder 1.2", "native", "db.js", "jLinq 3.0.1", "Taffy DB 2.0", "JaDE");
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
	}, function () {
		return taffy1000({id: [107,115]})
			.get();
	}, function () {
		return jade1000
			.get({id: {within: [107, 115]}});
	});

	// Range search on 1000 rows
	jOB.test("'id' between 203 and 315", function () {
		return jorder1000.where([{ 'id': { lower: 202.9, upper: 315.1 } }], { mode: jOrder.range, renumber: true, limit: 1000 });
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
			.find(db1000('id', '>= 203'), db1000('id', '<= 315'))
			.select('*');
	}, function () {
		return jLinq.from(jOrder.testing.json1000)
			.betweenEquals('id', 203, 315)
			.select();
	}, function () {
		return taffy1000({id: {gte: 203, lte: 315}})
			.get();
	}, function () {
		return jade1000
			.get({'id': {gte: 203, lte: 315}});
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
	}, function () {
		// there's no offset in Taffy, only limit -> must resort to Array.slice()
		return taffy1000({'id': {gte: 203, lte: 315}})
			.get()
			.slice(20, 40);
	}, function () {
		return jade1000
			.get({id: {gte: 203, lte: 315}, '_limit': 20, '_offset': 20});
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
			.find({'name': function (value) {
				return null !== value.match(/\bcon/i);
			}})
			.select('*');
	}, function () {
		return jLinq.from(jOrder.testing.json1000)
			.match('name', /\bcon/i)
			.select();
	}, function () {
		return taffy1000({'name': {regex: /\bcon/i}})
			.get();
	}, function () {
		return jade1000
			.get({'_search': 'con'});
	});

	// Sorting on 1000 rows
	jOB.benchmark("Sorting on big table", "jOrder 1.2", "native", "db.js", "jLinq 3.0.1", "Taffy DB 2.0", "JaDE");
	jOB.test("by 'name'", function () {
		return jorder1000.orderby(['name'], jOrder.asc, { indexName: 'name' });
	}, function () {
		return jOrder.shallow(jOrder.testing.json1000).sort(function (a, b) {
			return a.name > b.name ? 1 : a.name < b.name ? -1 : 0;
		});
	}, function () {
		return db1000
			.order('name')
			.select('*');
	}, function () {
		return jLinq.from(jOrder.shallow(jOrder.testing.json1000))
			.sort('name')
			.select();
	}, function () {
		return taffy1000()
			.order('name asec')
			.get();
	}, function () {
		return jade1000
			.get({'_sort': 'name'});
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
		return jLinq.from(jOrder.shallow(jOrder.testing.json1000))
			.sort('name')
			.take(20);
	}, function () {
		return taffy1000()
			.order('name asec')
			.limit(20)
			.get();
	}, function () {
		return jade1000
			.get({'_sort': 'name', '_limit': 20});
	});
	
	// Sorting on 1000 rows
	jOB.benchmark("Modifying small table", "jOrder 1.2", "native", "db.js", "jLinq 3.0.1", "Taffy DB 2.0", "JaDE");

	function resetTables() {
		var i;
		
		native77tj = jOrder.shallow(jOrder.testing.json77);
		
		jorder77t = jOrder(jOrder.shallow(jOrder.testing.json77))
			.index('id', ['ID'], { ordered: true, type: jOrder.number })
			.index('id_nosort', ['ID'])
			.index('group', ['GroupID'], { ordered: true, grouped: true, type: jOrder.number })
			.index('total', ['Total'], { ordered: true, grouped: true, type: jOrder.number })
			.index('date', ['StartDate'], { ordered: true, grouped: true })
			.index('signature', ['Total', 'Currency'], { ordered: true, grouped: true });
		
		db77t = DB(jOrder.shallow(jOrder.testing.json77));
		
		taffy77t = TAFFY(jOrder.shallow(jOrder.testing.json77));
		
		jade77 = new Jade({id: 'ID', index: 'GroupID, Total, StartDate, Currency'});
		for (i = 0; i < jOrder.testing.json77.length; i++) {
			jade77.add(jOrder.testing.json77[i]);
		}
	}
	
	function generateRow(i) {
		return {
			"ID": 5000 + i,
			"Currency": "USD",
			"EndDate": "8\/5\/2010",
			"EndDateUtc": 129254400000000000,
			"Total": 5,
			"Amount": 0,
			"Product": 2,
			"StartDate": "3\/4\/2010",
			"StartDateUtc": 129121866600000000,
			"Status": 1,
			"StatusStr": "Active",
			"GroupID": 1
		};
	}
	
	jOB.test("Insertion", function (i) {
		if (typeof i !== 'undefined') {
			jorder77t.insert([generateRow(i)]);
			return [];
		} else {
			return jorder77t.flat();
		}
	}, function (i) {
		if (typeof i !== 'undefined') {
			native77tj.push(generateRow(i));
			return [];
		} else {
			return native77tj;
		}
	}, function (i) {
		if (typeof i !== 'undefined') {
			db77t.insert([generateRow(i)]);
			return [];
		} else {
			return db77t.select('*');
		}
	},
	null,
	function (i) {
		if (typeof i !== 'undefined') {
			taffy77t
				.insert(generateRow(i), false);
			return [];
		} else {
			return taffy77t()
				.get()
		}
	}, function (i) {
		if (typeof i !== 'undefined') {
			jade77.add(generateRow(i));
			return [];
		} else {
			return jade77.get();
		}
	}, {
		lengthonly: true,
		before: resetTables
	});
	
	jOB.benchmark("Index building with jOrder",
		"consistent",
		"lazy");
	
	jOB.test("lookup", function () {
		var lookup = jOrder.lookup(jOrder.testing.json1000, ['id'], { type: jOrder.number }),
				json = jOrder.testing.json1000,
				i;
		for (i = 0; i < json.length; i++) {
			lookup.add([json[i].id], i);
		}
		return [{count: lookup.count()}];
	}, null);
	
	jOB.test("order", function () {
		var order = jOrder.order([], ['id'], { type: jOrder.number }),
				json = jOrder.testing.json1000,
				i;
		for (i = 0; i < json.length; i++) {
			order.add([json[i].id], i);
		}
		return order.order();
	}, function () {
		var order = jOrder.order([], ['id'], { type: jOrder.number }),
				json = jOrder.testing.json1000,
				i;
		for (i = 0; i < json.length; i++) {
			order.add([json[i].id], i, true);
		}
		order.reorder();
		return order.order();
	});
	
	jOB.test("lookup + order", function () {
		// empty index
		var index = jOrder.index([], ['id'], { ordered: true, type: jOrder.number }),
				json = jOrder.testing.json1000,
				i;
		for (i = 0; i < json.length; i++) {
			index.add(json[i], i);
		}
		return [{count: index.count()}];
	}, function () {
		// full index, lazy ordering
		var index = jOrder.index(jOrder.testing.json1000, ['id'], { ordered: true, type: jOrder.number });
		return [{count: index.count()}];
	});
	
	jOrder.logging = false;
}(jQuery,
	jOrder,
	jOB));

