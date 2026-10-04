# Aurora II — Query Console

Applicazione React/Vite pronta per Vercel + Supabase, basata sui dati di `ZappBranniganSolution.xlsx` e sul modello mostrato nel PPTX `riassunto.pptx`.

## Dati importati
Il workbook contiene 200 record nella colonna/tabella `elenco_persone-v2`. Il progetto normalizza i dati in 5 tabelle:
`persone`, `settori`, `unita_abitative`, `ruoli`, `turni`.

## Query preimpostate
Sono presenti le richieste esplicite del PPTX: Tecnici, meno di 30 anni, unità A-014, Luca Bianchi, controllo duplicati e le tre query aggregate mostrate nelle slide 7-9.

## Supabase
Nel SQL Editor esegui:
1. `supabase/schema.sql`
2. `supabase/seed.sql`

`schema.sql` crea anche la RPC `public.execute_sql(text)`, limitata a query SELECT/WITH per permettere una console SQL didattica senza esporre la service-role key.

## Frontend
Copia `.env.example` in `.env.local`:
```env
VITE_SUPABASE_URL=https://TUO-PROGETTO.supabase.co
VITE_SUPABASE_ANON_KEY=LA-TUA-ANON-KEY
```
Poi:
```bash
npm install
npm run dev
```

## Vercel
Importa la cartella/repository in Vercel e imposta le stesse due variabili d'ambiente. Il progetto è una SPA Vite e include `vercel.json`.

## Nota sicurezza
La console è pensata per un laboratorio scolastico. Il gateway rifiuta query multi-statement (consentendo il solo `;` finale) e parole chiave di modifica/DDL; per un'applicazione con dati reali o sensibili servirebbero ulteriori controlli.
