/* Shared helpers for the Reports tab's Workshop functions (ported from the reporting app). */
const MASTER_CSV = 'data/masterdata.csv';
const DISTRIBUTORS = ["Concept Motorbike Company Pvt Limited","Gode Engineering Private Limited","JS Diesel Spares","MANISHA ENTERPRISES","MUKTI TRADERS","Rajdeep Automotives","SHREE KRISHNA AGENCIES","SRI SAINATH AGENCIES","Sukan Incorporation(Surat)"];
const DB_NAME_ALIASES = {"Rajdeep Automotives":["RAJDEEP AUTOMOTIVES PRIVATE LIMITED - Karimnagar"]};
const LOOKUP_KEY_ALIASES = {
  shareCode:['sharecode','workshopcode'],
  bizomId:['bizomid','linkedbizom'],
  mobile:['mobile','mobilenumber','mobileno','phonenumber','userid']
};
let masterDataRows=null, masterDataHeaders=null, masterPromise=null;
function loadMasterData(){
  if(masterPromise) return masterPromise;
  masterPromise = new Promise((resolve,reject)=>{
    Papa.parse(MASTER_CSV,{download:true,header:true,skipEmptyLines:true,
      complete:r=>{masterDataRows=r.data;masterDataHeaders=r.meta.fields||[];resolve({rows:masterDataRows,headers:masterDataHeaders});},
      error:e=>{masterPromise=null;reject(e);}});
  });
  return masterPromise;
}
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function xlNormKey(s){return String(s||'').toLowerCase().replace(/[^a-z0-9]/g,'');}
function detectLookupColumns(headers){
  const normed=headers.map(h=>({orig:h,norm:xlNormKey(h)})),out={};
  Object.keys(LOOKUP_KEY_ALIASES).forEach(k=>{const f=normed.find(h=>LOOKUP_KEY_ALIASES[k].includes(h.norm));out[k]=f?f.orig:null;});
  return out;
}
function xlMakeSheet(headers,rows){
  const ws=XLSX.utils.aoa_to_sheet([headers].concat(rows));
  ws['!cols']=headers.map((h,c)=>{let w=String(h).length;for(let r=0;r<Math.min(rows.length,300);r++){const l=String(rows[r][c]==null?'':rows[r][c]).length;if(l>w)w=l;}return{wch:Math.min(Math.max(w+2,10),45)};});
  if(rows.length) ws['!autofilter']={ref:XLSX.utils.encode_range({s:{r:0,c:0},e:{r:rows.length,c:headers.length-1}})};
  return ws;
}
function xlSheetName(name,used){
  const base=String(name||'Sheet').replace(/[\[\]:*?\/\\]/g,' ').replace(/\s+/g,' ').trim().slice(0,31)||'Sheet';
  let out=base,n=2;
  while(used[out.toLowerCase()]){const sfx=' ('+n++ +')';out=base.slice(0,31-sfx.length)+sfx;}
  used[out.toLowerCase()]=true;return out;
}
function xlFileSafe(s){return String(s||'').replace(/[^A-Za-z0-9]+/g,'_').replace(/^_+|_+$/g,'').slice(0,40);}
const IST_OFFSET_MS=5.5*3600*1000;
function istDateStr(d){return new Date((d?d.getTime():Date.now())+IST_OFFSET_MS).toISOString().slice(0,10);}
function dbNameKey(s){return String(s==null?'':s).trim().replace(/\s+/g,' ').toLowerCase();}
function dbColumn(){return (masterDataHeaders||[]).find(h=>xlNormKey(h)==='distributorname')||null;}
function dbWorkshopRows(db){
  const col=dbColumn();if(!col)return[];
  const keys=[db].concat(DB_NAME_ALIASES[db]||[]).map(dbNameKey);
  return masterDataRows.filter(r=>keys.indexOf(dbNameKey(r[col]))!==-1);
}
let _tt;
function toast(msg){let t=document.getElementById('toast');if(!t){t=document.createElement('div');t.id='toast';document.body.appendChild(t);}t.textContent=msg;t.classList.add('on');clearTimeout(_tt);_tt=setTimeout(()=>t.classList.remove('on'),2800);}
