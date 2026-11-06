import "dotenv/config"
import mysql2 from 'mysql2/promise'

let dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    database: process.env.DB_DATABASENAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
    dateStrings: true
}
    
const pool = mysql2.createPool(dbConfig);


export default pool;