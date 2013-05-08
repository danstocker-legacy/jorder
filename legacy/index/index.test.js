/*global console, jOrder, module, test, ok, equal, notEqual, deepEqual, raises */
(function (testing, constants, jOrder) {
    module("Indexing");

    var index = jOrder.index(testing.json77, ['ID'], {ordered: true, build: false});

    // detects whether an object has any own properties
    function empty(obj) {
        var i;
        for (i in obj) {
            if (obj.hasOwnProperty(i)) {
                return false;
            }
        }
        return true;
    }

    test("Initialization", function () {
        ok(index.order().length === 0 && empty(index.flat()), "Building index on initialization can be turned off");
        ok(index.rebuild().order().length > 0 && !empty(index.flat()), "Rebuilding index on demand");
        ok(index.unbuild().order().length === 0 && empty(index.flat()), "Clearing index on demand");
    });

    test("Getters", function () {
        ok(!index.grouped(), "Grouped state");
        ok(index.ordered(), "Grouped state");
        equal(index.type(), constants.string, "Index type");
    });
}(jOrder.testing,
    jOrder.constants,
    jOrder));

