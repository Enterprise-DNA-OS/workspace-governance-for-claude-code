#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {getDb,REPO_ROOT} from './lib/db.mjs';
import {parseCsv} from './lib/csv.mjs';
import {table} from './lib/format.mjs';

const today=()=>new Date().toISOString().slice(0,10);
const text=(v,label)=>{if(typeof v!=='string'||!v.trim())throw Error(`Required ${label}`);return v.trim();};
function date(v,label,nullable=false){if(nullable&&(v===null||v===undefined||v===''))return null;v=text(v,label);if(!/^\d{4}-\d{2}-\d{2}$/.test(v)||!Number.isFinite(Date.parse(v+'T00:00:00Z'))||new Date(v+'T00:00:00Z').toISOString().slice(0,10)!==v)throw Error(`Invalid date ${label}: use YYYY-MM-DD`);return v;}
function integer(v,label,min=1,max=1000000){const s=String(v??'');if(!/^\d+$/.test(s)||Number(s)<min||Number(s)>max)throw Error(`Invalid ${label}`);return Number(s);}
function choice(v,values,label){v=text(v,label);if(!values.includes(v))throw Error(`${label} must be ${values.join(', ')}`);return v;}
const match=(rows,ref,keys,label)=>{ref=text(ref,label).toLowerCase();const exact=rows.filter(r=>keys.some(k=>String(r[k]??'').toLowerCase()===ref));const candidates=exact.length?exact:rows.filter(r=>keys.some(k=>String(r[k]??'').toLowerCase().includes(ref)));if(candidates.length!==1)throw Error(`${candidates.length?'Ambiguous':'No matching'} ${label}. Candidates: ${candidates.map(r=>`${r.id} ${r.code||r.external_id||r.name}`).join('; ')||rows.map(r=>`${r.id} ${r.code||r.external_id||r.name}`).join('; ')||'(none)'}`);return candidates[0];};
const fields=['external_id','name','service','owner_name','last_activity_on','sharing','sensitivity','retention_review_on','legal_hold'];
const aliases={external_id:['ID','Id','Object ID','External ID'],name:['Name','Display Name','DisplayName'],service:['Service','Type'],owner_name:['Owner','Owner Name'],last_activity_on:['Last Activity','Last Activity Date'],sharing:['Sharing','Sharing Scope'],sensitivity:['Sensitivity','Sensitivity Label'],retention_review_on:['Retention Review','Retention Review On'],legal_hold:['Legal Hold','Hold']};
const normalizedHeaders=Object.fromEntries(fields.map(f=>[f,[f,...aliases[f]]]));

