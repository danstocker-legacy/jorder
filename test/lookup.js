////////////////////////////////////////////////////////////////////////////////
// Unit tests for jOrder index
////////////////////////////////////////////////////////////////////////////////
/*global console, jOrder, module, test, ok, equal, deepEqual, raises */

jOrder.testing = function (testing, jOrder) {
	// Data integrity tests
	testing.lookup = function () {
		module("Lookup");

		var 
		
		// test indexes
		string = jOrder.index(testing.jsonX, ['author']),
		string_multi = jOrder.index(testing.jsonX, ['author', 'volumes']),
		number = jOrder.index(testing.jsonX, ['volumes'], {type: jOrder.number, grouped: true}),
		array = jOrder.index(testing.jsonX, ['data'], {type: jOrder.array, grouped: true}),
		text = jOrder.index(testing.jsonX, ['title'], {type: jOrder.text, grouped: true});

		test("Lookup", function () {
			var rows = [];
			rows[0] = {'author': 'Asimov'};
			rows[3] = {'author': 'Milne'};
			deepEqual(string.lookup([{'author': 'INVALID'}]), [], "Lookup of ABSENT data yields empty set");
			deepEqual(string.lookup(rows), [2, 1], "Looking up sparse set on single field index");
			deepEqual(string_multi.lookup([{'author': 'Tolkien', 'volumes': 3}]), [0], "Looking up single row on COMPOSITE index");
			deepEqual(array.lookup([{'data': 1}]), [1, 2], "Lookup in ARRAY type field may return multiple hits");
			deepEqual(text.lookup([{'title': 'the'}]), [0, 1], "Lookup in TEXT type field may return multiple hits");
		});
		
		test("Addition exceptions", function () {
			raises(function () {
				jOrder.index(testing.jsonX, ['author'])
					.add({'foo': 'bar'}, 0, false);
			}, "Adding unmatched field raises exception");
			raises(function () {
				jOrder.index(testing.jsonX, ['author'])
					.add({'author': 'Tolkien'}, 0, false)
					.add({'author': 'Tolkien'}, 1, false);
			}, "Adding same value to an unique index again raises exception");
		});
		
		test("Removal exceptions", function () {
			raises(function () {
				number.remove(testing.jsonX[1]);
			}, "Deleting from grouped index without specifying row ID raises exception");
			raises(function () {
				string.remove({'foo': 'bar'}, 0);
			}, "Removing unmatched field raises exception");
		});
		
		test("Modifying lookup", function () {
			var expected;

			//////////////////////////////
			// unique index (string type)

			expected = {
				'Tolkien': 0
			};

			// addition
			string
				.unbuild()
				.add(testing.jsonX[0], 0, false);
			deepEqual(string.flat(), expected, "Adding value to UNIQUE index");

			// removal
			string
				.rebuild()
				.remove(testing.jsonX[2], 2)
				.remove(testing.jsonX[1], 1);
			deepEqual(string.flat(), expected, "Removing values from UNIQUE index");				
			
			//////////////////////////////
			// grouped index (numeric type)

			expected = {
				'1': {items: {1: 1, 2: 2}, count: 2}
			};

			// addition
			number
				.unbuild()
				.add(testing.jsonX[1], 1, false)
				.add(testing.jsonX[2], 2, false);
			deepEqual(number.flat(), expected, "Adding values to GROUPED index");

			// removal
			number
				.rebuild()
				.remove(testing.jsonX[0], 0);
			deepEqual(number.flat(), expected, "Removing value from GROUPED index");
			
			//////////////////////////////
			// grouped index (array type)
			
			expected = {
				'99': {items: {'2': 2}, count: 1},
				'1': {items: {'2': 2}, count: 1}			
			};
			
			// addition
			array
				.unbuild()
				.add(testing.jsonX[2], 2, false);
			deepEqual(array.flat(), expected, "Adding value to grouped index of ARRAY type");
			
			// removal
			array
				.rebuild()
				.remove(testing.jsonX[0], 0)
				.remove(testing.jsonX[1], 1);
			deepEqual(array.flat(), expected, "Removing values from grouped index of ARRAY type");			

			//////////////////////////////
			// grouped index (text type)
			
			expected = {
				'Winnie': {items: {'1': 1}, count: 1},
				'the': {items: {'1': 1}, count: 1},
				'Pooh': {items: {'1': 1}, count: 1}
			};
			
			// addition
			text
				.unbuild()
				.add(testing.jsonX[1], 1, false);
			deepEqual(text.flat(), expected, "Adding value to grouped index of TEXT type");
			
			// removal
			text
				.rebuild()
				.remove(testing.jsonX[0], 0)
				.remove(testing.jsonX[2], 2);
			deepEqual(text.flat(), expected, "Removing values from grouped index of TEXT type");
		});
	}();
	
	return testing;
}(jOrder.testing,
	jOrder);

