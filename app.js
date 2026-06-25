/* 互动英语词汇学习包 — 逻辑层 */
(function(){
const V = window.VOCAB;
const $ = s => document.querySelector(s);
const main = $('#main');
const shuffle = a => { a=a.slice(); for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];} return a; };
const SPK='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H2v6h4l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a9 9 0 0 1 0 14"/></svg>';
const say = w => `<button class="say" data-w="${(w||'').replace(/"/g,'&quot;')}" aria-label="朗读 ${w}" title="朗读">${SPK}</button>`;

/* ---------- 模块定义 ---------- */
const MODULES = [
 {key:'prefixes', ic:'⊕', col:'var(--accent)', bg:'var(--accent-soft)', title:'前缀', sub:'用词头批量推词', modes:['browse','flashcard','quiz']},
 {key:'suffixes', ic:'⊗', col:'var(--teal)', bg:'var(--teal-soft)', title:'后缀', sub:'变换词性与词义', modes:['browse','flashcard','quiz']},
 {key:'formation', ic:'⚙', col:'var(--gold)', bg:'var(--gold-soft)', title:'其他构词法', sub:'合成·转换·缩略·屈折', modes:['browse']},
 {key:'families', ic:'🌳', col:'var(--teal)', bg:'var(--teal-soft)', title:'同族词', sub:'一根多词，成串记忆', modes:['browse','flashcard','quiz']},
 {key:'homophones', ic:'🔊', col:'var(--blue)', bg:'var(--blue-soft)', title:'同音异义', sub:'音同形异，对比辨别', modes:['browse','flashcard','quiz']},
 {key:'polysemy', ic:'⇆', col:'var(--purple)', bg:'var(--purple-soft)', title:'一词多义', sub:'同一拼写，多种含义', modes:['browse','flashcard','quiz']},
 {key:'heteronyms', ic:'♪', col:'var(--blue)', bg:'var(--blue-soft)', title:'同形异音', sub:'重音/读音变，词义变', modes:['browse','flashcard','quiz']},
 {key:'synonyms', ic:'≈', col:'var(--purple)', bg:'var(--purple-soft)', title:'近义词辨析', sub:'相近词的用法区别', modes:['browse','flashcard','quiz']},
 {key:'antonyms', ic:'⇄', col:'var(--accent)', bg:'var(--accent-soft)', title:'反义词', sub:'成对掌握，事半功倍', modes:['browse','flashcard','quiz']},
 {key:'britam', ic:'🌍', col:'var(--blue)', bg:'var(--blue-soft)', title:'英美差异', sub:'用词·拼写·发音', modes:['browse','flashcard','quiz']},
 {key:'thematic', ic:'📚', col:'var(--gold)', bg:'var(--gold-soft)', title:'主题词汇', sub:'按类别成组记忆', modes:['browse','flashcard']},
 {key:'phonics', ic:'🔤', col:'var(--teal)', bg:'var(--teal-soft)', title:'读音规则', sub:'看词能读 · 自然拼读', modes:['browse']}
];
const MOD = Object.fromEntries(MODULES.map(m=>[m.key,m]));
const COUNTS = {
 prefixes:V.prefixes.length, suffixes:V.suffixes.length,
 formation:Object.keys(V.formation).length, families:V.families.length,
 homophones:V.homophones.length, polysemy:V.polysemy.length,
 heteronyms:V.heteronyms.length, synonyms:V.synonyms.length, antonyms:V.antonyms.length
};

/* ---------- 进度（localStorage） ---------- */
const PKEY='engvocab.progress.v1';
let progress = (()=>{ try{return JSON.parse(localStorage.getItem(PKEY))||{}}catch(e){return {}} })();
const save = ()=>{ try{localStorage.setItem(PKEY,JSON.stringify(progress))}catch(e){} };
const known = mod => progress[mod] ? Object.keys(progress[mod]).length : 0;
const isKnown = (mod,k)=> !!(progress[mod] && progress[mod][k]);
function setKnown(mod,k,v){ progress[mod]=progress[mod]||{}; if(v) progress[mod][k]=1; else delete progress[mod][k]; save(); }

