require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mysql = require('mysql2/promise');

// Support both DB_USER and DB_USERNAME (TiDB Cloud uses DB_USERNAME)
const strip = (v) => v ? v.replace(/^['"]|['"]$/g, '') : v;

const host = strip(process.env.DB_HOST) || 'localhost';
const port = parseInt(process.env.DB_PORT) || 3306;
const user = strip(process.env.DB_USERNAME || process.env.DB_USER) || 'root';
const password = strip(process.env.DB_PASSWORD) || '';
const database = strip(process.env.DB_DATABASE) || 'vms_db';

// Enable SSL for remote databases (TiDB Cloud, PlanetScale, etc.)
const isRemote = host !== 'localhost' && host !== '127.0.0.1';

const pool = mysql.createPool({
	host,
	port,
	user,
	password,
	database,
	waitForConnections: true,
	connectionLimit: 10,
	queueLimit: 0,
	...(isRemote ? { ssl: { rejectUnauthorized: true } } : {})
});

module.exports = pool;
