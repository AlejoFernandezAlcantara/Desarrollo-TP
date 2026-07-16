const express = require('express');
const app = express();

const bd = require('./models')



bd.sequelize.sync().then(() => {
app.listen(3001, () => {
  console.log('Servidor corriendo en el puerto 3001');

  });
});
