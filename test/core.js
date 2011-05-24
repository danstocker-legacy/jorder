////////////////////////////////////////////////////////////////////////////////
// jOrder unit tests
////////////////////////////////////////////////////////////////////////////////
/*global jOrder, module, test, equal, notEqual, deepEqual */

jOrder.testing = function (testing, core) {
	// Data integrity tests
	testing.core = function () {
		module("Core");
		
		test("Method delegation", function () {
			equal(jOrder.delegate, core.delegate, "Delegation preserves reference to method.");
		});

		test("Deep copying JSON", function () {
			var orig = testing.json77,
					copy = core.deep(orig);

			deepEqual(orig, copy, "Deep copy preserves structure & values.");
			notEqual(orig, copy, "Deep copy changes table reference.");
			notEqual(orig[0], copy[0], "Deep copy changes row references.");
		});
		
		test("Deep copying object", function () {
			var orig = testing.json77[0],
					copy = core.deep(orig);

			deepEqual(orig, copy, "Deep copy preserves structure & values.");
			notEqual(orig, copy, "Deep copy changes reference.");
		});
		
		test("Deep copying object with null", function () {
			var orig = {a: 'test', b: 'foo', c: null},
					copy = core.deep(orig);

			deepEqual(orig, copy, "Deep copy preserves structure & values.");
			notEqual(orig, copy, "Deep copy changes reference.");
		});
		
		test("Shallow copy", function () {
			var orig = testing.json77,
					copy;
			
			// creating copy w/o renumbering
			copy = core.shallow(orig);
			equal(orig.length, copy.length, "Length of orig and copy match.");
			
			// altering field in copy should alter original
			copy[0].ID = 1000;
			equal(orig[0].ID, copy[0].ID, "Shallow copy preserves references to rows.");
			
			// removing random rows
			orig = core.shallow(testing.json77);
			delete orig[24];
			delete orig[25];
			delete orig[50];
					
			// creating copy w/ renumbering
			copy = core.shallow(orig, true);
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
			},
			leftA = ['a', 'b', 'c'],
			rightA = [];
			
			deepEqual(core.keys(left), ['test', 'one', 'three', 'foo'], "Key extraction");
			deepEqual(core.values(left), ['what', 'two', undefined, 'bar'], "Value extraction");
			deepEqual(core.split(left), {
				keys: ['test', 'one', 'three', 'foo'],
				values: ['what', 'two', undefined, 'bar']
			}, "Splitting object to keys and values");
			deepEqual(core.join(left, right), {
				'what': 'hello',
				'two': undefined,
				'undefined': undefined,
				'bar': undefined
			}, "Object joining");
			deepEqual(core.join(leftA, rightA), {
				'a': undefined,
				'b': undefined,
				'c': undefined					
			}, "Array joining");
		});
	}();

	return testing;
}(jOrder.testing,
	jOrder.core);

