import React,{useEffect,useMemo,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {createClient} from '@supabase/supabase-js';
import './styles.css';

const url=import.meta.env.VITE_SUPABASE_URL,key=import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase=url&&key?createClient(url,key):null;
const schema={
 persone:['id','cognome','nome','eta','codice_settore','unita','codice_ruolo','turno','indice_operativo'],
 settori:['codice_settore','settore','livello_rad'],
 unita_abitative:['unita','tipo_unita','capacita_unita'],
 ruoli:['codice_ruolo','ruolo','descrizione_ruolo'],
 turni:['turno','orario_turno']
};
const presets=[
{id:'tecnici',title:'Tutti i Tecnici',tag:'BASE',description:'Elenca tutte le persone con ruolo di Tecnico.',sql:`SELECT p.id,p.cognome,p.nome,p.eta,s.settore,r.ruolo,p.unita,p.turno,p.indice_operativo
FROM persone p JOIN settori s ON p.codice_settore=s.codice_settore JOIN ruoli r ON p.codice_ruolo=r.codice_ruolo
WHERE r.ruolo='Tecnico' ORDER BY p.cognome,p.nome;`},
{id:'under30',title:'Persone con meno di 30 anni',tag:'BASE',description:'Trova tutte le persone sotto i 30 anni.',sql:`SELECT id,cognome,nome,eta,codice_settore,unita,codice_ruolo
FROM persone WHERE eta<30 ORDER BY eta,cognome,nome;`},
{id:'a014',title:'Assegnati all’unità A-014',tag:'BASE',description:'Trova chi è assegnato ad A-014.',sql:`SELECT p.id,p.cognome,p.nome,p.eta,p.unita,r.ruolo,s.settore
FROM persone p JOIN ruoli r ON p.codice_ruolo=r.codice_ruolo JOIN settori s ON p.codice_settore=s.codice_settore
WHERE p.unita='A-014' ORDER BY p.cognome,p.nome;`},
{id:'luca',title:'Codice operativo di Luca Bianchi',tag:'BASE',description:'Cerca Luca Bianchi nel registro.',sql:`SELECT id,cognome,nome,indice_operativo FROM persone
WHERE lower(nome)='luca' AND lower(cognome)='bianchi';`},
{id:'duplicati',title:'Nomi registrati più volte',tag:'CONTROLLO',description:'Evidenzia nome+cognome presenti più di una volta.',sql:`SELECT cognome,nome,COUNT(*) AS occorrenze
FROM persone GROUP BY cognome,nome HAVING COUNT(*)>1 ORDER BY occorrenze DESC,cognome,nome;`},
{id:'q1',title:'Query 1 · Persone per Settore + radiazioni',tag:'PPTX',description:'Numero di persone per settore e relativo livello di radiazioni.',sql:`SELECT s.settore,s.livello_rad,COUNT(p.id) AS numero_persone
FROM persone p INNER JOIN settori s ON p.codice_settore=s.codice_settore
GROUP BY s.settore,s.livello_rad ORDER BY COUNT(p.id) DESC;`},
{id:'q2',title:'Query 2 · Turno + Ruolo + indice medio',tag:'PPTX',description:'Distribuzione del personale per turno e ruolo con indice medio.',sql:`SELECT t.orario_turno,r.ruolo,COUNT(p.id) AS totale_addetti,ROUND(AVG(p.indice_operativo),2) AS indice_medio
FROM persone p INNER JOIN turni t ON p.turno=t.turno INNER JOIN ruoli r ON p.codice_ruolo=r.codice_ruolo
GROUP BY t.orario_turno,r.ruolo ORDER BY t.orario_turno;`},
{id:'q3',title:'Query 3 · Forza operativa per Settore + Ruolo',tag:'PPTX',description:'Addetti e indice medio per settore e ruolo.',sql:`SELECT s.settore,r.ruolo,COUNT(p.id) AS numero_addetti,ROUND(AVG(p.indice_operativo),2) AS indice_medio
FROM persone p INNER JOIN settori s ON p.codice_settore=s.codice_settore INNER JOIN ruoli r ON p.codice_ruolo=r.codice_ruolo
GROUP BY s.settore,r.ruolo ORDER BY s.settore ASC,COUNT(p.id) DESC;`}
];
function App(){
 const[sql,setSql]=useState(presets[0].sql),[rows,setRows]=useState([]),[error,setError]=useState(''),[busy,setBusy]=useState(false),[active,setActive]=useState('tecnici'),[tab,setTab]=useState('presets');
 const[table,setTable]=useState('persone'),[columns,setColumns]=useState(['*']),[filters,setFilters]=useState([{field:'',op:'=',value:''}]),[order,setOrder]=useState(''),[limit,setLimit]=useState('100');
 useEffect(()=>{setColumns(['*']);setFilters([{field:'',op:'=',value:''}]);},[table]);
 const generated=useMemo(()=>{const cols=columns.includes('*')?'*':columns.join(', ');let q=`SELECT ${cols}\nFROM ${table}`;const v=filters.filter(f=>f.field&&f.value!=='');if(v.length)q+='\\nWHERE '+v.map(f=>{const val=f.value.replaceAll(\"'\",\"''\");const numeric=['eta','id','indice_operativo','livello_rad','capacita_unita'].includes(f.field)&&!isNaN(Number(f.value));const rhs=['IS NULL','IS NOT NULL'].includes(f.op)?'':numeric?f.value:`'${val}'`;return `${f.field} ${f.op}${rhs?' '+rhs:''}`}).join('\\n  AND ');if(order)q+=`\\nORDER BY ${order}`;if(limit)q+=`\\nLIMIT ${Math.min(1000,Math.max(1,Number(limit)||100))}`;return q+';'},[table,columns,filters,order,limit]);
 function addFilter(){setFilters([...filters,{field:'',op:'=',value:''}])}
 function uf(i,k,v){setFilters(filters.map((f,j)=>j===i?{...f,[k]:v}:f))}
 async function runQuery(){if(!supabase){setError('Configura VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.');return}setBusy(true);setError('');setRows([]);const r=await supabase.rpc('execute_sql',{query_text:sql});if(r.error)setError(r.error.message);else setRows(Array.isArray(r.data)?r.data:r.data?[r.data]:[]);setBusy(false)}
 return <div className="app"><div className="stars"/>
 <header className="hero"><div className="brand"><span className="orbit">✦</span><div><div className="kicker">COLONIA AURORA II · ANNO 2187</div><h1>Aurora <em>Query Console</em></h1></div></div><div className="bubble">Il sistema anagrafico è saltato.<br/><strong>Rimettiamo ordine nei dati!</strong></div></header>
 <main><section className="intro"><div><span className="badge">UFFICIO ANAGRAFE</span><h2>Interroga il database della colonia</h2><p>Costruisci una query, scegli una missione oppure scrivi direttamente SQL. La query eseguita resta sempre visibile.</p></div><div className="stats"><div><b>200</b><span>persone</span></div><div><b>5</b><span>unità</span></div><div><b>6</b><span>ruoli</span></div></div></section>
 <nav className="tabs"><button className={tab==='presets'?'active':''} onClick={()=>setTab('presets')}>Missioni già pronte</button><button className={tab==='builder'?'active':''} onClick={()=>setTab('builder')}>Generatore visuale</button><button className={tab==='sql'?'active':''} onClick={()=>setTab('sql')}>Console SQL</button></nav>
 {tab==='presets'&&<section className="preset-grid">{presets.map(p=><button className={'preset '+(active===p.id?'selected':'')} key={p.id} onClick={()=>{setActive(p.id);setSql(p.sql);setRows([]);setError('')}}><span className="tag">{p.tag}</span><strong>{p.title}</strong><small>{p.description}</small><span className="arrow">→</span></button>)}</section>}
 {tab==='builder'&&<section className="builder panel"><div className="panel-title"><div><span className="badge">QUERY BUILDER</span><h3>Costruisci la richiesta</h3></div><button className="run secondary" onClick={()=>{setSql(generated);setActive('');setTab('sql')}}>Usa questa query</button></div>
 <div className="builder-row"><label>Tabella<select value={table} onChange={e=>setTable(e.target.value)}>{Object.keys(schema).map(t=><option key={t}>{t}</option>)}</select></label><label>Ordinamento<select value={order} onChange={e=>setOrder(e.target.value)}><option value="">— nessuno —</option>{schema[table].map(c=><React.Fragment key={c}><option value={`${c} ASC`}>{c} ↑</option><option value={`${c} DESC`}>{c} ↓</option></React.Fragment>)}</select></label><label>Limite<input type="number" min="1" max="1000" value={limit} onChange={e=>setLimit(e.target.value)}/></label></div>
 <div className="field-list"><label>Campi da visualizzare</label><div className="checks"><label><input type="checkbox" checked={columns.includes('*')} onChange={()=>setColumns(columns.includes('*')?schema[table].slice(0,4):['*'])}/> tutti</label>{schema[table].map(c=><label key={c}><input type="checkbox" checked={columns.includes(c)} disabled={columns.includes('*')} onChange={e=>setColumns(e.target.checked?[...columns.filter(x=>x!=='*'),c]:columns.filter(x=>x!==c))}/>{c}</label>)}</div></div>
 <div className="filters"><div className="filter-head"><label>Filtri</label><button onClick={addFilter}>+ aggiungi filtro</button></div>{filters.map((f,i)=><div className="filter" key={i}><select value={f.field} onChange={e=>uf(i,'field',e.target.value)}><option value="">campo…</option>{schema[table].map(c=><option key={c}>{c}</option>)}</select><select value={f.op} onChange={e=>uf(i,'op',e.target.value)}><option>=</option><option>!=</option><option>&gt;</option><option>&lt;</option><option>&gt;=</option><option>&lt;=</option><option>IS NULL</option><option>IS NOT NULL</option></select><input value={f.value} placeholder="valore…" onChange={e=>uf(i,'value',e.target.value)}/>{filters.length>1&&<button className="remove" onClick={()=>setFilters(filters.filter((_,j)=>j!==i))}>×</button>}</div>)}</div></section>}
 {tab==='sql'&&<section className="panel sqlpanel"><div className="panel-title"><div><span className="badge">SQL</span><h3>Scrivi la tua query</h3></div><span className="hint">SELECT / WITH · sola lettura</span></div><textarea value={sql} onChange={e=>{setSql(e.target.value);setActive('')}} spellCheck="false"/><button className="run" onClick={runQuery}>{busy?'Esecuzione…':'▶ Esegui query'}</button></section>}
 <section className="query-preview panel"><div className="panel-title"><div><span className="badge cyan">QUERY GENERATA / SELEZIONATA</span><h3>Quello che il database sta per eseguire</h3></div><button className="run" onClick={runQuery} disabled={busy}>{busy?'…':'▶ Esegui'}</button></div><pre>{sql}</pre></section>
 <section className="results panel"><div className="panel-title"><div><span className="badge">RISULTATO</span><h3>{rows.length?`${rows.length} righe restituite`:'Nessun risultato ancora'}</h3></div>{rows.length>0&&<button className="ghost" onClick={()=>setRows([])}>pulisci</button>}</div>{error&&<div className="error">⚠ {error}</div>}{!error&&rows.length>0?<div className="table-wrap"><table><thead><tr>{Object.keys(rows[0]).map(k=><th key={k}>{k}</th>)}</tr></thead><tbody>{rows.map((r,i)=><tr key={i}>{Object.keys(rows[0]).map(k=><td key={k}>{r[k]===null?'—':String(r[k])}</td>)}</tr>)}</tbody></table></div>:!error&&<div className="empty">Lancia una missione: il registro di Aurora II ti aspetta.</div>}</section>
 <section className="schema-strip panel"><div><span className="badge">SCHEMA</span><h3>Le cinque tabelle della colonia</h3></div><div className="schema-cards">{Object.entries(schema).map(([t,c])=><div className="schema-card" key={t}><strong>{t}</strong><small>{c.join(' · ')}</small></div>)}</div></section></main>
 <footer>AURORA II · Database didattico · SELECT, JOIN, WHERE, GROUP BY, HAVING, ORDER BY e funzioni aggregate.</footer></div>
}
createRoot(document.getElementById('root')).render(<App/>);
