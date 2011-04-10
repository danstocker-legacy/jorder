////////////////////////////////////////////////////////////////////////////////
// jOrder index signature
// Base class for index objects: lookup and order
////////////////////////////////////////////////////////////////////////////////
/*global jOrder, escape */

jOrder.signature = function ($constants, $core, $logging) {
	// - fields: array of strings representing table fields
	// - options: grouped, sorted, data type
	//	 - type: jOrder.string, jOrder.number, jOrder.text, jOrder.array
	return function (fields, options) {
		// check presence
		if (typeof fields === 'undefined' || !fields.length) {
			throw "No field(s) specified";
		}

		// default options		
		options = options || {};
	
		// check consistency
		if (fields.length > 1) {
			switch (options.type) {
			case $constants.text:
				throw "Can't create a text index on more than one field.";
			case $constants.number:
				throw "Can't create a number index on more than one field.";
			}
		}

		var self = {
			options: options,

			// generates or validates a signature based on index
			// - row: row to be validated against index
			// - strict: specifies checking direction (row -> index or index -> row)
			signature: function (row, strict) {
				// returning signature
				if (!row) {
					return escape(fields.join('_'));
				}
				// validating row
				var i, lookup;
				if (strict) {
					// all fields of the roe must be present in the index
					lookup = $core.join(fields, []);
					for (i in row) {
						if (row.hasOwnProperty(i) && !lookup.hasOwnProperty(i)) {
							return false;
						}
					}
				} else {
					// all fields of the index must be present in the row
					for (i = 0; i < fields.length; i++) {
						if (!row.hasOwnProperty(fields[i])) {
							// fail early
							return false;
						}
					}
				}
				return true;
			},
				
			// extracts key associated with a row according to index definition
			// for lookup purposes
			// - row: data row to extract keys from
			key: function (row) {
				// extracting numeric key
				if (self.options.type === $constants.number) {
					return row[fields[0]];
				}
				// extracting one (composite) key from any other type
				var key = [],
						i, field;
				for (i = 0; i < fields.length; i++) {
					field = fields[i];
					if (!row.hasOwnProperty(field)) {
						return undefined;
					}
					key.push(row[field]);
				}
				return escape(key.join('_'));
			},

			// extracts one or more key values associated with a row
			// according to index definition
			// - row: data row to extract keys from
			keys: function (row) {
				switch (self.options.type) {
				case $constants.array:
					// returning first field as is (already array)
					return row[fields[0]];
				case $constants.text:
					// extracting multiple keys by splitting along spaces
					return row[fields[0]].split(/\s+/g);
				default:
				case $constants.number:
				case $constants.string:
					// extracting one (composite) key from any other type
					var key = self.key(row);
					return typeof key !== 'undefined' ? [key] : [];
				}
			}
		};

		return self;
	};
}(jOrder.constants,
	jOrder.core,
	jOrder.logging);
