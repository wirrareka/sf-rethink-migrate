const _ = require('lodash');
    
/**
 * Soundfile.io RethinkDB Table / Indexes migrator
 * 
 * @param {RethinkDBDash} r 
 * @param {Object} schema 
 * @returns {Object} 
 */
module.exports = (r, _schema) => {
  if (r === undefined || r.getPoolMaster === undefined) {
    throw new Error("RethinkDB Driver is unspecified");
  };

  if (_schema === undefined || typeof _schema !== 'object') {
    throw new Error("Schema is unspecified");
  }

  const self = this;
  const schema = _.assign({}, _schema);

  const getTables = () => r.tableList();
  const getIndices = (table) => r.table(table).indexList();
  const createIndex = (table, index) => r.table(table).indexCreate(index);
  const createTable = (table) => r.tableCreate(table);

  const tables = Object.keys(schema);

  const processIndices = (table, existingIndices, done) => {
    const index = schema[table][0];

    const out = () => {
      schema[table].shift();
      if (schema[table].length > 0)
        processIndices(table, existingIndices, done);
      else
        done();      
    };

    if (!_.includes(existingIndices, index))
      createIndex(table, index)
        .then(out);
    else 
      out();    
  };
  
  const processTables = (existingTables, done) => {    
    const table = tables[0];

    const out = (existingIndices) => {
      processIndices(table, existingIndices, () => {
        tables.shift();
        if (tables.length > 0)
          processTables(existingTables, done);
        else        
          done();
      });
    };

    if (!_.includes(existingTables, table)) {
      // table does not exist yet, create
      createTable(table)
        .then(() => {
          out([]);
        });
    } else {
      // table exists, get existing indices
      getIndices()
        .then(out);
    }
  };

  /**
   * migrate
   * 
   * @param {Function} ready callback 
   */
  this.migrate = (ready) => {
    getTables()
      .then((existingTables) => {      
        processTables(existingTables, ready);
      })
      .catch((error) => {
        ready(error);
      });
  };

  return this;

};
