jOrder
=====

**JavaScript data management redefined**

jOrder is a lightweight client side database featuring index-based queries and update operations on JSON tables.

Its aim is to shift data manipulation towards the client side by being fast and efficient.

Current version: **1.2**

What's new
---------------

- Faster, consistent updates
- Index-based count methods: `table.count()`, `index.count()`
- New helper methods: `jOrder.deep()` and `jOrder.shallow()`
- No deep copy of JSON up front

Highlights
------------

- Fast, index based queries on JSON tables
- Data manipulation preserving index integrity
- Support for keeping client and server data in sync with diff ajax calls

Why?
-------

**Thick clients are back in fashion.**

Because having the cake and eating it too is nice:

- **User experience**: Querying data locally is faster than fetching from the server. Yes, even at 50.000 rows. And yes, in practically any browser.
- **Saving money**: Massively reduced traffic and CPU time cost less.

What for?
-------------

Here's a few examples of what jOrder is ideal for:

- Populating grid controls
- Insanely fast paging
- Live search
