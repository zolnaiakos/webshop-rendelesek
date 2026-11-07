import express from 'express';
import rendelesek from '../webshop-rendelesek/routes/rendelesek.js'
import vasarlok from '../webshop-rendelesek/routes/vasarlok.js'
import termekek from '../webshop-rendelesek/routes/termekek.js'

const app = express();
const port = 3000;



app.use('/rendelesek', rendelesek)
app.use('/vasarlok', vasarlok)
app.use('/termekek', termekek)



app.listen(3000, () => {
  console.log('Szerver fut http://localhost:3000')
})