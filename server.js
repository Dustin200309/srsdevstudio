require('dotenv').config();

require('./config/db'); //

const app = require('./app');
const PORT = process.env.PORT || 3000;
console.log(process.env.DB_SERVER);

app.listen(PORT, () => {
    console.log(`Servidor corriendo en puerto ${PORT}`);
});