import pool from '../data/db.js'
import { Router } from 'express'

const router = Router();

router.get('/', async(req,res)=>{
    // a dátum csak a hónapot adja vissza
    let sql1 = "SELECT  r.vasarlo_id, v.nev AS vasarlo,  DATE_FORMAT(r.datum,'%Y-%m') AS datum, r.statusz, t.db AS darab, SUM(db * egysegar) AS vegosszeg  FROM rendelesek r LEFT JOIN vasarlok v ON r.vasarlo_id = v.id  LEFT JOIN tetelek t ON t.rendeles_id = r.id  "
    

    const {statusz} = req.query
    let {tol, ig} = req.query
    
    let params = []
    let feltetel = []


    // csak 1 rendelést ad vissza
    if(statusz){
        params.push("statusz = ?")
        feltetel.push(statusz)
    }

    if(tol && ig  && (tol) > (ig)){
        [tol,ig] = [ig,tol]
    }

    if(tol){
        params.push(tol)
        feltetel.push('r.datum >= ?')
    }

    if(ig){
        params.push(ig)
        feltetel.push('r.datum <= ?')
    }
   

    if(feltetel.length >0){
        sql1 += " WHERE " +feltetel.join(" AND ");
    }


    sql1 += " GROUP BY r.id ORDER BY r.datum"

    const [eredmeny] = await pool.query(sql1, params)
    
    //GET /rendelesek?tol=2026-02-30 kell még

    

    res.json(eredmeny);
})


router.get('/:id', async(req,res)=>{

    let sql1 = 'SELECT r.id, r.datum , r.statusz, v.id AS vasarlo_id , v.nev, v.email, v.varos FROM rendelesek r LEFT JOIN vasarlok v ON r.vasarlo_id = v.id '


})


export default router