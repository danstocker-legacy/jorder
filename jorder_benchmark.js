// table with 77 rows and several columns
var table_indexed = jOrder(jorder_benchmark_data77)
    .index('id', ['ID'], { ordered: true })
    .index('id_nosort', ['ID'])
    .index('group', ['GroupID'], { ordered: true, grouped: true })
    .index('total', ['Total'], { ordered: true, grouped: true })
    .index('date', ['StartDate'], { ordered: true, grouped: true });
var table_unindexed = jOrder(jorder_benchmark_data77);

// table with 1000 rows and 2 columns
var table1000_indexed = jOrder(jorder_benchmark_data1000)
	.index('id', ['id'], { ordered: true, type: jOrder.number })
    .index('name', ['name'], { ordered: true, grouped: true });
var table1000_unindexed = jOrder(jorder_benchmark_data1000);

// testing explicit, implicit and no index searching
// benchmark for 1000 cycles shows (logging turned off):
// - explicit_index:    ~1x
// - implicit_index:    ~1.5x
// - no_index:          ~9x
function jorder_benchmark_where(benchmark_cycles)
{
	function jlinq_where()
	{
	    for (var i = 0; i < benchmark_cycles; i++)
	        var hits = jLinq.from(jorder_benchmark_data77).equals('GroupID', '107').or('185').select();
	}

	function jorder_where_explicit()
	{
	    for (var i = 0; i < benchmark_cycles; i++)
	        var hits = table_indexed.where([{ 'GroupID': 107 }, { 'GroupID': 185 }], { indexName: 'group' });
	}

	function jorder_where_implicit()
	{
		for (var i = 0; i < benchmark_cycles; i++)
			var hits = table_indexed.where([{ 'GroupID': 107 }, { 'GroupID': 185 }]);
	}

	function jorder_where_no_index()
	{
		for (var i = 0; i < benchmark_cycles; i++)
			var hits = table_unindexed.where([{ 'GroupID': 107 }, { 'GroupID': 185 }]);
	}

    //jlinq_where();
	jorder_where_explicit();
	jorder_where_implicit();
	jorder_where_no_index();
}

function jorder_benchmark1000_where(benchmark_cycles)
{
	function jorder_where1000_explicit()
	{
	    for (var i = 0; i < benchmark_cycles; i++)
	        var hits = table1000_indexed.where([{ 'id': 107 }, { 'id': 115 }], { indexName: 'id' });
	}

	function jorder_where1000_implicit()
	{
		for (var i = 0; i < benchmark_cycles; i++)
			var hits = table1000_indexed.where([{ 'id': 107 }, { 'id': 115 }]);
	}

	function jorder_where1000_no_index()
	{
		for (var i = 0; i < benchmark_cycles; i++)
			var hits = table1000_unindexed.where([{ 'id': 107 }, { 'id': 115 }]);
	}

	jorder_where1000_explicit();
	jorder_where1000_implicit();
	jorder_where1000_no_index();
}

// testing range search
function jorder_benchmark_range(benchmark_cycles)
{
	function jorder_range_implicit()
	{
	    for (var i = 0; i < benchmark_cycles; i++)
	        var hits = table_indexed.where([{ 'Total': { lower: 11, upper: 15 } }], { mode: jOrder.range });
	}

	function jorder_range_no_index()
	{
	    for (var i = 0; i < benchmark_cycles; i++)
	        var hits = table_unindexed.where([{ 'Total': { lower: 11, upper: 15 } }], { mode: jOrder.range });
	}
	
	jorder_range_implicit();
	jorder_range_no_index();
}

function jorder_benchmark1000_range(benchmark_cycles)
{
	function jorder_range1000_implicit()
	{
	    for (var i = 0; i < benchmark_cycles; i++)
	        var hits = table1000_indexed.where([{ 'id': { lower: 203, upper: 215 } }], { mode: jOrder.range });
	}

	function jorder_range1000_no_index()
	{
	    for (var i = 0; i < benchmark_cycles; i++)
	        var hits = table1000_unindexed.where([{ 'id': { lower: 203, upper: 215 } }], { mode: jOrder.range });
	}
	
	jorder_range1000_implicit();
	jorder_range1000_no_index();
}

// testing start-of test search
function jorder_benchmark_start(benchmark_cycles)
{
	function jorder_start_implicit()
	{
	    for (var i = 0; i < benchmark_cycles; i++)
	        var hits = table_indexed.where([{ 'StartDate': '2' }], { mode: jOrder.startof });
	}

	function jorder_start_no_index()
	{
	    for (var i = 0; i < benchmark_cycles; i++)
	        var hits = table_unindexed.where([{ 'StartDate': '2' }], { mode: jOrder.startof });
	}

	jorder_start_implicit();
	jorder_start_no_index();
}

function jorder_benchmark1000_start(benchmark_cycles)
{
	function jorder_start1000_implicit()
	{
	    for (var i = 0; i < benchmark_cycles; i++)
	        var hits = table1000_indexed.where([{ 'name': 'Compil' }], { mode: jOrder.startof });
	}

	function jorder_start1000_no_index()
	{
	    for (var i = 0; i < benchmark_cycles; i++)
	        var hits = table1000_unindexed.where([{ 'name': 'Compil' }], { mode: jOrder.startof });
	}

	jorder_start1000_implicit();
	jorder_start1000_no_index();
}

// testing aggregation by summing table along
// result for 1000 cycles (logging turned off): about the same as an unindexed search
// pretty much the same as a linear search, since we need to process every
// single row in the table
function jorder_benchmark_aggregate(benchmark_cycles)
{
	function init(next)
	{
		next.MaxNumOfHost = 0;
		return next;
	}

	function iterate(aggregated, next)
	{
		aggregated.MaxNumOfHost += next.MaxNumOfHost;
		return aggregated;
	}

	for (var i = 0; i < benchmark_cycles; i++)
		var summed = table_indexed.aggregate('group', init, iterate);
}

// testing ordering speed
// benchmark for 1000 cycles shows (logging turned off):
// - ordered_index:     ~1x
// - nonordered_index:  ~12x
function jorder_benchmark_orderby(benchmark_cycles)
{
	function jorder_orderby_ordered_explicit()
	{
	    for (var i = 0; i < benchmark_cycles; i++)
	        table_indexed.orderby(['ID'], jOrder.asc, { indexName: 'id' });
	}

	function jorder_orderby_unordered_explicit()
	{
	    for (var i = 0; i < benchmark_cycles; i++)
	        table_indexed.orderby(['ID'], jOrder.asc, { indexName: 'id_nosort' });
	}

	jorder_orderby_ordered_explicit();
	jorder_orderby_unordered_explicit();
}

