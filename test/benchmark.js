// table with 77 rows and several columns
var table_indexed = jOrder(jorder_benchmark_data77)
	.index('id', ['ID'], { ordered: true, type: jOrder.number })
	.index('id_nosort', ['ID'])
	.index('group', ['GroupID'], { ordered: true, grouped: true, type: jOrder.number })
	.index('total', ['Total'], { ordered: true, grouped: true, type: jOrder.number })
	.index('date', ['StartDate'], { ordered: true, grouped: true })
	.index('signature', ['Total', 'Currency'], { ordered: true, grouped: true });
var table_unindexed = jOrder(jorder_benchmark_data77);

// table with 1000 rows and 2 columns
var table1000_indexed = jOrder(jorder_benchmark_data1000)
	.index('id', ['id'], { ordered: true, type: jOrder.number })
	.index('name', ['name'], { ordered: true, grouped: true })
	.index('fulltext', ['name'], { ordered: true, grouped: true, type: jOrder.text });
var table1000_unindexed = jOrder(jorder_benchmark_data1000);

// env variables
var benchmark_cycles = 10;
var categories =
{
	'exact_search77': "Searching for exact matches ('GroupID' being either 107 or 185)",
	'composite_search77': "Searching for exact matches (where 'Total' = 8 and 'Currency' = 'USD')",
	'range_search77': "Range search ('Total' between 11 and 15)",
	'exact_search1000': "Searching for exact matches ('id' being either 107 or 115)",
	'range_search1000': "Range search ('id' between 203 and 315)",
	'range_search_page1000': "Range search with page result ('id' between 203 and 315; hits #20 to #40)",
	'freetext_search1000': "Free text search (rows with 'name' field starting with \"con\")",
	'sorting77': "Sorting by 'ID'",
	'sorting1000': "Sorting by 'name'",
	'sorting_page1000': "Sorting by 'name' (first 20 hits)",
	'aggregate77': "Grouping by 'GroupID'",
	'array': "Concatenating an array to itself multiple times"
}

// function that registers a benchmark function on the page
function register_benchmark(table, category, description, callback, isreference)
{
	// adding tbody
	var tbody = $('#' + table + ' > tbody.' + category);
	if (!tbody.length)
	{
		tbody = $('<tbody class="' + category + '"/>');
		$('#' + table).append(tbody);
		tbody.append('<tr><th colspan="3">' + categories[category] + '</th></tr>');
	}
	
	// adding row for benchmark
	var tr = $('<tr />');
	tbody.append(tr);
	if (isreference)
		tr.addClass('reference');
	var button = $('<input type="button" value="&#8594;" />');
	tr.append('<td>' + description + '</td>');
	var td_button = $('<td></td>');
	tr.append(td_button);
	td_button.append(button);
	var timecell = $('<td />');
	tr.append(timecell);
	var arrowcell = $('<td class="arrow" />');
	tr.append(arrowcell);
	
	var arrowspan = $('#arrow');
	if (!arrowspan.length)
	{
		arrowspan = $('<span id="arrow">&#8594;</span>');
		arrowspan.hide();
		arrowcell.append(arrowspan);
	}
	
	button.click(function()
	{
		benchmark_cycles = $('#count').val();
		var start = new Date();
		var result = callback();
		var end = new Date();
		timecell.text(String(end - start) + " ms");
		arrowcell.append(arrowspan);
		arrowspan.show();

		$('#result').css('top', tbody.offset().top);		
		build_table($('#result'), result);
	});
}

// ad hoc table builder
function build_table(dest, data)
{
	dest.empty();
	
	// head
	var colgroup = $('<colgroup />');
	dest.append(colgroup);
	var thead = $('<thead><tr></tr></thead>');
	dest.append(thead);
	for (idx in data)
	{
		for (key in data[idx])
		{
			colgroup.append('<col />');
			thead.append('<th>' + key + '</th>');
		}
		break;
	}
	
	// body
	var tbody = $('<tbody></tbody>');
	dest.append(tbody);
	for (idx in data)
	{
		var tr = $('<tr />');
		tbody.append(tr);
		for (key in data[idx])
		{
			var td = $('<td />');
			tr.append(td);
			td.append(data[idx][key]);
		}
	}
}