/* ---------- 卡片/测验生成 ---------- */
function deckOf(mod){
 if(mod==='prefixes'||mod==='suffixes'){
   const out=[]; V[mod].forEach(a=>a.ex.forEach(e=>out.push(
     {k:a.a+'|'+e[2], front:e[0], hint:'+ '+a.a+'  →  ?', back:e[2], mc:e[3], sub:e[0]+' '+e[1]+'  ·  '+(a.mc)})));
   return out;
 }
 if(mod==='polysemy') return V.polysemy.map(p=>({k:p.w, front:p.w, hint:'有哪些意思？', back:p.w, mc:p.senses.map(s=>s[0]+' '+s[1]).join('  /  '), sub:'一词多义'}));
 if(mod==='families'){ const out=[]; V.families.forEach(f=>f.members.forEach(m=>out.push(
     {k:f.root+'|'+m[0], front:m[2], hint:'('+m[1]+')  词根 '+f.root+'  →  英文?', back:m[0], mc:m[2], sub:'同族词 · '+f.root}))); return out; }
 if(mod==='heteronyms') return V.heteronyms.map(h=>({k:h.w, front:h.w, hint:'两种读法与词义？', back:h.w, mc:h.readings.map(r=>'/'+r[0]+'/  '+r[1]+'  '+r[2]).join('\n'), sub:'同形异音'}));
 if(mod==='antonyms') return V.antonyms.map(p=>({k:p.a[0]+'|'+p.b[0], front:p.a[0], hint:p.a[1]+'  的反义词?', back:p.b[0], mc:p.b[1], sub:'反义词'}));
 if(mod==='homophones'){ const out=[]; V.homophones.forEach(h=>h.words.forEach(w=>out.push(
   {k:h.ipa+'|'+w[0], front:w[1], hint:'/'+h.ipa+'/  —  怎么拼?', back:w[0], mc:w[1]+'   /'+h.ipa+'/', sub:'同音异义 · 听音辨形'}))); return out; }
 if(mod==='synonyms'){ const out=[]; V.synonyms.forEach(s=>s.group.forEach(g=>out.push(
   {k:(s.note||s.cat)+'|'+g[0], front:g[0], hint:'意思 / 用法?', back:g[0], mc:g[1], sub:'近义辨析 · '+(s.note||s.cat)}))); return out; }
 if(mod==='thematic'){ const out=[]; V.thematic.forEach(c=>c.items.forEach(it=>out.push(
   {k:c.cat+'|'+it[0], front:it[1], hint:'('+c.cat+')  英文?', back:it[0], mc:it[1], sub:'主题词汇 · '+c.cat}))); return out; }
 if(mod==='britam'){ const out=[];
   V.britam.vocab.forEach(v=>out.push({k:'v|'+v[0], front:v[0]+'  (英)', hint:v[2]+'  —  美式怎么说?', back:v[1], mc:v[2]+'   （美式）', sub:'英美差异 · 用词'}));
   V.britam.spelling.forEach(s=>out.push({k:'s|'+s.b, front:s.b+'  (英)', hint:'美式拼写?', back:s.b2, mc:s.cn, sub:'英美差异 · 拼写'})); return out; }
 return [];
}
function quizOf(mod){
 if(mod==='prefixes'||mod==='suffixes'){ const all=V[mod].flatMap(a=>a.ex.map(e=>({d:e[2],cn:e[3]})));
   return all.map(x=>{ const pool=all.filter(y=>y.cn!==x.cn);
     const opts=shuffle([x.cn,...shuffle(pool).slice(0,3).map(y=>y.cn)]);
     return {stem:x.d, sub:'选出它的意思', answer:x.cn, options:opts}; }); }
 if(mod==='antonyms') return V.antonyms.map(p=>{
   const pool=V.antonyms.filter(x=>x.cat===p.cat&&x.b[0]!==p.b[0]).map(x=>x.b[0]);
   const opts=shuffle([p.b[0],...shuffle(pool).slice(0,3)]);
   return {stem:p.a[0], sub:p.a[1]+'  —  选出反义词', answer:p.b[0], options:opts};
 });
 if(mod==='homophones') return V.homophones.map(h=>{
   const t=h.words[0]; let opts=h.words.map(w=>w[0]);
   if(opts.length<4){ const others=shuffle(V.homophones.flatMap(x=>x.words.map(w=>w[0])).filter(w=>!opts.includes(w))); opts=opts.concat(others.slice(0,4-opts.length)); }
   return {stem:'/'+h.ipa+'/', sub:t[1]+'  —  选出对应拼写', answer:t[0], options:shuffle(opts)};
 });
 if(mod==='families'){ const all=V.families.flatMap(f=>f.members.map(m=>({w:m[0],pos:m[1],cn:m[2],root:f.root})));
   return all.map(m=>{ const pool=all.filter(x=>x.w!==m.w);
     const opts=shuffle([m.w,...shuffle(pool).slice(0,3).map(x=>x.w)]);
     return {stem:m.cn+'   ('+m.pos+')', sub:'词根 '+m.root+'  —  选出对应单词', answer:m.w, options:opts}; }); }
 if(mod==='polysemy'){ const allSenses=[...new Set(V.polysemy.flatMap(p=>p.senses.map(s=>s[1])))];
   return V.polysemy.map(p=>{ const correct=p.senses[0][1];
     const distract=shuffle(allSenses.filter(s=>!p.senses.some(x=>x[1]===s))).slice(0,3);
     return {stem:p.w, sub:'选出它的含义之一', answer:correct, options:shuffle([correct,...distract])}; }); }
 if(mod==='heteronyms'){ return V.heteronyms.map(h=>{ const t=h.readings[0];
     const opts=h.readings.map(r=>'/'+r[0]+'/ ('+r[1]+')');
     return {stem:h.w+'  —  '+t[2], sub:'选出对应的读法', answer:'/'+t[0]+'/ ('+t[1]+')', options:shuffle(opts)}; }); }
 if(mod==='synonyms'){ const allGloss=[...new Set(V.synonyms.flatMap(s=>s.group.map(g=>g[1])))];
   return V.synonyms.flatMap(s=>s.group.map(g=>{ let opts=s.group.map(x=>x[1]);
     if(opts.length<3) opts=opts.concat(shuffle(allGloss.filter(x=>!opts.includes(x))).slice(0,3-opts.length));
     return {stem:g[0], sub:'选出它的含义 / 用法', answer:g[1], options:shuffle(opts)}; })); }
 if(mod==='britam'){ const all=V.britam.vocab;
   return all.map(v=>{ const pool=all.filter(x=>x[1]!==v[1]).map(x=>x[1]);
     const opts=shuffle([v[1],...shuffle(pool).slice(0,3)]);
     return {stem:v[0]+'  (英式)', sub:v[2]+'  —  选出美式说法', answer:v[1], options:opts}; }); }
 return [];
}

