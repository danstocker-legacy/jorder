////////////////////////////////////////////////////////////////////////////////
// Unit tests for jOrder index
////////////////////////////////////////////////////////////////////////////////
/*global console, jOrder, module, test, ok, equal, deepEqual, raises */

jOrder.testing = function (testing, jOrder) {
	// Data integrity tests
	testing.index = function () {
		module("Indexing");

		test("Initialization", function () {
			deepEqual(jOrder.index(testing.json77, ['ID'], {build: false}).flat(), {}, "Building index on initialization can be turned off");
		});
	}();
	
	return testing;
}(jOrder.testing,
	jOrder);

