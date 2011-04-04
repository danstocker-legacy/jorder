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
		
		test("Index building exceptions", function () {
			raises(function () {
				jOrder.index(testing.jsonX, ['author'])
					.add({'foo': 'bar'}, 0, false);
			}, "Adding unmatching field raises exception");
			raises(function () {
				jOrder.index(testing.jsonX, ['author'])
					.add({'author': 'Tolkien'}, 0, false)
					.add({'author': 'Tolkien'}, 1, false);
			}, "Adding same value to an unique index again raises exception");
		});
		
		test("Building lookup", function () {
			var expected,

			string_unbuilt = jOrder.index(testing.jsonX, ['author'], {build: false}),
			number_unbuilt = jOrder.index(testing.jsonX, ['volumes'], {type: jOrder.number, grouped: true, build: false}),
			array_unbuilt = jOrder.index(testing.jsonX, ['data'], {type: jOrder.array, grouped: true, build: false}),
			text_unbuilt = jOrder.index(testing.jsonX, ['title'], {type: jOrder.text, grouped: true, build: false});

			// unique index (string type)
			expected = {
				'Tolkien': 0
			};
			string_unbuilt.add(testing.jsonX[0], 0, false);
			deepEqual(string_unbuilt.flat(), expected, "Adding value to UNIQUE index");
			
			// grouped index (numeric tyoe)
			expected = {
				'1': {items: {1: 1, 2: 2}, count: 2}
			};
			number_unbuilt.add(testing.jsonX[1], 1, false);
			number_unbuilt.add(testing.jsonX[2], 2, false);
			deepEqual(number_unbuilt.flat(), expected, "Adding value to GROUPED index");
			
			// grouped index (array type)
			expected = {
				'99': {items: {'2': 2}, count: 1},
				'1': {items: {'2': 2}, count: 1}			
			};
			array_unbuilt.add(testing.jsonX[2], 2, false);
			deepEqual(array_unbuilt.flat(), expected, "Adding value to grouped index of ARRAY type");

			// grouped index (array type)
			expected = {
				'Winnie': {items: {'1': 1}, count: 1},
				'the': {items: {'1': 1}, count: 1},
				'Pooh': {items: {'1': 1}, count: 1}
			};
			text_unbuilt.add(testing.jsonX[1], 1, false);
			deepEqual(text_unbuilt.flat(), expected, "Adding value to grouped index of TEXT type");
		});
	}();
	
	return testing;
}(jOrder.testing,
	jOrder);

