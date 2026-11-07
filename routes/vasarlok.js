import pool from '../data/db.js'
import { Router } from 'express'

const router = Router();

router.get('/', async(req,res)=>{

    let sql1 = 'SELECT v.id, v.nev, v.email, v.varos,  COUNT(DISTINCT r.id) AS rendelesDb, SUM(db * egysegar) AS ossKoltes  FROM vasarlok v LEFT JOIN rendelesek r ON r.vasarlo_id = v.id LEFT JOIN tetelek t ON t.rendeles_id = r.id GROUP BY v.id, v.nev, v.varos ORDER BY ossKoltes DESC'

    const [eredmeny] = await pool.query(sql1)

    res.json(eredmeny)
});

router.get('/:id/rendelesek', async(req,res)=>{
    // kicsit hianyos meg
    const {id} = req.params

    const[vasarlo] = await pool.query('SELECT * FROM vasarlok WHERE id = ?', [id])

    if(vasarlo.length === 0){
        return res.status(404).json({error: 'A vásárló nem található'})
       
    }

    const sql = 'SELECT r.id, r.datum, SUM(t.db * t.egysegar) AS osszeg FROM rendelesek r LEFT JOIN tetelek t ON t.rendeles_id = r.id WHERE r.vasarlo_id = ? GROUP BY r.id ORDER BY r.datum DESC'
    const [rendelesek] = await pool.query(sql, [id])

    res.json(rendelesek)
})


export default router