/* ---------- 路由 ---------- */
let state={mod:'home',mode:'browse'};
function go(mod,mode){ state.mod=mod; state.mode=mode||(MOD[mod]?MOD[mod].modes[0]:'browse'); $('#search').value=''; render(); window.scrollTo(0,0); paintTabs(); }
window.__go=go;

function paintTabs(){
 document.querySelectorAll('.tab').forEach(t=>t.classList.toggle('on', t.dataset.k===state.mod));
}

/* ---------- 渲染主入口 ---------- */
function render(){
 if(state.mod==='home') return renderHome();
 if(state.mod==='search') return; // handled by search handler
 const m=MOD[state.mod];
 let body='';
 if(state.mode==='flashcard') body='<div id="dyn"></div>';
 else if(state.mode==='quiz') body='<div id="dyn"></div>';
 else body=renderBrowse(state.mod);
 main.innerHTML = secHeader(m) + body;
 if(state.mode==='flashcard') startFlash(state.mod);
 if(state.mode==='quiz') startQuiz(state.mod);
}

function secHeader(m){
 const descs={prefixes:'词头改变词义。掌握常见前缀，遇到生词能先猜出大意。',
  suffixes:'词尾改变词性（动词→名词、名词→形容词…）。后缀是扩充词汇量最快的杠杆。',
  formation:'派生之外的四种造词法：把已知的词拼、转、缩、变，生出新词。',
  families:'同一词根派生出的一串词。记住一个根，顺藤摸出一片。',
  homophones:'读音相同、拼写和意思不同的词。放在一起对比，避免听写出错。',
  polysemy:'同一个拼写承载多个意思，靠上下文判断。',
  heteronyms:'拼写相同，但重音或读音不同，意思也随之改变（名词重音在前，动词在后）。',
  synonyms:'意思相近但用法有别。辨析清楚才能用得地道。',
  antonyms:'成对的反义词。一起记忆，相互强化。',
  britam:'同一个意思，英国和美国在用词、拼写、发音上常有差别。对照着记，读写都不出错。',
  thematic:'把同一场景的词按类别成组记忆，用时成串提取。',
  phonics:'字母与读音的对应规律。掌握后看到生词也能读出来——每个例词都可点击朗读。'};
 let modes='';
 if(m.modes.length>1){
   modes='<div class="modes">'+m.modes.map(md=>{
     const lbl={browse:'浏览',flashcard:'抽认卡',quiz:'测验'}[md];
     return `<button class="${state.mode===md?'on':''}" onclick="__setMode('${md}')">${lbl}</button>`;
   }).join('')+'</div>';
 }
 return `<div class="sec-h"><h2>${m.title}</h2><div class="desc">${descs[m.key]||''}</div>${modes}</div>`;
}
window.__setMode=md=>{ state.mode=md; render(); };

