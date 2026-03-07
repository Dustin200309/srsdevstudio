const sql = require('mssql');

const config = {
    server: '143.110.144.138',
    user: 'sa',
    password: 'SrsDev@2026',
    database: process.env.DB_NAME,
    port: 1433,
    options: {
        trustServerCertificate: true,
        encrypt: false
    }
};

sql.connect(config)
    .then(() => console.log("✅ Conectado a SQL Server"))
    .catch(err => {
        console.error("❌ Error de conexión:", err);
        process.exit(1);
    });

module.exports = sql;