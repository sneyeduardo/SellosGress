const mysql = require('mysql2');

const connection = mysql.createConnection({
    host: 'mysql-1fc61bb4-sneyeduardo2-4eb1.l.aivencloud.com',
    port: 17206,
    user: 'avnadmin',      // Tu usuario
    password: 'AVNS_r9njVM1EElECGR799ed',      // Tu contraseña
    database: 'sellos_gress_db', // ¡Recuerda poner el nombre real de tu BD!
    ssl: {
        rejectUnauthorized: false // ✅ Obligatorio para entrar a Aiven
    }
});

connection.connect((err) => {
    if (err) {
        console.error('Error conectando a la BD:', err);
        return;
    }
    console.log('✅ Conectado a la base de datos MySQL');
});

module.exports = connection;