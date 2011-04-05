////////////////////////////////////////////////////////////////////////////////
// Unit tests for jOrder order index
////////////////////////////////////////////////////////////////////////////////
/*global console, jOrder, module, test, ok, equal, deepEqual, raises */

jOrder.testing = function (testing, constants, jOrder) {
	// Data integrity tests
	testing.order = function () {
		module("Order");

		var
		
		// test indexes
		string = jOrder.index(testing.jsonX, ['author'], {ordered: true}),
		//string_multi = jOrder.index(testing.jsonX, ['author', 'volumes']),
		number = jOrder.index(testing.jsonX, ['volumes'], {type: jOrder.number, grouped: true, ordered: true});
		//array = jOrder.index(testing.jsonX, ['data'], {type: jOrder.array, grouped: true}),
		//text = jOrder.index(testing.jsonX, ['title'], {type: jOrder.text, grouped: true});
		
		test("Binary search", function () {
			// author:"Milne" is at index 1
			equal(string.bsearch("Mil", constants.start), 1, "Looking up 'Milne' as start of interval (inclusive)");
			equal(string.bsearch("Mil", constants.end), 0, "Looking up 'Milne' as end of interval (exclusive)");
			
			// author:"Verne" is off the index (too high)
			equal(string.bsearch("Vern", constants.start), 3, "Off-index 'Verne' as start of interval (inclusive)");
			equal(string.bsearch("Vern", constants.end), 2, "Off-index 'Verne' as end of interval (exclusive)");
			
			// author:"Aldiss" is off the index (too low)
			equal(string.bsearch("Ald", constants.start), 0, "Off-index 'Aldiss' as start of interval (inclusive)");
			equal(string.bsearch("Ald", constants.end), -1, "Off-index 'Aldiss' as end of interval (exclusive)");
			
			// edge cases "Adimov" and "Tolkien" are at first and last indices
			equal(string.bsearch("Asim", constants.start), 0, "First item 'Asimov' is OK as interval start");
			equal(string.bsearch("Asim", constants.end), -1, "First item 'Asimov' is unsuitable as end of inerval");
			equal(string.bsearch("Tol", constants.start), 2, "Last item 'Tolkien' is OK as interval start (interval length = 1)");
			equal(string.bsearch("Tol", constants.end), 1, "Last item 'Tolkien' is OK as interval end");
		});
		
		test("Modifying order", function () {
			var expected;
			
			//////////////////////////////
			// unique index (string type)

			// first element
			expected = [
				{key: 'Tolkien', rowId: 0}
			];
			string
				.unbuild()
				.add(testing.jsonX[0], 0, false);
			deepEqual(string.order(), expected, "Adding FIRST item to UNIQUE order");

			// second element
			expected = [
				{key: 'Milne', rowId: 1},
				{key: 'Tolkien', rowId: 0}
			];
			string
				.add(testing.jsonX[1], 1, false)
				.reorder();
			deepEqual(string.order(), expected, "Adding SECOND item to UNIQUE order, then REORDERing");

			//////////////////////////////
			// grouped index (numeric type)
			
			// first element
			expected = [
				{key: 1, rowId: 1}
			];
			number
				.unbuild()
				.add(testing.jsonX[1], 1, false);
			deepEqual(number.order(), expected, "Adding FIRST item to GROUPED order");
			
			// second element
			expected = [
				{key: 1, rowId: 1},
				{key: 3, rowId: 0}
			];
			number
				.add(testing.jsonX[0], 0, false)
				.reorder();
			deepEqual(number.order(), expected, "Adding SECOND item to GROUPED order, then REORDERing");

			// third element
			expected = [
				{key: 1, rowId: 1},
				{key: 1, rowId: 2},
				{key: 3, rowId: 0}
			];
			number
				.add(testing.jsonX[2], 2, false)
				.reorder();
			deepEqual(number.order(), expected, "Adding THIRD item to GROUPED order, then REORDERing");
			
			// removing first element
			expected = [
				{key: 1, rowId: 2},
				{key: 3, rowId: 0}
			];
			number
				.remove(testing.jsonX[1], 1);
			deepEqual(number.order(), expected, "Removing FIRST item from GROUPED order, then REORDERing");
		});
	}();
	
	return testing;
}(jOrder.testing,
	jOrder.constants,
	jOrder);

