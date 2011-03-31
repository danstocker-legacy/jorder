////////////////////////////////////////////////////////////////////////////////
// jOrder unit tests
////////////////////////////////////////////////////////////////////////////////
/*global jOrder, module, test, equal, deepEqual */

jOrder.testing = function (testing, jOrder) {
	// Data integrity tests
	testing.core = function () {
		module("Core");
		
		test("Method delegation", function () {
			equal(jOrder.delegate, jOrder.core.delegate, "Delegation preserves reference to method.");
		});		

		test("Shallow copy", function () {
			var orig = testing.json77,
					copy;
			
			// creating copy w/o renumbering
			copy = jOrder.shallow(orig);
			equal(orig.length, copy.length, "Length of orig and copy match.");
			
			// altering field in copy should alter original
			copy[0].ID = 1000;
			equal(orig[0].ID, copy[0].ID, "Shallow copy preserves references to rows.");
			
			// removing random rows
			orig = jOrder.shallow(testing.json77);
			delete orig[24];
			delete orig[25];
			delete orig[50];
					
			// creating copy w/ renumbering
			copy = jOrder.shallow(orig, true);
			equal(orig.length, copy.length + 3, "Renumbering packs empty indices.");
		});		

		test("Key - value operations", function () {
			var
			
			left = {
				'test': 'what',
				'one': 'two',
				'three': undefined,
				'foo': 'bar'
			},
			
			right = {
				'test': 'hello'
			};
			
			deepEqual(jOrder.keys(left), ['test', 'one', 'three', 'foo'], "Key extraction");
			deepEqual(jOrder.values(left), ['what', 'two', undefined, 'bar'], "Value extraction");
			deepEqual(jOrder.join(left, right), {
				'what': 'hello',
				'two': undefined,
				'undefined': undefined,
				'bar': undefined
			}, "Object joining");
		});
	}();

	return testing;
}(jOrder.testing || {},
	jOrder);

