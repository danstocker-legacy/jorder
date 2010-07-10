jOrder = {};

// constants & properties
jOrder.asc = 1;
jOrder.desc = -1;
jOrder.string = 1;
jOrder.number = 2;
jOrder.logging = true;

// general logging function
jOrder.log = function(message, level)
{
    if (!jOrder.logging)
        return;

    if ('undefined' != typeof (console))
    {
        switch (level)
        {
            default:
                console.log("jOrder: " + message);
                break;
            case 1:
                console.warn("jOrder: " + message);
                break;
            case 2:
                console.error("jOrder: " + message);
                break;
        }
    }
    else if ('undefined' != typeof (Sys))
    {
        switch (level)
        {
            default:
                Sys.Debug.trace("jOrder: " + message);
                break;
            case 1:
                Sys.Debug.trace("jOrder (WARNING): " + message);
                break;
            case 2:
                Sys.Debug.trace("jOrder (ERROR): " + message);
                break;
        }
    }
    else
        alert(message);
}

// issues a warning
jOrder.warning = function(message)
{
    jOrder.log(message, 1);
}

// issues an error
jOrder.error = function(message)
{
    jOrder.log(message, 2);
}

// provides a deep copy of a table (array of objects)
jOrder.copyTable = function(table, renumber)
{
    jOrder.log("Creating deep copy of table (length: " + table.length + ").");
    var result = [];
    if (renumber)
    {
        for (var idx in table)
        {
            var temp = {};
            for (var field in table[idx])
                temp[field] = table[idx][field];
            result.push(temp);
        }
        return result;
    }
    for (var idx in table)
    {
        var temp = {};
        for (var field in table[idx])
            temp[field] = table[idx][field];
        result[idx] = temp;
    }

    return result;
}

// retrieves the keys of an object
jOrder.keys = function(object)
{
    var result = [];
    for (var key in object)
        result.push(key);
    return result;
}

// gathers the values of an object
jOrder.values = function(object)
{
    var result = [];
    for (var key in object)
        result.push(object[key]);
    return result;
}

// generates a lookup index on the specified table for the given set of fields
// purpose: fast access to rows; no support for sorting and inequality filters
// - _flat: array of uniform objects
// - _fields: array of strings representing table fields
// - _options: grouped, sorted, data type
jOrder.index = function(_flat, _fields, _options)
{
    // manipulation
    this.add = add;
    this.remove = remove;
    this.rebuild = rebuild;

    // data access
    this.lookup = lookup;
    this.grouped = grouped;

    // representation
    this.signature = signature;
    this.flat = flat;
    this.order = order;

    // private values
    var _data = {};
    var _order = [];

    // default options
    if (!_options) _options = {};
    if (!_options.grouped) _options.grouped = false;
    if (!_options.ordered) _options.ordered = false;
    if (!_options.type) _options.type = jOrder.string;

    // start by building the index
    rebuild();

    // sets a lookup value for a given data row
    // - row: data row that serves as basis for the index key
    // - rowId: index of the row in the original (flat) table
    // - reorder: whether to re-calcuate order after addition
    function add(row, rowId, reorder)
    {
        var key = _key(row);

        // required field not found; row cannot be indexed
        if (null == key)
            throw "Can't add row to index. No field matches signature '" + signature() + "'";

        // extend (and re-calculate) order
        if (_options.ordered && !(key in _data))
        {
            // number variable type must be preserved for sorting purposes
            _order.push(jOrder.number == _options.type ? _flat[rowId][_fields[0]] : key);
            if (!(false === reorder))
                _reorder();
        }

        // add row id to index
        if (_options.grouped)
        {
            // grouped index
            if (!_data[key])
                _data[key] = [];
            _data[key][rowId] = rowId;
        }
        else
        {
            // non-grouped index
            if (key in _data)
                throw "Can't add more than one row ID to the non-grouped index '" + signature() + "'. Consider using a group index instead.";
            _data[key] = rowId;
        }
    }

    // removes a key from the index
    // - row: row to delete
    function remove(row, rowId)
    {
        var key = _key(row);

        if (!(key in _data))
            throw "Can't remove row. Row '" + key + "' doesn't match signature '" + signature() + "'.";

        // non-group index
        if (!_options.grouped)
        {
            delete _data[key];
            return;
        }

        if (null == rowId)
            throw "Must pass rowId when deleting from group index.";

        // group index
        delete _data[key][rowId];
    }

    // rebuilds the index
    function rebuild()
    {
        // clear index
        delete _data;
        _data = {};
        delete _order;
        _order = [];

        // generate index
        jOrder.log("Building index of length: " + _flat.length + ", signature '" + signature() + "'.");
        for (var rowId in _flat)
            add(_flat[rowId], rowId, false);

        if (!_options.ordered)
            return;

        // generate order
        _reorder();
    }

    // generates or validates a signature for the index
    // - sig: signature to validate
    function signature(fields)
    {
        if (fields)
            return escape(fields.join('_')) == signature();
        return escape(_fields.join('_'));
    }

    // returns the original rowids associated with the index
    // - rows: data rows that serve as basis for the index key
    function lookup(rows)
    {
        var result = [];
        for (var idx in rows)
        {
            var key = _key(rows[idx]);
            if (!(key in _data))
                continue;

            // index element is either an array or a number
            if ('object' == typeof (_data[key]))
                result = result.concat(_data[key]);
            else
                result.push(_data[key]);
        }
        return result;
    }

    // tells whether the index id grouped
    function grouped()
    {
        return _options.grouped;
    }

    // flat, json representation of the index data
    function flat()
    {
        return _data;
    }

    // returns a copy of the index order
    function order()
    {
        return _order.length ? _order : null;
    }

    // helper functions

    // constructs a key based on values of a row
    // - row: data row that serves as basis for the index key
    function _key(row)
    {
        var key = [];
        for (var idx in _fields)
        {
            if (!(_fields[idx] in row))
                return null;
            key.push(row[_fields[idx]]);
        }
        return escape(key.join('_'));
    }

    // reorders the index
    function _reorder()
    {
        _order = _order.sort(function(a, b)
        {
            return a > b ? 1 : a < b ? -1 : 0;
        });
    }
}

