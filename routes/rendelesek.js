import pool from '../data/db.js'
import { Router } from 'express'

const router = Router();

router.get('/', async(req,res)=>{
    let sql1 = "SELECT  r.vasarlo_id, v.nev AS vasarlo,  DATE_FORMAT(r.datum,'%Y-%m') AS datum, r.statusz, t.db AS darab, SUM(db * egysegar) AS vegosszeg  FROM rendelesek r LEFT JOIN vasarlok v ON r.vasarlo_id = v.id  LEFT JOIN tetelek t ON t.rendeles_id = r.id  ORDER BY r.datum "
    

    const {statusz} = req.query
    
    let params = []

    if(statusz){
        sql1 += "WHERE r.statusz = ?"
        params.push(statusz)
    }


    sql1 += 'GROUP BY r.id, r.vasarlo_id, v.nev, r.datum, r.statusz ORDER BY r.datum'
    

   

    const [eredmeny] = await pool.query(sql1, params)
    
    

    res.json(eredmeny);
})

export default router