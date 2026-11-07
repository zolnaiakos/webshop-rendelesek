import pool from '../data/db.js'
import { Router } from 'express'

const router = Router();

router.get('/', async(req,res)=>{
 
    let sql1 = "SELECT  r.vasarlo_id, v.nev AS vasarlo,  DATE_FORMAT(r.datum,'%Y-%m-%d') AS datum, r.statusz, SUM(t.db) AS darab, SUM(db * egysegar) AS vegosszeg  FROM rendelesek r LEFT JOIN vasarlok v ON r.vasarlo_id = v.id  LEFT JOIN tetelek t ON t.rendeles_id = r.id "
    

    const {statusz} = req.query
    let {tol, ig} = req.query
    
    let params = []
    let feltetel = []


    
    if(statusz){
        feltetel.push("r.statusz = ?")
        params.push(statusz)
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


    //chatgpt segítségével készült a dátum ellenőrzés, hogy ne lehessen nem létező napot megadni
    if(tol && new Date (tol + "T00:00:00Z").toString().slice(0,10)!==tol){
        return res.status(400).json({hiba: "Nem létező nap"})
    }

    if(ig && new Date (ig + "T00:00:00Z").toString().slice(0,10)!==ig){
        return res.status(400).json({hiba: "Nem létező nap"})
    }


    const [eredmeny] = await pool.query(sql1, params)
    
    res.json(eredmeny);
})


router.get('/:id', async(req,res)=>{

    const {id} = req.params;


    let sql1 = 'SELECT r.id, r.datum , r.statusz, v.id AS vasarlo_id , v.nev, v.email, v.varos, p.nev AS termek, t.db, t.egysegar, (t.db * t.egysegar) AS vegosszeg  FROM rendelesek r LEFT JOIN vasarlok v ON r.vasarlo_id = v.id LEFT JOIN tetelek t ON t.rendeles_id = r.id LEFT JOIN termekek p ON t.termek_id = p.id WHERE r.id = ?'


    const [eredmeny] = await pool.query(sql1, [id])

    if(eredmeny.length === 0){
       return res.status(404).json({error: "A rendelés nem található"})
        
    }

    const rendelesek = {
        id: eredmeny[0].id,
        datum: eredmeny[0].datum,
        statusz: eredmeny[0].statusz,
        vasarlo: {
            id: eredmeny[0].vasarlo_id,
            nev: eredmeny[0].nev,
            email: eredmeny[0].email,
            varos: eredmeny[0].varos
        },
        tetelek: eredmeny.map(t => ({
            termek: t.termek,
            db: t.db,
            egysegar: t.egysegar,
            osszeg: t.osszeg
        }))
    }
    vegosszeg: eredmeny.reduce((sum,t) => sum + (t.db * t.egysegar), 0)

    res.json(rendelesek)
})

export default router