/* ---------- 首页 ---------- */
function renderHome(){
 const cards=MODULES.map(m=>{
   const tot=deckTotal(m.key); const kn=known(m.key);
   const pct=tot?Math.round(kn/tot*100):0;
   let cnt;
   if(m.key==='formation') cnt='4 类';
   else if(m.key==='phonics') cnt='拼读规则';
   else if(m.key==='thematic') cnt=V.thematic.length+' 类';
   else if(m.key==='britam') cnt=V.britam.vocab.length+' 组';
   else cnt=COUNTS[m.key]+' 组';
   const prog = (m.modes.includes('flashcard')||m.modes.includes('quiz'))&&tot?`<p style="margin-top:8px;font-size:12px;color:var(--ink-2)">已掌握 ${kn}/${tot} · ${pct}%</p>`:'';
   return `<div class="mod" onclick="__go('${m.key}')">
     <div class="ic" style="background:${m.bg};color:${m.col}">${m.ic}</div>
     <span class="cnt">${cnt}</span>
     <h3>${m.title}</h3><p>${m.sub}</p>${prog}</div>`;
 }).join('');
 const totalWords = estimateWords();
 main.innerHTML = `
 <div class="hero">
   <h1>WordTree 词树<span class="owner">（Shirley专用软件）</span></h1>
   <div class="sub">不要孤立地死记单词。把词按 <b>音、形、义、根</b> 成组归纳，相互联系着记——这是本资料的核心方法。从下面任选一个模块开始：浏览成组词表，或用抽认卡 / 测验主动回忆。</div>
   <div class="from">改编自《怎样学习英语词汇》（董石祥编，南宁师专英语科，1978）· 方法框架取自原书，例词已现代化、勘误并补充常用词 · 共收录约 ${totalWords}+ 词条</div>
 </div>
 <div class="grid">${cards}</div>`;
}
function deckTotal(mod){
 if(mod==='formation') return 0;
 if(MOD[mod].modes.includes('flashcard')) return deckOf(mod).length;
 if(MOD[mod].modes.includes('quiz')) return quizOf(mod).length;
 return 0;
}
function estimateWords(){
 let n=0;
 V.prefixes.forEach(a=>n+=a.ex.length*2); V.suffixes.forEach(a=>n+=a.ex.length*2);
 V.families.forEach(f=>n+=f.members.length); n+=V.homophones.reduce((s,h)=>s+h.words.length,0);
 n+=V.polysemy.length+V.heteronyms.length*2+V.antonyms.length*2;
 V.synonyms.forEach(s=>n+=s.group.length);
 Object.values(V.formation).forEach(m=>m.groups.forEach(g=>n+=g.items.length));
 n+=V.britam.vocab.length*2+V.britam.spelling.length;
 V.thematic.forEach(c=>n+=c.items.length);
 V.phonics.vowels.forEach(v=>v.rows.forEach(r=>n+=r.ex.length));
 V.phonics.combos.forEach(c=>n+=c.ex.length); V.phonics.consonants.forEach(c=>n+=c.ex.length);
 return Math.round(n/10)*10;
}