// jQuery.table
// database-like table object
// - data: json table the table object is based on
jOrder.table = function(data)
{
    // manipulation
    this.index = index;
    this.reindex = reindex;
    this.update = update;
    this.insert = insert;
    this.remove = remove;
    this.clear = clear;

    // query functions
    this.select = select;           // direct access
    this.where = where;             // uses index
    this.aggregate = aggregate;     // uses index
    this.orderby = orderby;         // uses ordered index
    this.filter = filter;           // linear traversing
    this.count = count;             // linear traversing

    // representations
    this.flat = flat;
    this.column = column;

    // member variables
    var _data = jOrder.copyTable(data);
    var _indexes = {};

    // set or get an index
    // - name: index name
    // - fields: array of strings representing table fields
    // - options: index options (groupability, sortability, type, etc.)
    function index(name, fields, options)
    {
        if (!name)
            reindex();
        if (!fields)
            return _indexes[name];
        if (null != _indexes[name])
            delete _indexes[name];
        _indexes[name] = new jOrder.index(_data, fields, options);
    }

    // rebuilds indexes on table
    function reindex()
    {
        for (var name in _indexes)
            _indexes[name].rebuild();
    }

    // updates, inserts or deletes one row in the table, modifies indexes
    // - before: data row
    // - after: changed data row
    function update(before, after)
    {
        var rowId = null;

        // here we assume that the first index is the id index
        if (before)
            rowId = jOrder.values(_indexes)[0].lookup([before])[0];

        // are we inseting?
        if (null == rowId)
        {
            if (!after)
                return;

            // insert new value
            rowId = _data.push(after) - 1;
        }
        else
        {
            // delete old
            delete _data[rowId];

            // add new at the same row id
            if (after)
                _data[rowId] = after;
        }

        // update indexes
        for (var idx in _indexes)
        {
            var index = _indexes[idx];
            if (before)
                index.remove(before, rowId);
            if (after)
                index.add(after, rowId);
        }
    }

    // inserts a row into the table, updates indexes
    // - rows: table rows to be inserted
    function insert(rows)
    {
        for (var idx in rows)
            update(null, rows[idx]);
    }

    // deletes row from table, updates indexes
    // - rows: table rows to delete
    function remove(rows)
    {
        for (var idx in rows)
            update(rows[idx], null);
    }

    // deletes the tables contents
    function clear()
    {
        delete _data;
        _data = jOrder.copyTable(data);
        delete _indexes;
        _indexes = {};
    }

    // selects a set of rows using the specified row ids
    // - rowIds: specifies which rows to include in the result
    // - renumber: whether or not to preserve row ids
    function select(rowIds, renumber)
    {
        var result = [];

        if (renumber)
        {
            for (var idx in rowIds)
            {
                var rowId = rowIds[idx];
                if (rowId in _data)
                    result.push(_data[rowId]);
            }
            return result;
        }

        for (var idx in rowIds)
        {
            var rowId = rowIds[idx];
            result[rowId] = _data[rowId];
        }
        return result;
    }

    // returns the first row as json table from the table ftting the conditions
    // - conditions: list of field-value pairs defining the data we're looking for
    //   (fields must be in the same exact order as in the index)
    // - indexName: index to use for search
    function where(conditions, indexName)
    {
        // obtain index
        var index = null;
        var fields;
        if (indexName)
        {
            // use specified index
            if (!(indexName in _indexes))
                throw "Invalid index name.";
            index = _indexes[indexName];
        }
        else
        {
            // look for a suitable index
            fields = jOrder.keys(conditions[0]);
            index = _index(fields);
        }

        // index found, return matching row by index
        if (index)
            return select(index.lookup(conditions));

        // no index found, search linearly
        jOrder.warning("No matching index for fields: '" + fields.join(',') + "'.");
        return filter(function(row)
        {
            var match = false;
            for (var idx in conditions)
            {
                var partial = true;
                for (var field in conditions[idx])
                {
                    partial &= (conditions[idx][field] == row[field]);
                    if (!partial)
                        break;
                }
                match |= partial;
                if (match)
                    break;
            }
            return match;
        });

        return [];
    }

    // aggregates the table using a group index
    // - indexName: name of the group index
    // - initCallback: function that initializes the aggregated row
    // - iterateCallback: function performing one step of iteration
    function aggregate(indexName, initCallback, iterateCallback)
    {
        // check index
        if (!(indexName in _indexes))
            throw "Index '" + indexName + "' not found.";

        var index = _indexes[indexName];
        if (!index.grouped())
            throw "Can't aggregate using a non-group index! Signature: '" + index.signature() + "'.";

        // cycling through groups according to index
        var groupIndex = index.flat();
        var grouped = [];
        for (var groupId in groupIndex)
        {
            // initializing aggregated row (seed)
            var group = groupIndex[groupId];
            var seed;
            for (var idx in group)
            {
                seed = _data[group[idx]];
                break;
            }
            var aggregated = initCallback(jOrder.copyTable([seed])[0]);

            // iterating through each row in group
            for (var idx in group)
                aggregated = iterateCallback(aggregated, _data[group[idx]]);

            // adding aggregated group to result
            grouped[groupId] = aggregated;
        }

        return grouped;
    }

    // sorts the contents of the table according to an index
    // - fields: array of field names to sort by
    // - direction: jOrder.asc or jOrder.desc
    // - indexName: name of the index to use for sorting
    function orderby(fields, direction, indexName)
    {
        // obtain index
        var index = null;
        if (indexName)
        {
            // use specified index
            if (!(indexName in _indexes))
                throw "Invalid index name.";
            index = _indexes[indexName];
        }
        else
        {
            // look for a suitable index
            index = _index(fields);
        }
        if (!index)
            throw "Can't order by unindexed fields: '" + fields.join(',') + "'.";

        // assess sorting order
        var flat = index.flat();
        var order = index.order();
        if (!order)
        {
            // sorting on the fly
            jOrder.warning("Index '" + indexName + "' is not ordered. Sorting index on the fly.");
            order = jOrder.keys(flat).sort(function(a, b)
            {
                return a > b ? 1 : a < b ? -1 : 0;
            });
        }

        // assembling ordered set
        // NOTE: breaking down the following section will result in
        // a performance drop!
        var ids = [];
        if (index.grouped())
        {
            if (jOrder.asc == direction)
                for (var idx = 0; idx < order.length; idx++)
                ids = ids.concat(flat[order[idx]]);
            else
                for (var idx = order.length - 1; idx >= 0; idx--)
                ids = ids.concat(flat[order[idx]]);
        }
        else
        {
            if (jOrder.asc == direction)
                for (var idx = 0; idx < order.length; idx++)
                ids.push(flat[order[idx]]);
            else
                for (var idx = order.length - 1; idx >= 0; idx--)
                ids.push(flat[order[idx]]);
        }

        return select(ids, true);
    }

    // filters table rows using the passed selector function
    // runs the selector on each row of the table
    // returns a json table; preserves row ids
    // - selector: function that takes the row (object) as argument and returns a bool
    function filter(selector)
    {
        jOrder.warning("Performing linear search on table (length: " + _data.length + "). Consider using an index.");

        var result = [];
        for (var idx in _data)
            if (selector(_data[idx]))
            result[idx] = _data[idx];
        return result;
    }

    // counts the lements in the table
    function count()
    {
        jOrder.warning("jOrder.count() traverses the table linearly (length: " + _data.length + ").");

        return jQuery.keys(_data).length;
    }

    // returns a copy of the flat contents of the table
    function flat()
    {
        return _data;
    }

    // returns one column of the table as a flat array
    // - field: field name identifying the column
    // - renumber: whether or not it should preserve row ids
    function column(field, renumber)
    {
        var result = [];
        if (renumber)
        {
            for (var idx in _data)
                result.push(_data[idx][field]);
            return result;
        }
        for (var idx in _data)
            result[idx] = _data[idx][field];
        return result;
    }

    // helper functions

    // looks up an index according to the given fields
    // - fields: array of fields that match an index
    function _index(fields)
    {
        var index = null;
        for (var idx in _indexes)
        {
            if (_indexes[idx].signature(fields))
            {
                index = _indexes[idx];
                break;
            }
        }
        return index;
    }

}
