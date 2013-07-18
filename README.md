Jorder
======

*Indexed table cache*

Jorder makes working with in-memory table data fast and simple. Based on [Sntls](https://github.com/danstocker/sntls), it allows you to re-interpret table and index data structures as collections, trees, etc. and thus formulate very expressive and effective data queries.

Jorder is the successor of jOrder (see branch "legacy"). Jorder fully covers the feature set of its predecessor, plus introduces:

- Real classes: Jorder tables have all the advantages of [Troop](https://github.com/production-minds/troop) classes.
- Fluent API: queries and updates are more expressive, readable, and extensible.
- Smarter indexes: Jorder allows multi-field full-text indexes.

Also, the new Jorder leaves the following jQuery-inspired features behind:

- Overloaded methods
- Options objects

[Wiki](https://github.com/danstocker/jorder/wiki)

[Reference](http://danstocker.github.io/jorder/)

Examples
--------

Assume that `tableJson` holds an array of personal records.

    var table = jorder.Table.create(tableJson)
        .addIndex(['lastName', 'firstName'], 'string', true);

    // fetching records where name starts with "sm"
    table.queryByPrefix('name', "sm"); // [{lastName: "Smith", firstName: "John"}, {lastName: "Small", firstName: "Bradley"}]