/* ---------- 浏览视图 ---------- */
function renderBrowse(mod){
 if(mod==='prefixes'||mod==='suffixes') return browseAffix(mod);
 if(mod==='formation') return browseFormation();
 if(mod==='families') return browseFamilies();
 if(mod==='homophones') return browseHomophones();
 if(mod==='polysemy') return browsePolysemy();
 if(mod==='heteronyms') return browseHeteronyms();
 if(mod==='synonyms') return browseSynonyms();
 if(mod==='antonyms') return browseAntonyms();
 if(mod==='britam') return browseBritam();
 if(mod==='thematic') return browseThematic();
 if(mod==='phonics') return browsePhonics();
 return '';
}
function affixCard(a){
 const ex=a.ex.map(e=>`<div class="ex"><span class="b">${e[0]} ${e[1]}</span><span class="ar2">→</span><span class="d">${e[2]}</span>${say(e[2])}<span class="dc">${e[3]}</span></div>`).join('');
 const note=a.note?`<div class="note">${a.note}</div>`:'';
 const sub=a.cat?(a.cat+' · '+a.me):(a.me);
 return `<div class="affix"><div class="affix-top" onclick="this.parentNode.classList.toggle('open')">
   <span class="chip">${a.a}</span><div class="m"><b>${a.mc}</b><span>${sub}${a.form?' · '+a.form:''}</span></div>
   <span class="ar">▾</span></div><div class="affix-body">${ex}${note}</div></div>`;
}
function browseAffix(mod){
 const list=V[mod]; let html='<div class="affix-list">';
 if(mod==='prefixes'){
   const groups=['否定','反向','重复','使役','时序','方位','数量'];
   const names={否定:'否定 / 相反',反向:'反对 / 反向',重复:'重复 / 再',使役:'使役（变为…）',时序:'时间 / 顺序',方位:'方位 / 空间',数量:'数量 / 程度'};
   groups.forEach(g=>{ const items=list.filter(a=>a.g===g); if(!items.length)return;
     html+=`<div class="cat-band">${names[g]}</div>`+items.map(affixCard).join(''); });
 } else {
   const cats=[...new Set(list.map(a=>a.cat))];
   cats.forEach(c=>{ html+=`<div class="cat-band">${c}</div>`+list.filter(a=>a.cat===c).map(affixCard).join(''); });
 }
 return html+'</div>';
}
function browseFormation(){
 let html='';
 Object.values(V.formation).forEach(m=>{
   html+=`<div class="syn" style="margin-bottom:16px"><div class="hd" style="font-size:14px;color:var(--gold);background:var(--gold-soft)">${m.title}</div>
     <p style="margin:2px 0 12px;color:var(--ink-2);font-size:14px">${m.def}</p>`;
   m.groups.forEach(g=>{
     html+=`<div class="cat-band" style="grid-column:auto;margin:10px 0 6px">${g.label}</div><div class="pair-list" style="margin-bottom:4px">`;
     g.items.forEach(it=>{ html+=`<div class="pcard" style="padding:10px 13px"><div class="w"><b>${it[0]}</b></div><div class="w"><span class="mc">${it[1]}</span></div></div>`; });
     html+='</div>';
   });
   html+='</div>';
 });
 return html;
}
function browseFamilies(){
 return '<div class="affix-list">'+V.families.map(f=>{
   const mem=f.members.map(m=>`<div class="mem"><b>${m[0]}</b>${say(m[0])}<span class="pos">${m[1]}</span><span class="mc">${m[2]}</span></div>`).join('');
   const note=f.note?`<div class="note">${f.note}</div>`:'';
   return `<div class="fam"><span class="root">${f.root}</span>${mem}${note}</div>`;
 }).join('')+'</div>';
}
function browseHomophones(){
 return '<div class="pair-list">'+V.homophones.map(h=>{
   const w=h.words.map(x=>`<div class="w"><b>${x[0]}</b>${say(x[0])}<span class="mc">${x[1]}</span></div>`).join('');
   return `<div class="pcard"><span class="ipa">/${h.ipa}/</span>${w}</div>`;
 }).join('')+'</div>';
}
function browsePolysemy(){
 return '<div class="pair-list">'+V.polysemy.map(p=>{
   const s=p.senses.map(x=>`<div class="w"><span class="pos" style="background:var(--purple)">${x[0]}</span><span class="mc">${x[1]}</span></div>`).join('');
   return `<div class="pcard"><div class="w" style="margin-bottom:4px"><b style="font-size:18px;font-family:var(--serif)">${p.w}</b>${say(p.w)}</div>${s}</div>`;
 }).join('')+'</div>';
}
function browseHeteronyms(){
 return '<div class="pair-list">'+V.heteronyms.map(h=>{
   const r=h.readings.map(x=>`<div class="w"><span class="ipa" style="margin:0">/${x[0]}/</span><span class="pos">${x[1]}</span><span class="mc">${x[2]}</span></div>`).join('');
   return `<div class="pcard"><div class="w" style="margin-bottom:6px"><b style="font-size:18px;font-family:var(--serif)">${h.w}</b>${say(h.w)}</div>${r}</div>`;
 }).join('')+'</div>';
}
function browseSynonyms(){
 const cats=[...new Set(V.synonyms.map(s=>s.cat))]; let html='<div class="affix-list">';
 cats.forEach(c=>{ html+=`<div class="cat-band">${c}</div>`+V.synonyms.filter(s=>s.cat===c).map(s=>{
   const it=s.group.map(g=>`<div class="it"><b>${g[0]}</b>${say(g[0])}<span>${g[1]}</span></div>`).join('');
   return `<div class="syn"><div class="hd">${s.note||c}</div>${it}</div>`;
 }).join(''); });
 return html+'</div>';
}
function browseAntonyms(){
 const cats=[...new Set(V.antonyms.map(p=>p.cat))]; let html='<div class="affix-list">';
 cats.forEach(c=>{ html+=`<div class="cat-band">${c}</div>`+V.antonyms.filter(p=>p.cat===c).map(p=>
   `<div class="pcard"><div class="anto"><div class="side"><b>${p.a[0]}</b>${say(p.a[0])}<span class="mc">${p.a[1]}</span></div><span class="ar3">⇄</span><div class="side r"><b>${p.b[0]}</b>${say(p.b[0])}<span class="mc">${p.b[1]}</span></div></div></div>`
 ).join(''); });
 return html+'</div>';
}

