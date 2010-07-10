// table that has group index on it
var table_indexed = new jOrder.table(jorder_benchmark_data);
table_indexed.index('id', ['ID'], { ordered: true });
table_indexed.index('id_nosort', ['ID']);
table_indexed.index('group', ['GroupID'], { ordered: true, grouped: true });

// table with no group index
var table_unindexed = new jOrder.table(jorder_benchmark_data);

// testing explicit, implicit and no index searching
// benchmark for 1000 cycles shows (logging turned off):
// - explicit_index:    ~1x
// - implicit_index:    ~1.5x
// - no_index:          ~9x
function jorder_benchmark_where(benchmark_cycles)
{
	function jorder_explicit_index()
	{
		for (var i = 0; i < benchmark_cycles; i++)
			var hits = table_indexed.where([{ 'GroupID': 107 }, { 'GroupID': 185}], 'group');
	}

	function jorder_implicit_index()
	{
		for (var i = 0; i < benchmark_cycles; i++)
			var hits = table_indexed.where([{ 'GroupID': 107 }, { 'GroupID': 185}]);
	}

	function jorder_no_index()
	{
		for (var i = 0; i < benchmark_cycles; i++)
			var hits = table_unindexed.where([{ 'GroupID': 107 }, { 'GroupID': 185}]);
	}

	jorder_explicit_index();
	jorder_implicit_index();
	jorder_no_index();
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
// - nonordered_index:  ~14x
function jorder_benchmark_orderby(benchmark_cycles)
{
	function jorder_ordered_index()
	{
		for (var i = 0; i < benchmark_cycles; i++)
			table_indexed.orderby(['ID'], jOrder.asc, 'id');
	}

	function jorder_unordered_index()
	{
		for (var i = 0; i < benchmark_cycles; i++)
			table_indexed.orderby(['ID'], jOrder.asc, 'id_nosort');
	}

	jorder_ordered_index();
	jorder_unordered_index();
}

