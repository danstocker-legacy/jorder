/*global module, test, raises, equal, deepEqual */
/*global jorder */
(function () {
    "use strict";

    module("RowSignature");

    test("Instantiation exceptions", function () {
        raises(function () {
            jorder.RowSignature.create('fields not array');
        }, "Invalid fields array");

        raises(function () {
            jorder.RowSignature.create([]);
        }, "Empty fields array");

        raises(function () {
            jorder.RowSignature.create(['a', 'b'], 'foo');
        }, "Invalid signature type");

        raises(function () {
            jorder.RowSignature.create(['a', 'b'], 'fullText');
        }, "Multi field & fullText type");

        raises(function () {
            jorder.RowSignature.create(['a', 'b'], 'number');
        }, "Multi field & number type");
    });

    test("Instantiation", function () {
        var signature = jorder.RowSignature.create(['a', 'b']);

        equal(signature.signatureType, 'string', "Default signature type");
        deepEqual(signature.fieldNames, ['a', 'b'], "Signature fields");
        equal(signature.fieldSignature, 'a_b', "Static field signature");
    });
}());

