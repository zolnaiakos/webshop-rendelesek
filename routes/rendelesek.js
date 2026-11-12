import pool from '../data/db.js'
import { Router } from 'express'

const router = Router();

//function megírásához AI segítségét kértem
function datumEllenorzes(datum) {
    const d = new Date(datum + "T00:00:00Z")

    return !isNaN(d.getTime()) &&
        d.toISOString().slice(0, 10) === datum
}

router.get('/', async(req,res)=>{
 
    let sql1 = "SELECT  r.id AS id, DATE_FORMAT(r.datum,'%Y-%m-%d') AS datum, r.statusz, v.nev AS vasarlo, SUM(t.db) AS darab, SUM(db * egysegar) AS vegosszeg  FROM rendelesek r LEFT JOIN vasarlok v ON r.vasarlo_id = v.id  LEFT JOIN tetelek t ON t.rendeles_id = r.id "
    
    const {statusz} = req.query
    let {tol, ig} = req.query

    if (tol && !datumEllenorzes(tol)) {
    return res.status(400).json({
        hiba: "Nem létező kezdő dátum!"
    })
}

    if (ig && !datumEllenorzes(ig)) {
    return res.status(400).json({
        hiba: "Nem létező záró dátum!"
    })
}
    
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

    const [eredmeny] = await pool.query(sql1, params)
    
    res.json(eredmeny);
})


router.get('/:id', async(req,res)=>{

    const {id} = req.params;

    let sql1 = `
    SELECT r.id, r.datum , r.statusz, v.id AS vasarlo_id , v.nev, v.email, v.varos, p.nev AS termek, t.db, t.egysegar, (t.db * t.egysegar) AS osszeg  
    FROM rendelesek r 
    LEFT JOIN vasarlok v ON r.vasarlo_id = v.id 
    LEFT JOIN tetelek t ON t.rendeles_id = r.id 
    LEFT JOIN termekek p ON t.termek_id = p.id 
    WHERE r.id = ?    
`
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
        osszeg: Number(t.db) * Number(t.egysegar)
    })),

    vegosszeg: eredmeny.reduce(
        (sum, t) => sum + (Number(t.db) * Number(t.egysegar)),
        0
    )
}
    res.json(rendelesek)
})

router.post('/', async(req,res)=>{
    
    const { vasarloId, tetelek } = req.body;

    //hibakezelések AI segítségével készültek
    if (
        !Number.isInteger(vasarloId) ||
        vasarloId <= 0 ||
        !Array.isArray(tetelek) ||
        tetelek.length === 0
    ) {
        return res.status(400).json({
            error: "Hibás rendelési adatok!"
        });
    }

    for (const tetel of tetelek) {
        if (
            !Number.isInteger(tetel.termekId) ||
            tetel.termekId <= 0 ||
            !Number.isInteger(tetel.db) ||
            tetel.db <= 0
        ) {
            return res.status(400).json({
                error: "Hibás termékadat vagy darabszám!"
            });
        }
    }

    let kapcsolat;

    try {
        kapcsolat = await pool.getConnection();
        await kapcsolat.beginTransaction();


        const [vasarlok] = await kapcsolat.query(
            'SELECT * FROM vasarlok WHERE id = ?',
            [vasarloId]
        );

        if (vasarlok.length === 0) {
            await kapcsolat.rollback();

            return res.status(404).json({
                error: "A vásárló nem található!"
            });
        }

        const termekIdk = tetelek.map(t => t.termekId);

        const [termekek] = await kapcsolat.query(
            'SELECT id, nev, ar FROM termekek WHERE id IN (?)',
            [termekIdk]
        );

        if (termekek.length !== new Set(termekIdk).size) {
            await kapcsolat.rollback();

            return res.status(404).json({
                error: "Egy vagy több termék nem található!"
            });
        }

        const [rendeles] = await kapcsolat.query(
            `INSERT INTO rendelesek (vasarlo_id, datum, statusz)
             VALUES (?, CURDATE(), 'új')`,
            [vasarloId]
        );

        const rendelesId = rendeles.insertId;

        for (const tetel of tetelek) {
            const termek = termekek.find(
                t => t.id === tetel.termekId
            );

            await kapcsolat.query(
                `INSERT INTO tetelek
                 (rendeles_id, termek_id, db, egysegar)
                 VALUES (?, ?, ?, ?)`,
                [
                    rendelesId,
                    tetel.termekId,
                    tetel.db,
                    termek.ar
                ]
            );
        }

        const [eredmeny] = await kapcsolat.query(
            `SELECT r.id, r.datum, r.statusz, v.id AS vasarlo_id, v.nev AS vasarlo_nev, v.email, v.varos, p.nev AS termek, te.db, te.egysegar
            FROM rendelesek r
            JOIN vasarlok v ON v.id = r.vasarlo_id
            JOIN tetelek te ON te.rendeles_id = r.id
            JOIN termekek p ON p.id = te.termek_id
            WHERE r.id = ?`,
            [rendelesId]
        );

        await kapcsolat.commit();

        const teljesRendeles = {
            id: eredmeny[0].id,
            datum: eredmeny[0].datum,
            statusz: eredmeny[0].statusz,

            vasarlo: {
                id: eredmeny[0].vasarlo_id,
                nev: eredmeny[0].vasarlo_nev,
                email: eredmeny[0].email,
                varos: eredmeny[0].varos
            },

            tetelek: eredmeny.map(t => ({
                termek: t.termek,
                db: t.db,
                egysegar: t.egysegar,
                osszeg: Number(t.db) * Number(t.egysegar)
            })),

            vegosszeg: eredmeny.reduce(
                (sum, t) =>
                    sum + Number(t.db) * Number(t.egysegar),
                0
            )
        };

        res.status(201).json(teljesRendeles);
    } catch (error) {
        if (kapcsolat) {
            await kapcsolat.rollback();
        }

        console.error(error);

     res.status(500).json({
            error: "Hiba történt a rendelés mentésekor!"
        });

    } finally {
        if (kapcsolat) {
            kapcsolat.release();
        }
    }
});

export default router