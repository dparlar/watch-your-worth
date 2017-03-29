/* AWS PostgreSQL */
var Pool = require('pg').Pool;
var db = new Pool({
    user: process.env.PG_USERNAME,
    password: process.env.PG_PASSWORD,
    host: process.env.PG_HOSTNAME,
    database: process.env.PG_DATABASE
});

module.exports = db;