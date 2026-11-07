import pool from '../webshop-rendelesek/db.js'
import { Router } from 'express'

const router = Router();

router.get('/sosem-rendelt', async(req,res)=>{

    const sql = 'SELECT t.id, t.nev, t.kategoria, t.ar  FROM termekek t LEFT JOIN tetelek te ON te.termek_id = t.id WHERE te.termek_id IS NULL'

    const [eredmeny] = await pool.query(sql)

    res.json(eredmeny)
})

export default router