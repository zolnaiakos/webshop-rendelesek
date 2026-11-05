import express from 'express';
import rendelesek from '../webshop-rendelesek/routes/rendelesek.js'

const app = express();
const port = 3000;



app.use('/rendelesek', rendelesek)




app.listen(3000, () => {
  console.log('Szerver fut http://localhost:3000')
})