////////////////////////////////////////////////////////////////////////////////
// jOrder index signature
// Base class for index objects: lookup and order
////////////////////////////////////////////////////////////////////////////////
/*global jOrder, escape */

// - fields: array of strings representing table fields
// - options: grouped, sorted, data type
//	 - type: jOrder.string, jOrder.number, jOrder.text, jOrder.array
jOrder.signature = function (constants, logging) {
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
			case constants.text:
				throw "Can't create a text index on more than one field.";
			case constants.number:
				throw "Can't create a number index on more than one field.";
			}
		}

		var self = {
			options: options,

			// generates or validates a signature based on index
			// - row: row to be validated against index
			signature: function (row) {
				// returning signature
				if (!row) {
					return escape(fields.join('_'));
				}
				// validating row
				// all fields of the index must be present in the row
				var i;
				for (i = 0; i < fields.length; i++) {
					if (!row.hasOwnProperty(fields[i])) {
						// fail early
						return false;
					}
				}
				return true;
			},
				
			// extracts key associated with a row according to index definition
			// for lookup purposes
			// - row: data row to extract keys from
			key: function (row) {
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
				// extracting multiple keys from array type
				if (constants.array === self.options.type) {
					return row[fields[0]];
				}
				// extracting multiple keys from text type
				if (constants.text === self.options.type) {
					return row[fields[0]].split(' ');
				}
				// extracting one (composite) key from any other type
				var key = self.key(row);
				return key ? [key] : [];
			}
		};

		return self;
	};
}(jOrder.constants,
	jOrder.logging);
