const express = require('express');
const app = express();

const bd = require('./models')



bd.sequelize.sync().then(() => {
app.listen(3001, () => {
  console.log('Servidor corriendo en el puerto 3001');
  app.get('/', (req, res) => {
    res.send('¡El servidor backend está funcionando correctamente!');
});

  });
});