function browseBritam(){
 let h='<div class="affix-list">';
 h+='<div class="cat-band">用词差异（英 → 美）</div><div class="pair-list" style="grid-column:1/-1">';
 h+=V.britam.vocab.map(v=>`<div class="pcard"><div class="anto"><div class="side"><b>${v[0]}</b>${say(v[0])}<span class="mc">英</span></div><span class="ar3">→</span><div class="side r"><b>${v[1]}</b>${say(v[1])}<span class="mc">美</span></div></div><div style="text-align:center;font-size:12.5px;color:var(--ink-2);margin-top:5px">${v[2]}</div></div>`).join('');
 h+='</div><div class="cat-band">拼写差异</div><div class="pair-list" style="grid-column:1/-1">';
 h+=V.britam.spelling.map(s=>`<div class="pcard"><div class="ipa" style="color:var(--gold);background:var(--gold-soft)">${s.p}</div><div class="anto"><div class="side"><b>${s.b}</b>${say(s.b)}<span class="mc">英</span></div><span class="ar3">→</span><div class="side r"><b>${s.b2}</b>${say(s.b2)}<span class="mc">美</span></div></div><div style="font-size:12.5px;color:var(--ink-2);margin-top:6px">${s.cn}</div></div>`).join('');
 h+='</div><div class="cat-band">发音差异</div>';
 h+=V.britam.pronun.map(p=>{ const ex=p.ex.map(e=>`<span class="phw">${e[0]}${say(e[0])}<i>${e[1]}</i></span>`).join('');
   return `<div class="affix" style="grid-column:1/-1"><div class="affix-top" style="cursor:default"><div class="m"><b>${p.rule}</b><span>英 [${p.b}]　→　美 [${p.a}]</span></div></div><div class="affix-body" style="display:block"><div class="pex">${ex}</div></div></div>`; }).join('');
 return h+'</div>';
}
function browseThematic(){
 return '<div class="affix-list">'+V.thematic.map(c=>{
   const items=c.items.map(it=>`<div class="mem"><b>${it[0]}</b>${say(it[0])}<span class="mc">${it[1]}</span></div>`).join('');
   return `<div class="fam"><span class="root" style="color:var(--gold);background:var(--gold-soft)">${c.cat} · ${c.en}</span>${items}</div>`;
 }).join('')+'</div>';
}
function browsePhonics(){
 const exHtml=arr=>arr.map(e=>`<span class="phw">${e[0]}${say(e[0])}<i>${e[1]}</i></span>`).join('');
 let h='<div class="cat-band">单个元音字母</div><div class="affix-list">';
 V.phonics.vowels.forEach(v=>{ const rows=v.rows.map(r=>`<div class="prow"><span class="pipa">[${r.ipa}]</span><span class="pcond">${r.cond}</span><div class="pex">${exHtml(r.ex)}</div></div>`).join('');
   h+=`<div class="affix" style="grid-column:1/-1"><div class="affix-top" style="cursor:default"><span class="chip" style="background:var(--teal-soft);color:var(--teal)">${v.l}</span><div class="m"><b>字母 ${v.l}</b></div></div><div class="affix-body" style="display:block">${rows}</div></div>`; });
 h+='</div><div class="cat-band">元音字母组合</div><div class="pair-list">';
 V.phonics.combos.forEach(c=>h+=`<div class="pcard"><div class="ipa" style="color:var(--teal);background:var(--teal-soft)">${c.c}　[${c.ipa}]</div><div class="pex">${exHtml(c.ex)}</div></div>`);
 h+='</div><div class="cat-band">辅音字母 / 组合</div><div class="pair-list">';
 V.phonics.consonants.forEach(c=>h+=`<div class="pcard"><div class="ipa" style="color:var(--teal);background:var(--teal-soft)">${c.c}　[${c.ipa}]</div>${c.note?`<div style="font-size:12px;color:var(--ink-2);margin-bottom:4px">${c.note}</div>`:''}<div class="pex">${exHtml(c.ex)}</div></div>`);
 h+='</div><div class="cat-band">不发音的字母</div><div class="pair-list">';
 V.phonics.silent.forEach(s=>h+=`<div class="pcard"><div class="ipa" style="color:var(--accent);background:var(--accent-soft)">${s.l}</div><div class="pex">${exHtml(s.ex)}</div></div>`);
 h+='</div><div class="cat-band">常见词尾</div><div class="pair-list">';
 V.phonics.endings.forEach(c=>h+=`<div class="pcard"><div class="ipa" style="color:var(--teal);background:var(--teal-soft)">${c.c}　[${c.ipa}]</div><div class="pex">${exHtml(c.ex)}</div></div>`);
 h+='</div><div class="cat-band">音节与重读规律</div>';
 h+='<div class="syn">'+V.phonics.stress.map(s=>`<div class="it" style="display:block;padding:8px 0"><span style="font-size:14px;line-height:1.6">${s}</span></div>`).join('')+'</div>';
 return h;
}

