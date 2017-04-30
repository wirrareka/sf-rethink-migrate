const db = 'sf_rethink_migrate_test';
const r = require('rethinkdbdash')({ db });
const _ = require('lodash');
const chai = require('chai');
const should = chai.should();
const expect = chai.expect;
const assert = chai.assert;
const Migrate = require('./index');

const schema = {
  table_a: [ 'index_a', 'index_b', "index_c" ],
  table_b: [ 'index_d', 'index_e', "index_f" ],
  table_c: [ 'index_g', 'index_h', "index_i" ]
};

describe('Initialization', () => {

  before((done) => {
    const out = () => {
      r.dbCreate(db)
        .then(() => {
          done();
        })
        .catch((error) => {
          console.error(error);
        });
    };

    r.dbDrop(db)
      .then(out)
      .catch(out);
  });

  it("Should not allow to initialize without RethinkDBDash driver", () => {
    expect(Migrate).to.throw(Error, /RethinkDB Driver is unspecified/);
  });

  it("Should not allow to initialize without Schema", () => {    
    expect(() => { Migrate(r); }).to.throw(Error, /Schema is unspecified/);
  });

  it("Should initialize and return instance", () => {    
    expect(() => { Migrate(r, schema); }).is.a('function');    
  });

});

describe('Migration', () => {
  
  it("Should create schema without errors", (done) => {
    const migrate = Migrate(r, schema); 
    migrate.migrate((error) => {
      should.not.exist(error);
      r.tableList()
        .then((tables) => {
          let tablesValid = true;
          let indicesValid = true;
          const schemaTables = Object.keys(schema);

          schemaTables.forEach((table) => {
            if (!_.includes(tables, table)) {
              tablesValid = false;
            }
          });

          expect(tablesValid).to.eql(true);

          const checkIndexes = () => {
            const table = schemaTables[0];
            r.table(table)
              .indexList()
              .then((indices) => {
                const schemaIndices = schema[table];
                schemaIndices.forEach((index) => {
                  if (!_.includes(indices, index)) {
                    indicesValid = false;
                  }
                });

                schemaTables.shift();
                if (schemaTables.length > 0) {
                  checkIndexes();
                } else {                  
                  expect(indicesValid).to.eql(true);
                  done();
                }
              });
          };
          
          checkIndexes();
        });
    });
  }).timeout(10000);

});