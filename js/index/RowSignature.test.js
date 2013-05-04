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

    test("Key extraction", function () {
        var signature;

        signature = jorder.RowSignature.create(['foo'], 'number');
        equal(signature.getKeyForRow({foo: 4}), 4, "Numeric signature");

        signature = jorder.RowSignature.create(['foo', 'bar'], 'string');
        equal(signature.getKeyForRow({foo: 4, bar: 3}), '4_3', "String signature");

        signature = jorder.RowSignature.create(['foo'], 'fullText');
        raises(function () {
            signature.getKeyForRow({foo: 'hello world'});
        }, "Non-string and non-numeric signature");
    });

    test("Multi-key extraction", function () {
        var row,
            signature;

        signature = jorder.RowSignature.create(['foo'], 'number');
        deepEqual(
            signature.getKeysForRow({foo: 4, bar: 3, hello: 'world'}),
            [4],
            "Numeric signature"
        );

        signature = jorder.RowSignature.create(['foo', 'bar'], 'string');
        deepEqual(
            signature.getKeysForRow({foo: 4, bar: 3, hello: 'world'}),
            ['4_3'],
            "String signature"
        );

        signature = jorder.RowSignature.create(['foo'], 'array');
        deepEqual(
            signature.getKeysForRow({foo: ['hello', 'world'], bar: 'etc'}),
            ['hello', 'world'],
            "Single-field array signature"
        );

        signature = jorder.RowSignature.create(['foo', 'bar'], 'array');
        row = {foo: ['hello', 'world'], bar: ['one', 'two'], etc: 'etc'};

        deepEqual(
            signature.getKeysForRow(row),
            ['hello_one', 'hello_two', 'world_one', 'world_two'],
            "Multi-field array signature"
        );

        deepEqual(row, {foo: ['hello', 'world'], bar: ['one', 'two'], etc: 'etc'}, "Row remains intact");

        signature = jorder.RowSignature.create(['foo'], 'fullText');
        deepEqual(
            signature.getKeysForRow({foo: 'hello world', bar: 'etc'}),
            ['hello', 'world'],
            "Single-field full text signature"
        );

        signature = jorder.RowSignature.create(['foo', 'bar'], 'fullText');
        row = {foo: "hello world", bar: "howdy all", etc: 5};

        deepEqual(
            signature.getKeysForRow(row),
            ['hello_howdy', 'hello_all', 'world_howdy', 'world_all'],
            "Multi-field full text signature"
        );

        deepEqual(row, {foo: "hello world", bar: "howdy all", etc: 5}, "Row remains intact");
    });
}());
