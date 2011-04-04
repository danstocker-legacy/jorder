////////////////////////////////////////////////////////////////////////////////
// Unit tests for jOrder index
////////////////////////////////////////////////////////////////////////////////
/*global console, jOrder, module, test, ok, equal, deepEqual, raises */

jOrder.testing = function (testing, jOrder) {
	// Data integrity tests
	testing.signature = function () {
		module("Signature");
		
		test("Initialization", function () {
			raises(function () {
				jOrder.index(testing.jsonX);
			}, "Creating index with no fields raises exception");
			raises(function () {
				jOrder.index(testing.jsonX, ['Total', 'Amount'], {type: jOrder.number});
			}, "Numeric index with multiple fields raises exception");
			raises(function () {
				jOrder.index(testing.jsonX, ['Currency', 'StatusStr'], {type: jOrder.text});
			}, "Full-text index with multiple fields raises exception");
		});

		var
		
		// signatures
		string = jOrder.index(testing.jsonX, ['author']),
		string_multi = jOrder.index(testing.jsonX, ['author', 'volumes']),
		number = jOrder.index(testing.jsonX, ['volumes'], {type: jOrder.number, grouped: true}),
		array = jOrder.index(testing.jsonX, ['data'], {type: jOrder.array, grouped: true}),
		text = jOrder.index(testing.jsonX, ['title'], {type: jOrder.text, grouped: true});
		
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
			deepEqual(string.keys(testing.jsonX[0]), ['Tolkien'], "Extracting single key from string type field");
			deepEqual(string_multi.keys(testing.jsonX[0]), ['Tolkien_3'], "Extracting composite key from string type fields");
			deepEqual(array.keys(testing.jsonX[0]), [5, 6, 43, 21, 88], "Extracting multiple keys from array type field");
			deepEqual(text.keys(testing.jsonX[0]), ['Lord', 'of', 'the', 'rings'], "Extracting multiple keys from text type field");
			deepEqual(string_multi.keys({'author': 'Tolkien'}), [], "Attempting to extract absent data yields empty set");
		});
	}();
	
	return testing;
}(jOrder.testing,
	jOrder);

