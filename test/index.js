////////////////////////////////////////////////////////////////////////////////
// Unit tests for jOrder index
////////////////////////////////////////////////////////////////////////////////
/*global console, jOrder, module, test, ok, equal, deepEqual, raises */

jOrder.testing = function (testing, jOrder) {
	// Data integrity tests
	testing.index = function () {
		module("Indexing");
		
		test("Initialization", function () {
			raises(function () {
				jOrder.index(testing.json77);
			}, "Creating index with no fields raises exception");
			raises(function () {
				jOrder.index(testing.json77, ['Total', 'Amount'], {type: jOrder.number});
			}, "Numeric index with multiple fields raises exception");
			raises(function () {
				jOrder.index(testing.json77, ['Currency', 'StatusStr'], {type: jOrder.text});
			}, "Full-text index with multiple fields raises exception");
		});

		var
		
		// test json
		jsonX = [{
			'title': 'Lord of the rings',
			'data': [5, 6, 43, 21, 88],
			'author': 'Tolkien',
			'volumes': 3
		}, {
			'title': 'Winnie the Pooh',
			'data': [1, 2, 34, 5],
			'author': 'Milne',
			'volumes': 1
		}, {
			'title': 'Prelude to Foundation',
			'data': [99, 1],
			'author': 'Asimov',
			'volumes': 1
		}],

		// test indexes
		string = jOrder.index(jsonX, ['author']),
		string_multi = jOrder.index(jsonX, ['author', 'volumes']),
		array = jOrder.index(jsonX, ['data'], {type: jOrder.array, grouped: true}),
		text = jOrder.index(jsonX, ['title'], {type: jOrder.text, grouped: true});
		
		test("Signature extraction", function () {
			equal(string.signature(), 'author', "Extracting signature from single field index");
			equal(string_multi.signature(), 'author_volumes', "Extracting signature from composite index");
		});
		
		test("Signature validation", function () {
			ok(string.signature({'author': 'Asimov'}), "Validating against single field index");
			ok(string_multi.signature({'author': 'Asimov', 'volumes': 1}), "Validating against composite index");
			ok(string.signature({'author': 'foo', 'blah': 'foo'}), "Validation passes on redundant fields in row");
			ok(!string_multi.signature({'author': 'foo'}), "Validation fails on insufficient number of fields in row");
		});
		
		test("Key extraction", function () {
			deepEqual(string.keys(jsonX[0]), ['Tolkien'], "Extracting single key from string type field");
			deepEqual(string_multi.keys(jsonX[0]), ['Tolkien_3'], "Extracting composite key from string type fields");
			deepEqual(array.keys(jsonX[0]), [5, 6, 43, 21, 88], "Extracting multiple keys from array type field");
			deepEqual(text.keys(jsonX[0]), ['Lord', 'of', 'the', 'rings'], "Extracting multiple keys from text type field");
			deepEqual(string_multi.keys({'author': 'Tolkien'}), [], "Attempting to extract absent data yields empty set");
		});
		
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
	}();
	
	return testing;
}(jOrder.testing,
	jOrder);

