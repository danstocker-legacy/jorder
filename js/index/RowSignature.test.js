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
        deepEqual(signature.fieldNameLookup, {a: '1', b: '1'}, "Signature field lookup");
        equal(signature.fieldSignature, 'a_b', "Static field signature");
    });

    test("Row validation", function () {
        var signature = jorder.RowSignature.create(['foo', 'bar']);

        equal(signature.containsRow({invalid: 'hello'}), false, "No match");
        equal(signature.containsRow({foo: 'hello', invalid: 'hello'}), false, "Mixed fields");
        equal(signature.containsRow({foo: 'hello'}), true, "Subset of fields");

        equal(signature.containedByRow({foo: 'hello'}), false, "Insufficient fields in row");
        equal(signature.containedByRow({foo: 'hello', bar: 'world'}), true, "Exact match");
        equal(signature.containedByRow({foo: 'hello', bar: 'world', extra: 'field'}), true, "Superset match");
    });
}());
