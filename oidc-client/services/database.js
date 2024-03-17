const
  csvdb = require('node-csv-query').default,
  path = require('path');

const database = { connection: null };

console.log(csvdb);

csvdb(path.resolve(__dirname, './database.csv'), { rtrim: true, cast: false, comment: '#' }).then(db => {
  console.log('Connected to database!');
  database.connection = db;
});

module.exports = database;
