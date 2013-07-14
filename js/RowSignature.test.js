/*global module, test, raises, equal, notEqual, strictEqual, deepEqual */
/*global jorder */
(function () {
    "use strict";

    module("RowSignature");

    test("Validating constants", function () {
        notEqual(
            jorder.RowSignature.FIELD_SEPARATOR_STRING,
            encodeURI(jorder.RowSignature.FIELD_SEPARATOR_STRING),
            "Field separator can be URI encoded"
        );

        notEqual(
            jorder.RowSignature.SIGNATURE_TYPE_SEPARATOR,
            encodeURI(jorder.RowSignature.SIGNATURE_TYPE_SEPARATOR),
            "Type separator can be URI encoded"
        );
    });

    test("URI encoding array", function () {
        var arr = ["§1.", "`foo`", "foo bar", 5],
            result;

        result = jorder.RowSignature._arrayUriEncoder(arr);

        strictEqual(result, arr, "URI encoded returns item");

        deepEqual(
            arr,
            ["%C2%A71.", "%60foo%60", "foo%20bar", 5],
            "Array URI-encoded"
        );
    });

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
            jorder.RowSignature.create(['a', 'b'], 'foo', 'bar');
        }, "Invalid case flag");
    });

    test("Instantiation", function () {
        var signature = jorder.RowSignature.create(['a', 'b']);

        equal(signature.signatureType, 'string', "Default signature type");
        deepEqual(signature.fieldNames, ['a', 'b'], "Signature fields");
        deepEqual(signature.fieldNameLookup, {a: '1', b: '1'}, "Signature field lookup");
        equal(signature.fieldSignature, 'a|b%string', "Static field signature");
        equal(signature.isCaseInsensitive, false, "Case sensitive by default");
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
        equal(signature.getKeyForRow({foo: 4}), 4, "Single-field numeric signature");

        signature = jorder.RowSignature.create(['foo', 'bar'], 'number');
        equal(signature.getKeyForRow({foo: 4, bar: 3, etc: 5}), 4 * signature.FIELD_SEPARATOR_NUMBER + 3, "Multi-field numeric signature");

        signature = jorder.RowSignature.create(['foo'], 'string');
        equal(signature.getKeyForRow({foo: "A", bar: "B", etc: "C"}), "A", "Single-field string signature");

        signature = jorder.RowSignature.create(['foo'], 'string', true);
        equal(signature.getKeyForRow({foo: "A", bar: "B", etc: "C"}), "a", "Single-field string signature (case insensitive)");

        signature = jorder.RowSignature.create(['foo', 'bar'], 'string');
        equal(signature.getKeyForRow({foo: "A|", bar: "B", etc: "C"}), 'A%7C|B', "Multi-field string signature");

        signature = jorder.RowSignature.create(['foo', 'bar'], 'string', true);
        equal(signature.getKeyForRow({foo: "A|", bar: "B", etc: "C"}), 'a%7C|b', "Multi-field string signature (case insensitive)");

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
            ['4|3'],
            "String signature"
        );

        signature = jorder.RowSignature.create(['foo'], 'array');
        deepEqual(
            signature.getKeysForRow({foo: ['Hello|', 'World'], bar: 'Etc'}),
            ['Hello%7C', 'World'],
            "Single-field array signature"
        );

        signature = jorder.RowSignature.create(['foo'], 'array', true);
        deepEqual(
            signature.getKeysForRow({foo: ['Hello|', 'World'], bar: 'Etc'}),
            ['hello%7C', 'world'],
            "Single-field array signature (case insensitive)"
        );

        signature = jorder.RowSignature.create(['foo', 'bar'], 'array');
        row = {foo: ['Hello|', 'World'], bar: ['One', 'Two'], etc: 'Etc'};
        deepEqual(
            signature.getKeysForRow(row),
            ['Hello%7C|One', 'Hello%7C|Two', 'World|One', 'World|Two'],
            "Multi-field array signature"
        );
        deepEqual(row, {foo: ['Hello|', 'World'], bar: ['One', 'Two'], etc: 'Etc'}, "Row remains intact");

        signature = jorder.RowSignature.create(['foo', 'bar'], 'array', true);
        row = {foo: ['Hello|', 'World'], bar: ['One', 'Two'], etc: 'Etc'};
        deepEqual(
            signature.getKeysForRow(row),
            ['hello%7C|one', 'hello%7C|two', 'world|one', 'world|two'],
            "Multi-field array signature (case insensitive)"
        );
        deepEqual(row, {foo: ['Hello|', 'World'], bar: ['One', 'Two'], etc: 'Etc'}, "Row remains intact");

        signature = jorder.RowSignature.create(['foo'], 'fullText');
        deepEqual(
            signature.getKeysForRow({foo: 'Hello| World', bar: 'Etc'}),
            ['Hello%7C', 'World'],
            "Single-field full text signature"
        );

        signature = jorder.RowSignature.create(['foo'], 'fullText', true);
        deepEqual(
            signature.getKeysForRow({foo: 'Hello| World', bar: 'Etc'}),
            ['hello%7C', 'world'],
            "Single-field full text signature (case insensitive)"
        );

        signature = jorder.RowSignature.create(['foo', 'bar'], 'fullText');
        row = {foo: "Hello| World", bar: "Howdy All", etc: 5};
        deepEqual(
            signature.getKeysForRow(row),
            ['Hello%7C|Howdy', 'Hello%7C|All', 'World|Howdy', 'World|All'],
            "Multi-field full text signature"
        );
        deepEqual(row, {foo: "Hello| World", bar: "Howdy All", etc: 5}, "Row remains intact");

        signature = jorder.RowSignature.create(['foo', 'bar'], 'fullText', true);
        row = {foo: "Hello| World", bar: "Howdy All", etc: 5};
        deepEqual(
            signature.getKeysForRow(row),
            ['hello%7C|howdy', 'hello%7C|all', 'world|howdy', 'world|all'],
            "Multi-field full text signature (case insensitive)"
        );
        deepEqual(row, {foo: "Hello| World", bar: "Howdy All", etc: 5}, "Row remains intact");
    });
}());