/* ---------- 抽认卡引擎 ---------- */
let fc={};
function startFlash(mod){
 const all=deckOf(mod);
 const unknown=all.filter(c=>!isKnown(mod,c.k));
 let pool=shuffle(unknown.length?unknown:all).slice(0,20);
 if(pool.length<Math.min(20,all.length)){ const fill=shuffle(all.filter(c=>!pool.includes(c))); pool=pool.concat(fill).slice(0,Math.min(20,all.length)); }
 fc={mod,pool,i:0,flip:false,right:0};
 drawFlash();
}
function drawFlash(){
 const d=$('#dyn'); if(!d) return;
 if(fc.i>=fc.pool.length){
   d.innerHTML=`<div class="fc-done"><div class="big">🎉</div><h3>本组完成</h3>
     <p>认识 ${fc.right} / ${fc.pool.length} · 已掌握累计 ${known(fc.mod)}/${deckOf(fc.mod).length}</p>
     <div class="fc-actions"><button class="btn primary" onclick="__flashAgain()">再来一组</button>
     <button class="btn" onclick="__go('${fc.mod}','browse')">回到浏览</button></div></div>`;
   return;
 }
 const c=fc.pool[fc.i];
 const backMc=(c.mc||'').replace(/\n/g,'<br>');
 d.innerHTML=`<div class="fc-wrap">
   <div class="fc-bar"><span>${fc.i+1} / ${fc.pool.length}</span><span class="prog"><i style="width:${fc.i/fc.pool.length*100}%"></i></span><span>认识 ${fc.right}</span></div>
   <div class="card" id="card" onclick="__flip()">
     <div class="q">${c.front}</div><div class="hint">${c.hint}　（点击翻面）</div>
     <div class="a"><div class="dv">${c.back} ${say(c.back)}</div><div class="mc">${backMc}</div><div class="sub">${c.sub}</div></div>
   </div>
   <div class="fc-actions" id="fcact" style="visibility:hidden">
     <button class="btn bad" onclick="__grade(false)">✗ 还不熟</button>
     <button class="btn good" onclick="__grade(true)">✓ 认识</button>
   </div></div>`;
}
window.__flip=()=>{ const c=$('#card'); if(!c)return; c.classList.toggle('flip'); fc.flip=c.classList.contains('flip'); $('#fcact').style.visibility=fc.flip?'visible':'hidden'; };
window.__grade=(ok)=>{ const c=fc.pool[fc.i]; setKnown(fc.mod,c.k,ok); if(ok)fc.right++; fc.i++; fc.flip=false; drawFlash(); };
window.__flashAgain=()=>startFlash(fc.mod);

/* ---------- 测验引擎 ---------- */
let qz={};
function startQuiz(mod){
 const all=shuffle(quizOf(mod)).slice(0,12);
 qz={mod,pool:all,i:0,right:0,answered:false};
 drawQuiz();
}
function drawQuiz(){
 const d=$('#dyn'); if(!d)return;
 if(qz.i>=qz.pool.length){
   d.innerHTML=`<div class="fc-done"><div class="big">${qz.right>=qz.pool.length*0.8?'🏆':'📘'}</div><h3>测验结束</h3>
     <p>答对 ${qz.right} / ${qz.pool.length}</p>
     <div class="fc-actions"><button class="btn primary" onclick="__quizAgain()">再测一组</button>
     <button class="btn" onclick="__go('${qz.mod}','browse')">回到浏览</button></div></div>`;
   return;
 }
 const q=qz.pool[qz.i]; qz.answered=false;
 d.innerHTML=`<div class="quiz-wrap">
   <div class="fc-bar"><span>${qz.i+1} / ${qz.pool.length}</span><span class="prog"><i style="width:${qz.i/qz.pool.length*100}%"></i></span><span>✓ ${qz.right}</span></div>
   <div class="q-stem"><div class="qq">${q.stem}</div><div class="qsub">${q.sub}</div></div>
   <div class="opts" id="opts">${q.options.map(o=>`<button class="opt" onclick="__answer(this,'${o.replace(/'/g,"\\'")}')">${o}</button>`).join('')}</div></div>`;
}
window.__answer=(btn,val)=>{
 if(qz.answered)return; qz.answered=true;
 const q=qz.pool[qz.i]; const ok=val===q.answer;
 if(ok)qz.right++;
 document.querySelectorAll('#opts .opt').forEach(b=>{
   if(b.textContent===q.answer)b.classList.add('correct');
   else if(b===btn)b.classList.add('wrong'); else b.classList.add('dim');
 });
 setTimeout(()=>{ qz.i++; drawQuiz(); }, ok?650:1300);
};
window.__quizAgain=()=>startQuiz(qz.mod);

