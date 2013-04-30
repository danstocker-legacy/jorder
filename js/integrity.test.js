/*global jOrder, module, test, equal */
(function (testing) {
    module("Integrity");

    // Testing JSON Data
    test("Testing JSON", function () {
        equal(testing.json77.length, 77, "77-row JSON is OK");
        equal(testing.json1000.length, 1000, "1000-row JSON is OK");
    });
}(jOrder.testing));

