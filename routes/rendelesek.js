import pool from '../data/db.js'
import { Router } from 'express'

const router = Router();

router.get('/', async(req,res)=>{
    // a dátum csak a hónapot adja vissza
    let sql1 = "SELECT  r.vasarlo_id, v.nev AS vasarlo,  DATE_FORMAT(r.datum,'%Y-%m') AS datum, r.statusz, t.db AS darab, SUM(db * egysegar) AS vegosszeg  FROM rendelesek r LEFT JOIN vasarlok v ON r.vasarlo_id = v.id  LEFT JOIN tetelek t ON t.rendeles_id = r.id  "
    

    const {statusz} = req.query
    let {tol, ig} = req.query
    
    let params = []
    let params2 = []


    // csak 1 rendelést ad vissza
    if(statusz){
        sql1 += "WHERE statusz = ?"
        params.push(statusz)
    }


     sql1 += 'ORDER BY r.datum'
    


    if(tol !== undefined && ig !== undefined && Number (tol) > Number (ig)){
        [tol,ig] = [ig,tol]
    }

    if(tol){
        params.push(Number(tol))
        params2.push('r.datum >= ?')
    }

    if(ig){
        params.push(Number(ig))
        params2.push('r.datum <= ?')
    }
   

    const [eredmeny] = await pool.query(sql1, params)
    
    

    res.json(eredmeny);
})

export default router