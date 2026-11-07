import pool from '../data/db.js';
import { Router } from 'express';

const router = Router();

router.get('/', async(req,res)=>{
    let sql = 'SELECT DATE_FORMAT(r.datum,"%Y-%m") AS datum, SUM(t.db) AS rendelesDb, SUM (t.db * t.egysegar) AS bevetel FROM rendelesek r LEFT JOIN tetelek t ON t.rendeles_id = r.id LEFT JOIN termekek te ON te.id = t.termek_id'

    const [eredmeny] = await pool.query(sql)

    res.json(eredmeny)
})

router.get('/top-termekek', async(req,res)=>{
    const n = Number(req.query.n) || 3;

    let sql = 'SELECT t.nev AS termek, SUM(te.db) AS rendelesDb, SUM(te.db * te.egysegar) AS bevetel FROM termekek t LEFT JOIN tetelek te ON te.termek_id = t.id GROUP BY t.id,t.nev ORDER BY rendelesDb DESC LIMIT ?'

    const [eredmeny] = await pool.query(sql, [n]);
    res.json(eredmeny)
})


router.get('/kategoriak', async(req,res)=>{

    let sql = 'SELECT t.kategoria, SUM(te.db) AS eladottDb, SUM(te.db * te.egysegar) AS bevetel FROM termekek t LEFT JOIN tetelek te ON te.termek_id = t.id GROUP BY t.kategoria'

    const [eredmeny] = await pool.query(sql)

    res.json(eredmeny)
})

export default router