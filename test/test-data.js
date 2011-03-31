////////////////////////////////////////////////////////////////////////////////
// jOrder unit tests
////////////////////////////////////////////////////////////////////////////////
var test = function (test, jOrder) {
	// Data integrity tests
	test.data = function () {
		module("Data Integrity");
		
		// Testing JSON Data
		test("Testing JSON", function () {
			equals(jOrder.test.json77.length, 77, "77-row JSON is OK");
			equals(jOrder.test.json1000.length, 1000, "1000-row JSON is OK");
		});
	}();

	return test;
}(test || {},
	jOrder);

