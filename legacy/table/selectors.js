////////////////////////////////////////////////////////////////////////////////
// jOrder index object
////////////////////////////////////////////////////////////////////////////////
/*global jOrder */

jOrder.selectors = function ($core) {
	// selectors used in table.filter()
	return {
		// selects exact matches
		// handles multiple conditions
		exact: function (row, data) {
			var match = false,
					partial, condition,
					i, field;
			for (i = 0; i < data.conditions.length; i++) {
				partial = true;
				condition = data.conditions[i];
				for (field in condition) {
					if (condition.hasOwnProperty(field)) {
						partial &= (condition[field] === row[field]);
						if (!partial) {
							break;
						}
					}
				}
				match |= partial;
				if (match) {
					break;
				}
			}
			return match;
		},
		
		// selectes start of word matches
		// only first condition is processed
		startof: function (row, data) {
			var kv = $core.split(data.conditions[0]);
			return row[kv.keys[0]].indexOf(kv.values[0]) === 0;
		},
		
		// selects range of values
		// only first condition is processed
		range: function (row, data) {
			var kv = $core.split(data.conditions[0]),
					bounds = kv.values[0],
					field = kv.keys[0];
			return bounds.lower <= row[field] && bounds.upper > row[field];
		}
	};
}(jOrder.core);