// registering benchmarks on document ready
$(function()
{
	// Exact search on 77 rows
	
	register_benchmark('small', 'exact_search77', "jOrder.table.where()", function()
	{
		var hits;
		for (var i = 0; i < benchmark_cycles; i++)
			hits = table_indexed.where([{ 'GroupID': 107 }, { 'GroupID': 185 }], { renumber: true });
		return hits;
	});

	register_benchmark('small', 'exact_search77', "jLinq.from().equals()*", function()
	{
		var hits;
		for (var i = 0; i < benchmark_cycles; i++)
			hits = jLinq.from(jorder_benchmark_data77).equals('GroupID', 107).or(185).select();
		return hits;
	}, true);

	register_benchmark('small', 'exact_search77', "Row by row iteration", function()
	{
		var hits;
		for (var i = 0; i < benchmark_cycles; i++)
			hits = table_unindexed.filter(function(row)
				{
					return row.GroupID == 107 || row.GroupID == 185;
				});
		return hits;
	}, true);

	// Exact search on composite index search
	
	register_benchmark('small', 'composite_search77', "jOrder.table.where()", function()
	{
		var hits;
		for (var i = 0; i < benchmark_cycles; i++)
			hits = table_indexed.where([{ 'Currency': 'USD', 'Total': 8 }], { renumber: true });
		return hits;
	});
	
	register_benchmark('small', 'composite_search77', "jLinq.from().equals()*", function()
	{
		var hits;
		for (var i = 0; i < benchmark_cycles; i++)
			hits = jLinq.from(jorder_benchmark_data77).equals('Currency', 'USD').and('Total', 8).select();
		return hits;
	}, true);

	register_benchmark('small', 'composite_search77', "Row by row iteration", function()
	{
		var hits;
		for (var i = 0; i < benchmark_cycles; i++)
			hits = table_unindexed.filter(function(row)
				{
					return row.Currency == 'USD' && row.Total == 8;
				});
		return hits;
	}, true);

	// Exact search on 1000 rows

	register_benchmark('large', 'exact_search1000', "jOrder.table.where()", function()
	{
		var hits;
		for (var i = 0; i < benchmark_cycles; i++)
			hits = table1000_indexed.where([{ 'id': 107 }, { 'id': 115 }]);
		return hits;
	});

	register_benchmark('large', 'exact_search1000', "jLinq.from().equals()*", function()
	{
		var hits;
		for (var i = 0; i < benchmark_cycles; i++)
			hits = jLinq.from(jorder_benchmark_data1000).equals('id', 107).or(115).select();
		return hits;
	}, true);

	register_benchmark('large', 'exact_search1000', "Row by row iteration", function()
	{
		var hits;
		for (var i = 0; i < benchmark_cycles; i++)
			hits = table1000_unindexed.filter(function(row)
				{
					return row.id == 107 || row.id == 115;
				});
		return hits;
	}, true);

	// Range search on 77 rows
	
	register_benchmark('small', 'range_search77', "jOrder.table.where()", function()
	{
		var hits;
		for (var i = 0; i < benchmark_cycles; i++)
			hits = table_indexed.where([{ 'Total': { lower: 11, upper: 15 } }], { mode: jOrder.range });
		return hits;
	});

	register_benchmark('small', 'range_search77', "jLinq.from().between()*", function()
	{
		var hits;
		for (var i = 0; i < benchmark_cycles; i++)
			hits = jLinq.from(jorder_benchmark_data77).between('Total', 11, 15).select();
		return hits;
	}, true);

	register_benchmark('small', 'range_search77', "Row by row iteration", function()
	{
		var hits;
		for (var i = 0; i < benchmark_cycles; i++)
			hits = table_unindexed.filter(function(row)
				{
					return row.Total >= 11 && row.Total <= 15;
				});
		return hits;
	}, true);
	
	// Range search on 1000 rows

	register_benchmark('large', 'range_search1000', "jOrder.table.where()", function()
	{
		var hits;
		for (var i = 0; i < benchmark_cycles; i++)
			hits = table1000_indexed.where([{ 'id': { lower: 203, upper: 315 } }], { mode: jOrder.range, renumber: true });
		return hits;
	});

	register_benchmark('large', 'range_search1000', "jLinq.from().between()*", function()
	{
		var hits;
		for (var i = 0; i < benchmark_cycles; i++)
			hits = jLinq.from(jorder_benchmark_data1000).between('id', 203, 315).select();
		return hits;
	}, true);

	register_benchmark('large', 'range_search1000', "Row by row iteration", function()
	{
		var hits;
		for (var i = 0; i < benchmark_cycles; i++)
			hits = table1000_unindexed.filter(function(row)
				{
					return row.id >= 203 && row.id <= 315;
				});
		return hits;
	}, true);

	// Range search on 1000 rows with limit
	
	register_benchmark('large', 'range_search_page1000', "jOrder.table.where()", function()
	{
		var hits;
		for (var i = 0; i < benchmark_cycles; i++)
			hits = table1000_indexed.where([{ 'id': { lower: 203, upper: 315 } }],
			{
				mode: jOrder.range,
				renumber: true,
				offset: 20,
				limit: 20
			});
		return hits;
	});

	register_benchmark('large', 'range_search_page1000', "jLinq.from()between().skipTake()*", function()
	{
		var hits;
		for (var i = 0; i < benchmark_cycles; i++)
			hits = jLinq.from(jorder_benchmark_data1000).between('id', 203, 315).skipTake(20, 20);
		return hits;
	}, true);

	// Freetext search on 1000 rows
	
	register_benchmark('large', 'freetext_search1000', "jOrder.table.where()", function()
	{
		var hits;
		for (var i = 0; i < benchmark_cycles; i++)
			hits = table1000_indexed.where([{ 'name': 'con' }], { mode: jOrder.startof, indexName: 'fulltext' });
		return hits;
	});

	register_benchmark('large', 'freetext_search1000', "jLinq.from().match()*", function()
	{
		var hits;
		for (var i = 0; i < benchmark_cycles; i++)
			hits = jLinq.from(jorder_benchmark_data1000).match('name', '\\bcon').select();
		return hits;
	}, true);

	register_benchmark('large', 'freetext_search1000', "Row by row iteration", function()
	{
		var hits;
		for (var i = 0; i < benchmark_cycles; i++)
			hits = table1000_unindexed.filter(function(row)
				{
					return null != row.name.match(/\bcon/i);
				});
		return hits;
	}, true);
	
	// Sorting on 77 rows
	
	register_benchmark('small', 'sorting77', "jOrder.table.orderby()", function()
	{
		var hits;
		for (var i = 0; i < benchmark_cycles; i++)
			hits = table_indexed.orderby(['ID'], jOrder.asc, { indexName: 'id' });
		return hits;
	});

	register_benchmark('small', 'sorting77', "jLinq.from().orderBy()*", function()
	{
		var hits;
		for (var i = 0; i < benchmark_cycles; i++)
			hits = jLinq.from(jorder_benchmark_data77).orderBy('ID').select();
		return hits;
	}, true);

	register_benchmark('small', 'sorting77', "Row by row iteration", function()
	{
		var hits;
		for (var i = 0; i < benchmark_cycles; i++)
			hits = jOrder.copyTable(table_indexed.flat()).sort(function(a, b)
			{
				return a.ID > b.ID ? 1 : a.ID < b.ID ? -1 : 0;
			});
		return hits;
	}, true);
	
	// Sorting on 1000 rows

	register_benchmark('large', 'sorting1000', "jOrder.table.orderby()", function()
	{
		var hits;
		for (var i = 0; i < benchmark_cycles; i++)
			hits = table1000_indexed.orderby(['name'], jOrder.asc, { indexName: 'name' });
		return [{length: hits.length}];
	});	
	
	register_benchmark('large', 'sorting1000', "jLinq.from().orderBy()*", function()
	{
		var hits;
		for (var i = 0; i < benchmark_cycles; i++)
			hits = jLinq.from(jorder_benchmark_data1000).orderBy('name').select();
		return [{length: hits.length}];
	}, true);

	register_benchmark('large', 'sorting1000', "Row by row iteration", function()
	{
		var hits;
		for (var i = 0; i < benchmark_cycles; i++)
			hits = jOrder.copyTable(table1000_indexed.flat()).sort(function(a, b)
			{
				return a.name > b.name ? 1 : a.name < b.name ? -1 : 0;
			});
		return [{length: hits.length}];
	}, true);

	// Sorting on 1000 rows, limited
	
	register_benchmark('large', 'sorting_page1000', "jOrder.table.orderby()", function()
	{
		var hits;
		for (var i = 0; i < benchmark_cycles; i++)
			hits = table1000_indexed.orderby(['name'], jOrder.asc, { indexName: 'name', offset: 0, limit: 20 });
		return hits;
	});	
	
	register_benchmark('large', 'sorting_page1000', "Same as previous but row id=345 removed first", function()
	{
		table1000_indexed.remove([{ id: 345 }]);
		var hits;
		for (var i = 0; i < benchmark_cycles; i++)
			hits = table1000_indexed.orderby(['name'], jOrder.asc, { indexName: 'name', offset: 0, limit: 20 });
		return hits;
	});	
	
	register_benchmark('large', 'sorting_page1000', "jLinq.from()orderBy().take()*", function()
	{
		var hits;
		for (var i = 0; i < benchmark_cycles; i++)
			hits = jLinq.from(jorder_benchmark_data1000).orderBy('name').take(20);
		return hits;
	}, true);

	// Grouping
	
	register_benchmark('small', 'aggregate77', "Summing on field 'Total'", function()
	{
		function init(next)
		{
			next.Total = 0;
			return next;
		}
	
		function iterate(aggregated, next)
		{
			aggregated.Total += next.Total;
			return aggregated;
		}

		var summed;
		for (var i = 0; i < benchmark_cycles; i++)
			summed = table_indexed.aggregate('group', init, iterate);
		return summed;
	});
	
	// General

	register_benchmark('general', 'array', "Using Array.push()", function()
	{
		var result = [];
		for (var i = 0; i < benchmark_cycles; i++)
			for (var idx in jorder_benchmark_data77)
				result.push(jorder_benchmark_data77[idx]);
		return [{length: result.length}];
	});
	
	register_benchmark('general', 'array', "Using Array.concat()", function()
	{
		var result = [];
		for (var i = 0; i < benchmark_cycles; i++)
			result = result.concat(jorder_benchmark_data77);
		return [{length: result.length}];
	});

	register_benchmark('general', 'array', "Using Array.splice()", function()
	{
		var result = [];
		for (var i = 0; i < benchmark_cycles; i++)
			for (var idx in jorder_benchmark_data77)
				result.splice(result.length - 1, 0, jorder_benchmark_data77[idx]);
		return [{length: result.length}];
	});

	jOrder.logging = false;
});