export async function loadRows(file,sheet){
 if(path.extname(file).toLowerCase()==='.csv')return parseCsv(fs.readFileSync(file,'utf8'));
 if(path.extname(file).toLowerCase()!=='.xlsx')throw Error('Import needs .xlsx or .csv data, not a report definition');
 const {default:ExcelJS}=await import('exceljs');const book=new ExcelJS.Workbook();await book.xlsx.readFile(file);
 if(!sheet&&book.worksheets.length!==1)throw Error('Workbook has multiple sheets: use --sheet');
 const ws=sheet?book.getWorksheet(sheet):book.worksheets[0];if(!ws)throw Error('Worksheet not found');
 const matrix=[];ws.eachRow({includeEmpty:false},row=>{const cells=[];for(let i=1;i<=ws.columnCount;i++){const v=row.getCell(i).value;if(v===null)cells.push('');else if(v instanceof Date)cells.push(v.toISOString().slice(0,10));else if(['string','number','boolean'].includes(typeof v))cells.push(String(v));else throw Error('Spreadsheet must contain plain values, not formulas, links or rich text');}matrix.push(cells);});
 if(!matrix.length)return[];while(matrix[0].at(-1)==='')matrix.forEach(r=>r.pop());
 const csv=matrix.map(r=>r.map(v=>'"'+v.replaceAll('"','""')+'"').join(',')).join('\n');return parseCsv(csv);
}
function normalize(rows,mapping,sourceOn){
 if(!rows.length)throw Error('Empty export refused');const headers=Object.keys(rows[0]);const columns={};
 for(const f of fields){const wanted=mapping[f]?[text(mapping[f],f)]:normalizedHeaders[f];columns[f]=headers.find(h=>wanted.some(w=>h.toLowerCase()===w.toLowerCase()));if(mapping[f]&&!columns[f])throw Error(`Mapped column missing: ${mapping[f]}`);}
 for(const f of ['external_id','name','service'])if(!columns[f])throw Error(`Missing column ${f}; provide --map`);
 const ids=new Set();return rows.map((r,i)=>{const read=f=>columns[f]?String(r[columns[f]]??'').trim():'';const x={};
 x.external_id=text(read('external_id'),`ID row ${i+2}`);if(ids.has(x.external_id.toLowerCase()))throw Error(`Duplicate ID ${x.external_id}`);ids.add(x.external_id.toLowerCase());
 x.name=text(read('name'),'name');x.service=choice(read('service'),['Teams','SharePoint','OneDrive','PowerBI','Other'],'service');x.owner_name=read('owner_name')||null;
 x.last_activity_on=date(read('last_activity_on'),'last activity',true);if(x.last_activity_on&&x.last_activity_on>sourceOn)throw Error('Activity after source date');
 x.sharing=choice(read('sharing').toLowerCase()||'unknown',['internal','external','anonymous','unknown'],'sharing');
 x.sensitivity=choice(read('sensitivity').toLowerCase()||'unknown',['public','internal','confidential','restricted','unknown'],'sensitivity');
 x.retention_review_on=date(read('retention_review_on'),'retention review',true);
 x.legal_hold=choice(read('legal_hold').toLowerCase()||'unknown',['yes','no','unknown'],'legal hold');return x;
 });
}
const readReports={
 list:'select external_id,name,service,owner_name,source_on from workspace_inventory where tenant_id=$1 order by external_id',
 'owner-gaps':'select external_id,name,service from workspace_inventory where tenant_id=$1 and owner_name is null order by external_id',
 inactive:'select external_id,name,last_activity_on,legal_hold from workspace_inventory where tenant_id=$1 and (last_activity_on is null or last_activity_on<current_date-stale_days) order by external_id',
 'external-sharing':"select external_id,name,sharing,sensitivity,owner_name from workspace_inventory where tenant_id=$1 and sharing in ('external','anonymous','unknown') order by external_id",
 'retention-due':'select external_id,name,retention_review_on,legal_hold from workspace_inventory where tenant_id=$1 and (retention_review_on is null or retention_review_on<=current_date) order by external_id',
 compliance:'select external_id,name,rule,finding from governance_findings where tenant_id=$1 order by external_id,rule',
 reviews:'select id,external_id,name,kind,reviewer,due_on,status,decision,overdue,current_snapshot from review_register where tenant_id=$1 order by created_at,id',
 activity:'select actor,action,record_id,details,created_at from events where tenant_id=$1 order by created_at,id',
 snapshots:'select id,source_on,source_name,imported_by,row_count,created_at from snapshots where tenant_id=$1 order by source_on,created_at',
 summary:'select service,count(*) workspaces,count(*) filter(where owner_name is null) missing_owners,count(*) filter(where sharing in (\'external\',\'anonymous\')) externally_shared from workspace_inventory where tenant_id=$1 group by service order by service'
};
const options={
 help:[],tenants:[], 'create-tenant':['code','name','jurisdiction','stale-days','refresh-days','actor'], configure:['stale-days','refresh-days','actor','reason'],
 import:['file','map','sheet','source-on','expected','actor','dry-run'],show:['ref'],changes:[],attention:[],
 'open-review':['ref','kind','reviewer','due-on','actor'], decide:['review','decision','evidence','actor'], complete:['review','evidence','actor'],reopen:['review','reason','actor'],
 log:['note','actor'], 'weekly-review':[], 'draft-owner':['ref'],'draft-decision':['review'],export:['file'],
 ...Object.fromEntries(Object.keys(readReports).map(k=>[k,[]]))
};
export const commands=Object.keys(options).sort();
const writes=new Set(['create-tenant','configure','import','open-review','decide','complete','reopen','log']);
async function event(db,tenant,actor,action,id,details){await db.query('insert into events(tenant_id,actor,action,record_id,details) values($1,$2,$3,$4,$5)',[tenant.id,actor,action,id,JSON.stringify(details)]);}
async function tenantFor(db,o,lock=false){const tenants=await db.query('select * from tenants order by code');const t=match(tenants,o.tenant,['id','code','name'],'tenant');return lock?(await db.query('select * from tenants where id=$1 for update',[t.id]))[0]:t;}
async function workspaceFor(db,t,ref){return match(await db.query('select * from workspace_inventory where tenant_id=$1 order by external_id',[t.id]),ref,['id','external_id','name'],'workspace');}
async function reviewFor(db,t,ref){return match(await db.query('select * from review_register where tenant_id=$1 order by id',[t.id]),ref,['id','external_id','name'],'review');}
async function ensureFresh(db,t,r){if(!r.current_snapshot)throw Error('Review belongs to an older snapshot; open a new review');const [s]=await db.query('select source_on>=current_date-$2::integer fresh from current_snapshots where tenant_id=$1',[t.id,t.refresh_days]);if(!s?.fresh)throw Error('Source snapshot stale; import current evidence first');}
async function changes(db,t){
 const snaps=await db.query('select id from snapshots where tenant_id=$1 order by source_on desc,created_at desc,id desc limit 2',[t.id]);if(snaps.length<2)return[];
 const a=await db.query('select * from workspaces where snapshot_id=$1 order by external_id',[snaps[1].id]);const b=await db.query('select * from workspaces where snapshot_id=$1 order by external_id',[snaps[0].id]);const old=new Map(a.map(x=>[x.external_id,x]));const next=new Map(b.map(x=>[x.external_id,x]));const out=[];
 for(const key of [...new Set([...old.keys(),...next.keys()])].sort()){const before=old.get(key),after=next.get(key);if(!before||!after){out.push({external_id:key,change:before?'absent_from_snapshot':'added',field:'workspace',before:before?.name||null,after:after?.name||null});continue;}for(const f of fields.slice(1))if(before[f]!==after[f])out.push({external_id:key,change:'changed',field:f,before:before[f],after:after[f]});}return out;
}
async function execute(db,cmd,o,args,t){
 if(cmd==='help')return commands.map(command=>({command,options:options[command].map(x=>'--'+x).join(' ')}));
 if(cmd==='tenants')return db.query('select code,name,jurisdiction,stale_days,refresh_days from tenants order by code');
 if(cmd==='create-tenant'){
 const code=text(o.code,'code');if(!/^[A-Z][A-Z0-9-]{1,39}$/.test(code))throw Error('Code must be 2-40 uppercase letters, digits or hyphens');
 const [n]=await db.query('insert into tenants(code,name,jurisdiction,stale_days,refresh_days) values($1,$2,$3,$4,$5) returning *',[code,text(o.name,'name'),choice(o.jurisdiction,['NZ','AU','OTHER'],'jurisdiction'),integer(o['stale-days']??90,'stale-days',1,3650),integer(o['refresh-days']??30,'refresh-days',1,365)]);await event(db,n,o.actor,cmd,n.id,{code});return[n];
 }
 if(readReports[cmd])return db.query(readReports[cmd],[t.id]);
 if(cmd==='show')return[await workspaceFor(db,t,o.ref)];
 if(cmd==='configure'){if(o['stale-days']===undefined&&o['refresh-days']===undefined)throw Error('Provide a threshold');const reason=text(o.reason,'reason');const [after]=await db.query('update tenants set stale_days=$2,refresh_days=$3 where id=$1 returning *',[t.id,integer(o['stale-days']??t.stale_days,'stale-days',1,3650),integer(o['refresh-days']??t.refresh_days,'refresh-days',1,365)]);await event(db,t,o.actor,cmd,t.id,{before:t,after,reason});return[after];}
 if(cmd==='import'){
 if(args[0]!=='rencore'||args.length!==1)throw Error('Use import rencore');
 const sourceOn=date(o['source-on'],'source-on');if(sourceOn>today())throw Error('Source date cannot be in future');
 const file=path.resolve(text(o.file,'file'));const map=o.map?JSON.parse(fs.readFileSync(o.map,'utf8')):{};if(!map||Array.isArray(map)||typeof map!=='object'||Object.keys(map).some(k=>!fields.includes(k)))throw Error('Map must use known field names');
 const rows=normalize(await loadRows(file,o.sheet),map,sourceOn);const expected=integer(o.expected,'expected');if(expected!==rows.length)throw Error(`Row reconciliation failed: expected ${expected}, found ${rows.length}`);
 const fingerprint=crypto.createHash('sha256').update(JSON.stringify([...rows].sort((a,b)=>a.external_id.localeCompare(b.external_id)))).digest('hex');
 const prior=await db.query('select id from snapshots where tenant_id=$1 and source_on=$2 and fingerprint=$3',[t.id,sourceOn,fingerprint]);if(prior.length)return[{status:'unchanged',snapshot:prior[0].id,rows:rows.length}];
 const [latest]=await db.query('select source_on from current_snapshots where tenant_id=$1',[t.id]);if(latest&&sourceOn<latest.source_on)throw Error('Older source refused; use a separate review scope for historical data');
 if(o['dry-run'])return[{status:'validated',rows:rows.length,source_on:sourceOn,unknown_fields:rows.reduce((n,r)=>n+fields.filter(f=>r[f]===null||r[f]==='unknown').length,0)}];
 const [s]=await db.query('insert into snapshots(tenant_id,source_on,fingerprint,source_name,imported_by,row_count) values($1,$2,$3,$4,$5,$6) returning id',[t.id,sourceOn,fingerprint,path.basename(file),o.actor,rows.length]);
 for(const r of rows)await db.query(`insert into workspaces(snapshot_id,${fields.join(',')}) values(${Array.from({length:fields.length+1},(_,i)=>'$'+(i+1)).join(',')})`,[s.id,...fields.map(f=>r[f])]);
 await event(db,t,o.actor,cmd,s.id,{source_on:sourceOn,rows:rows.length,fingerprint});return[{status:'imported',snapshot:s.id,rows:rows.length}];
 }
 if(cmd==='changes')return changes(db,t);
 if(cmd==='attention'){const findings=await db.query('select external_id,name,rule,finding from governance_findings where tenant_id=$1 order by external_id,rule',[t.id]);const overdue=await db.query("select external_id,name,'REVIEW_OVERDUE' rule,'Review owned by '||reviewer||' due '||due_on::text finding from review_register where tenant_id=$1 and overdue order by due_on,id",[t.id]);if(!(await db.query('select id from current_snapshots where tenant_id=$1',[t.id])).length)findings.push({external_id:null,name:t.name,rule:'NO_SNAPSHOT',finding:'No source inventory imported'});return [...findings,...overdue];}
 if(cmd==='open-review'){
 const w=await workspaceFor(db,t,o.ref);const reviewer=text(o.reviewer,'reviewer');const due=date(o['due-on'],'due-on');
 const [r]=await db.query('insert into reviews(workspace_id,kind,reviewer,due_on,opened_by) values($1,$2,$3,$4,$5) returning *',[w.id,choice(o.kind,['ownership','sharing','retention','inactivity'],'kind'),reviewer,due,o.actor]);await event(db,t,o.actor,cmd,r.id,{workspace:w.external_id,kind:r.kind,reviewer,due});return[r];
 }
 if(['decide','complete','reopen'].includes(cmd)){
 const r=await reviewFor(db,t,o.review);await ensureFresh(db,t,r);
 if(cmd==='decide'){
 if(r.status!=='open')throw Error('Review must be open');if(o.actor.toLowerCase()===r.opened_by.toLowerCase())throw Error('Decision actor must differ from opener');if(o.actor.toLowerCase()!==r.reviewer.toLowerCase())throw Error('Decision actor must be assigned reviewer');const decision=choice(o.decision,['retain','archive','restrict','investigate'],'decision');if(decision==='archive'&&r.legal_hold!=='no')throw Error('Archive blocked: hold is yes or unknown');
 const evidence=text(o.evidence,'evidence');const [after]=await db.query("update reviews set status='decided',decision=$2,decision_evidence=$3,decided_by=$4 where id=$1 returning *",[r.id,decision,evidence,o.actor]);await event(db,t,o.actor,cmd,r.id,{decision,evidence});return[after];
 }
 if(cmd==='complete'){
 if(r.status!=='decided')throw Error('Review must be decided first');if(o.actor.toLowerCase()===r.decided_by.toLowerCase())throw Error('Completion verifier must differ from decision actor');const evidence=text(o.evidence,'evidence');const [after]=await db.query("update reviews set status='complete',completion_evidence=$2,completed_by=$3 where id=$1 returning *",[r.id,evidence,o.actor]);await event(db,t,o.actor,cmd,r.id,{evidence,meaning:'Operator-reported external verification; no tenant action executed'});return[after];
 }
 if(r.status==='open')throw Error('Already open');const reason=text(o.reason,'reason');const [after]=await db.query("update reviews set status='open',decision=null,decision_evidence=null,decided_by=null,completion_evidence=null,completed_by=null where id=$1 returning *",[r.id]);await event(db,t,o.actor,cmd,r.id,{before:r,reason});return[after];
 }
 if(cmd==='log'){await event(db,t,o.actor,cmd,null,{note:text(o.note,'note')});return[{status:'recorded'}];}
 if(cmd==='weekly-review')return {scope:t.code,summary:await execute(db,'summary',o,[],t),attention:await execute(db,'attention',o,[],t),reviews:await execute(db,'reviews',o,[],t)};
 if(cmd.startsWith('draft-')){
 const r=cmd==='draft-owner'?await workspaceFor(db,t,o.ref):await reviewFor(db,t,o.review);const dir=path.resolve(process.env.OUTPUT_DIR||REPO_ROOT,'drafts');fs.mkdirSync(dir,{recursive:true,mode:0o700});const file=path.join(dir,`${cmd}-${r.id}-${crypto.randomUUID()}.md`);
 const content=`# Draft for human review\n\nScope: ${t.code}\nWorkspace: ${r.name} (${r.external_id})\nSource date: ${r.source_on}\n\n${cmd==='draft-owner'?`Accountable owner: ${r.owner_name||'not recorded'}\nSharing: ${r.sharing}\nHold: ${r.legal_hold}\n\nOwner evidence needs a recorded review before any change.`:`Review: ${r.kind}\nStatus: ${r.status}\nRecommendation: ${r.decision||'not recorded'}\nDecision evidence: ${r.decision_evidence||'not recorded'}\nExternal completion evidence: ${r.completion_evidence||'not recorded'}`}\n\nThis draft sends nothing and changes no Microsoft settings.\n`;
 fs.writeFileSync(file,content,{flag:'wx',mode:0o600});return[{file}];
 }
 if(cmd==='export'){
 const file=path.resolve(text(o.file,'file'));const records=await db.query('select * from workspace_inventory where tenant_id=$1 order by external_id',[t.id]);let output;
 if(file.endsWith('.csv')){const quote=v=>'"'+String(v??'').replaceAll('"','""')+'"';output=[fields.map(quote).join(','),...records.map(r=>fields.map(f=>quote(r[f])).join(','))].join('\r\n')+'\r\n';}
 else if(file.endsWith('.json')){output=JSON.stringify({tenant:t,snapshots:await db.query('select * from snapshots where tenant_id=$1 order by source_on,created_at',[t.id]),workspaces:await db.query('select w.* from workspaces w join snapshots s on s.id=w.snapshot_id where s.tenant_id=$1 order by w.snapshot_id,w.external_id',[t.id]),reviews:await db.query('select * from review_register where tenant_id=$1 order by id',[t.id]),events:await db.query('select * from events where tenant_id=$1 order by created_at,id',[t.id])},null,2)+'\n';}
 else throw Error('Export file must end .csv or .json');fs.mkdirSync(path.dirname(file),{recursive:true,mode:0o700});fs.writeFileSync(file,output,{flag:'wx',mode:0o600});return[{file,rows:records.length}];
 }
 throw Error(`Unknown command ${cmd}`);
}
export async function run(db,cmd,o={},args=[]){
 if(!Object.hasOwn(options,cmd))throw Error(`Unknown command ${cmd}`);
 for(const key of Object.keys(o))if(![...options[cmd],'tenant','json'].includes(key))throw Error(`Unknown option --${key}`);
 if(cmd!=='import'&&args.length)throw Error('Unexpected positional argument');
 if(writes.has(cmd))o={...o,actor:text(o.actor,'actor')};
 await db.exec(writes.has(cmd)?'BEGIN':'BEGIN READ ONLY');
 try{const t=['help','tenants','create-tenant'].includes(cmd)?null:await tenantFor(db,o,writes.has(cmd));const result=await execute(db,cmd,o,args,t);await db.exec(o['dry-run']?'ROLLBACK':'COMMIT');return result;}catch(e){await db.exec('ROLLBACK');throw e;}
}
export function parseArgs(argv){const o={},args=[];let cmd=argv.shift()||'help';for(let i=0;i<argv.length;i++){const a=argv[i];if(!a.startsWith('--')){args.push(a);continue;}const eq=a.indexOf('=');const key=a.slice(2,eq<0?undefined:eq);if(Object.hasOwn(o,key))throw Error(`Duplicate --${key}`);if(['json','dry-run'].includes(key)){if(eq>=0)throw Error(`Use --${key} without a value`);o[key]=true;}else{const val=eq>=0?a.slice(eq+1):argv[++i];if(!val||val.startsWith('--'))throw Error(`Required value for --${key}`);o[key]=val;}}return{cmd,o,args};}
export function human(result){if(!Array.isArray(result))return Object.entries(result).map(([k,v])=>`\n${k.toUpperCase()}\n${Array.isArray(v)?human(v):v}`).join('\n');if(!result.length)return'(none)';return table(result,Object.keys(result[0]).map(key=>({key,label:key.replaceAll('_',' '),format:v=>typeof v==='object'&&v!==null?JSON.stringify(v):v})));}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){let db;try{const {cmd,o,args}=parseArgs(process.argv.slice(2));db=await getDb();const result=await run(db,cmd,o,args);console.log(o.json?JSON.stringify(result,null,2):human(result));}catch(e){console.error(e.message);process.exitCode=1;}finally{if(db)await db.close();}}