/* ---------- 搜索 ---------- */
let INDEX=null;
function buildIndex(){
 const ix=[];
 V.prefixes.forEach(a=>a.ex.forEach(e=>ix.push({mod:'prefixes',en:e[2],cn:e[3],extra:e[0]+' '+a.a})));
 V.suffixes.forEach(a=>a.ex.forEach(e=>ix.push({mod:'suffixes',en:e[2],cn:e[3],extra:e[0]+' '+a.a})));
 V.families.forEach(f=>f.members.forEach(m=>ix.push({mod:'families',en:m[0],cn:m[2],extra:'词根 '+f.root})));
 V.homophones.forEach(h=>h.words.forEach(w=>ix.push({mod:'homophones',en:w[0],cn:w[1],extra:'/'+h.ipa+'/'})));
 V.polysemy.forEach(p=>ix.push({mod:'polysemy',en:p.w,cn:p.senses.map(s=>s[1]).join('；'),extra:'一词多义'}));
 V.heteronyms.forEach(h=>ix.push({mod:'heteronyms',en:h.w,cn:h.readings.map(r=>r[2]).join('；'),extra:'同形异音'}));
 V.synonyms.forEach(s=>s.group.forEach(g=>ix.push({mod:'synonyms',en:g[0],cn:g[1],extra:s.note||''})));
 V.antonyms.forEach(p=>{ix.push({mod:'antonyms',en:p.a[0],cn:p.a[1],extra:'⇄ '+p.b[0]});ix.push({mod:'antonyms',en:p.b[0],cn:p.b[1],extra:'⇄ '+p.a[0]});});
 Object.values(V.formation).forEach(m=>m.groups.forEach(g=>g.items.forEach(it=>ix.push({mod:'formation',en:it[0],cn:it[1],extra:m.title}))));
 V.britam.vocab.forEach(v=>{ ix.push({mod:'britam',en:v[0],cn:v[2],extra:'英 · 美 = '+v[1]}); ix.push({mod:'britam',en:v[1],cn:v[2],extra:'美 · 英 = '+v[0]}); });
 V.thematic.forEach(c=>c.items.forEach(it=>ix.push({mod:'thematic',en:it[0],cn:it[1],extra:c.cat})));
 V.phonics.vowels.forEach(v=>v.rows.forEach(r=>r.ex.forEach(e=>ix.push({mod:'phonics',en:e[0],cn:e[1],extra:'['+r.ipa+'] 字母 '+v.l}))));
 V.phonics.combos.forEach(c=>c.ex.forEach(e=>ix.push({mod:'phonics',en:e[0],cn:e[1],extra:c.c+' ['+c.ipa+']'})));
 return ix;
}
function doSearch(q){
 q=q.trim().toLowerCase(); if(!q){ go('home'); return; }
 if(!INDEX)INDEX=buildIndex();
 state.mod='search';
 const hits=INDEX.filter(r=>r.en.toLowerCase().includes(q)||r.cn.includes(q)).slice(0,160);
 const byMod={}; hits.forEach(h=>{(byMod[h.mod]=byMod[h.mod]||[]).push(h);});
 let html=`<div class="sec-h"><h2>搜索 “${q}”</h2><div class="desc">${hits.length} 条结果</div></div>`;
 if(!hits.length){ html+='<div class="empty">没有找到匹配的词条。换个关键词试试？</div>'; main.innerHTML=html; return; }
 Object.keys(byMod).forEach(mk=>{
   html+=`<div class="sr-group"><h4>${MOD[mk].ic} ${MOD[mk].title}（${byMod[mk].length}）</h4><div class="pair-list">`;
   byMod[mk].forEach(h=>{ html+=`<div class="pcard" style="padding:10px 13px"><div class="w"><b>${h.en}</b>${say(h.en)}</div><div class="w"><span class="mc">${h.cn}</span></div><div style="font-size:11px;color:var(--ink-3);margin-top:3px">${h.extra}</div></div>`; });
   html+='</div></div>';
 });
 main.innerHTML=html; paintTabs();
}
let stim;
$('#search').addEventListener('input',e=>{ clearTimeout(stim); stim=setTimeout(()=>doSearch(e.target.value),180); });

/* ---------- 启动 ---------- */
const tabsEl=$('#tabs');
tabsEl.innerHTML='<span class="tab" data-k="home" onclick="__go(\'home\')">首页</span>'+
 MODULES.map(m=>`<span class="tab" data-k="${m.key}" onclick="__go('${m.key}')">${m.title}</span>`).join('');
/* ---------- 朗读（Web Speech API） ---------- */
let VOICES=[];
function loadVoices(){ try{ VOICES=window.speechSynthesis.getVoices()||[]; }catch(e){} }
if(window.speechSynthesis){ loadVoices(); window.speechSynthesis.onvoiceschanged=loadVoices; }
function speak(w){
 if(!w||!window.speechSynthesis) return;
 const txt=w.replace(/\([^)]*\)/g,' ').replace(/[^a-zA-Z '\-]/g,' ').replace(/\s+/g,' ').trim();
 if(!txt) return;
 try{ window.speechSynthesis.cancel();
   const u=new SpeechSynthesisUtterance(txt); u.lang='en-GB'; u.rate=.9;
   if(!VOICES.length) loadVoices();
   const v=VOICES.find(x=>/en[-_]GB/i.test(x.lang))||VOICES.find(x=>/^en/i.test(x.lang));
   if(v) u.voice=v;
   window.speechSynthesis.speak(u);
 }catch(e){}
}
// 捕获阶段拦截喇叭点击，避免触发卡片翻面/词缀展开
document.addEventListener('click',e=>{
 const b=e.target.closest('.say'); if(!b) return;
 e.stopPropagation(); e.preventDefault();
 speak(b.dataset.w);
 b.classList.add('on'); setTimeout(()=>b.classList.remove('on'),450);
},true);

$('#brand').addEventListener('click',()=>go('home'));
go('home');
})();
