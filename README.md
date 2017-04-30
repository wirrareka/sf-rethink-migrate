# sf-rethink-migrate

## About
This is a Node.js module using RethinkDBDash driver to automatically create tables and indexes in provided database;

## Usage
```
const r = require('rethinkdbdash')({ db: 'my_database' });

const schema = {
  table_1: [ "index_a", "index_b", "index_c" ],
  table_b: [ "other_index_a", "other_index_b", "other_index_c" ]
}

const Migrate = require('sf-rethink-migrate')(r, schema);

Migrate.migrate(() => {
  // database ready

});
```