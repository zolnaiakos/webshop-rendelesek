import pool from '../data/db.js';
import { Router } from 'express';

const router = Router();

router.get('/', async(req,res)=>{
    let sql = `SELECT DATE_FORMAT(r.datum, '%Y-%m') AS honap,COUNT(DISTINCT r.id) AS rendelesDb, SUM(t.db * t.egysegar) AS bevetel
    FROM rendelesek r
    LEFT JOIN tetelek t ON t.rendeles_id = r.id
    WHERE r.statusz != 'törölve'
    GROUP BY DATE_FORMAT(r.datum, '%Y-%m')
    ORDER BY honap
`

    const [eredmeny] = await pool.query(sql)

    res.json(eredmeny)
})

router.get('/top-termekek', async(req,res)=>{
    // hibakezeléshez AI segítségét kértem
    let n = 3

    if(req.query.n !== undefined){
        n = Number(req.query.n)

    if(!Number.isInteger(n) || n <= 0){
       return res.status(400).json({
            error: "A termék limitnek számnak kell lennie"
        })
    }
}

    let sql = `SELECT t.nev AS termek, SUM(te.db) AS eladottDb, SUM(te.db * te.egysegar) AS bevetel 
    FROM termekek t 
    INNER JOIN tetelek te ON te.termek_id = t.id
    INNER JOIN rendelesek r ON r.id = te.rendeles_id
    WHERE r.statusz != 'törölve' 
    GROUP BY t.id, t.nev 
    ORDER BY eladottDb DESC 
    LIMIT ?
`

    const [eredmeny] = await pool.query(sql, [n]);
    res.json(eredmeny)
})


router.get('/kategoriak', async(req,res)=>{

    let sql = `SELECT t.kategoria, SUM(te.db) AS eladottDb, SUM(te.db * te.egysegar) AS bevetel 
    FROM termekek t 
    INNER JOIN tetelek te ON te.termek_id = t.id
    INNER JOIN rendelesek r ON r.id = te.rendeles_id
    WHERE r.statusz != 'törölve' 
    GROUP BY t.kategoria
    ORDER BY bevetel DESC
`

    const [eredmeny] = await pool.query(sql)

    res.json(eredmeny)
})

export default router