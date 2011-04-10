////////////////////////////////////////////////////////////////////////////////
// jOrder constants
////////////////////////////////////////////////////////////////////////////////
/*global jOrder */

jOrder.constants = function ($core) {
	return $core.delegate({
		// version
		name: "jOrder",
		
		// sorting directions
		asc: 1,
		desc: -1,
		
		// index types
		string: 0,
		number: 1,
		text: 2,
		array: 3,
		
		// range params
		start: 0,
		end: 1,
		
		// search modes
		exact: 0,
		range: 1,
		startof: 2
	});
}(jOrder.core);

