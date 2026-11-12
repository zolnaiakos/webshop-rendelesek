import express from 'express';
import rendelesek from '../webshop-rendelesek/routes/rendelesek.js'
import vasarlok from '../webshop-rendelesek/routes/vasarlok.js'
import termekek from '../webshop-rendelesek/routes/termekek.js'
import statisztika from '../webshop-rendelesek/routes/statisztika.js'

const app = express();
const port = 3000;

app.use(express.json());


app.use('/rendelesek', rendelesek)
app.use('/vasarlok', vasarlok)
app.use('/termekek/sosem-rendelt', termekek)
app.use('/statisztika/havi', statisztika)
app.use('/statisztika', statisztika)





app.listen(3000, () => {
  console.log('Szerver fut http://localhost:3000')
})