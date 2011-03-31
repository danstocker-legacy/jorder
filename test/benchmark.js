// env variables
var cycles = 10;
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
};

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

// function that registers a benchmark function on the page
function register_benchmark(table, category, description, callback, options)
{
	options = options || {};
	
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
	if (options.isreference){
		tr.addClass('reference');
	}
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
		var result;
		var idx;

		// parameters
		var cycles = $('#count').val();
		var timeout = $('#timeout').val();
		var unit = $('#units').attr('checked') ? " ms" : "";
		var estimate = $('#estimate').attr('checked');
		
		// run benchmark n times
		var start = new Date();
		for (idx = 0; idx < cycles; idx++)
		{
			result = callback();
			if (timeout < new Date() - start){
				break;
			}
		}
		var end = new Date();
		
		// handle timeout
		if (idx < cycles)
		{
			timecell.text(estimate ?
				String(Math.floor(timeout * cycles / idx)) + unit :
				"timeout (" + Math.floor(100 * idx / cycles) + "%)");
			arrowspan.hide();
			$('#result').empty();
				return;
		}
		
		// display measured time & results
		timecell.text(String(end - start) + unit);
		arrowcell.append(arrowspan);
		arrowspan.show();

		$('#result').css('top', tbody.offset().top);		
		build_table($('#result'), options.lengthonly ? [{ length: result.length }] : result);
	});
}

// registering benchmarks on document ready
$(function()
{
	// Exact search on 77 rows
	
	register_benchmark('small', 'exact_search77', "jOrder.table.where()", function()
	{
		return jOrder.test.table77.where([{ 'GroupID': 107 }, { 'GroupID': 185 }], { renumber: true });
	});

	register_benchmark('small', 'exact_search77', "Row by row iteration", function()
	{
		return jOrder.test.table77n.filter(function(row)
		{
			return row.GroupID == 107 || row.GroupID == 185;
		});
	}, { isreference: true });

	// Exact search on composite index search
	
	register_benchmark('small', 'composite_search77', "jOrder.table.where()", function()
	{
		return jOrder.test.table77.where([{ 'Currency': 'USD', 'Total': 8 }], { renumber: true });
	});
	
	register_benchmark('small', 'composite_search77', "Row by row iteration", function()
	{
		return jOrder.test.table77n.filter(function(row)
		{
			return row.Currency == 'USD' && row.Total == 8;
		});
	}, { isreference: true });

	// Exact search on 1000 rows

	register_benchmark('large', 'exact_search1000', "jOrder.table.where()", function()
	{
		return jOrder.test.table1000.where([{ 'id': 107 }, { 'id': 115 }]);
	});

	register_benchmark('large', 'exact_search1000', "Row by row iteration", function()
	{
		return jOrder.test.table1000n.filter(function(row)
		{
			return row.id == 107 || row.id == 115;
		});
	}, { isreference: true });

	// Range search on 77 rows
	
	register_benchmark('small', 'range_search77', "jOrder.table.where()", function()
	{
		return jOrder.test.table77.where([{ 'Total': { lower: 11, upper: 15 } }], { mode: jOrder.range });
	});

	register_benchmark('small', 'range_search77', "Row by row iteration", function()
	{
		return jOrder.test.table77n.filter(function(row)
		{
			return row.Total >= 11 && row.Total <= 15;
		});
	}, { isreference: true });
	
	// Range search on 1000 rows

	register_benchmark('large', 'range_search1000', "jOrder.table.where()", function()
	{
		return jOrder.test.table1000.where([{ 'id': { lower: 203, upper: 315 } }], { mode: jOrder.range, renumber: true, limit: 1000 });
	});

	register_benchmark('large', 'range_search1000', "Row by row iteration", function()
	{
		return jOrder.test.table1000n.filter(function(row)
		{
			return row.id >= 203 && row.id <= 315;
		});
	}, { isreference: true });

	// Range search on 1000 rows with limit
	
	register_benchmark('large', 'range_search_page1000', "jOrder.table.where()", function()
	{
		return jOrder.test.table1000.where([{ 'id': { lower: 203, upper: 315 } }],
		{
			mode: jOrder.range,
			renumber: true,
			offset: 20,
			limit: 20
		});
	});

	// Freetext search on 1000 rows
	
	register_benchmark('large', 'freetext_search1000', "jOrder.table.where()", function()
	{
		return jOrder.test.table1000.where([{ 'name': 'con' }], { mode: jOrder.startof, indexName: 'fulltext', limit: 1000 });
	});

	register_benchmark('large', 'freetext_search1000', "Row by row iteration", function()
	{
		return jOrder.test.table1000n.filter(function(row)
		{
			return null !== row.name.match(/\bcon/i);
		});
	}, { isreference: true });
	
	// Sorting on 77 rows
	
	register_benchmark('small', 'sorting77', "jOrder.table.orderby()", function()
	{
		return jOrder.test.table77.orderby(['ID'], jOrder.asc, { indexName: 'id' });
	});

	register_benchmark('small', 'sorting77', "Row by row iteration", function()
	{
		return jOrder.copyTable(jOrder.test.table77.flat()).sort(function(a, b)
		{
			return a.ID > b.ID ? 1 : a.ID < b.ID ? -1 : 0;
		});
	}, { isreference: true });
	
	// Sorting on 1000 rows

	register_benchmark('large', 'sorting1000', "jOrder.table.orderby()", function()
	{
		return jOrder.test.table1000.orderby(['name'], jOrder.asc, { indexName: 'name' });
	}, { lengthonly: true });	
	
	register_benchmark('large', 'sorting1000', "Row by row iteration", function()
	{
		return jOrder.copyTable(jOrder.test.table1000.flat()).sort(function(a, b)
		{
			return a.name > b.name ? 1 : a.name < b.name ? -1 : 0;
		});
	}, { isreference: true, lengthonly: true });

	// Sorting on 1000 rows, limited
	
	register_benchmark('large', 'sorting_page1000', "jOrder.table.orderby()", function()
	{
		return jOrder.test.table1000.orderby(['name'], jOrder.asc, { indexName: 'name', offset: 0, limit: 20 });
	});	
	
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
		for (var i = 0; i < cycles; i++){
			summed = jOrder.test.table77.aggregate('group', init, iterate);
		}
		return summed;
	});
	
	jOrder.logging = false;
});

