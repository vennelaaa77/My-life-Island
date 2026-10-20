/* Life Island — iso night city (Three.js) → dusk street → walk-in rooms (canvas 2D) + quest logic */
const VAULT = "My second brain";
const TIERS = { small:{label:"Small",coins:100,xp:10}, medium:{label:"Medium",coins:250,xp:25}, big:{label:"Big",coins:500,xp:50} };
const DAY_GOAL = 2000;
const DOW = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
// street order, left → right. Hubs have doors to their own rooms.
const PLACES = [
  {id:"today",     name:"Today Tower",      facade:"037_art_deco",      built:true,  sub:"Everything due today, from every building."},
  {id:"career",    name:"Career Hub",       facade:"084_modern",        built:true,  sub:"Case competitions, portfolio and internships.", doors:["casecomp","portfolio","internship"]},
  {id:"clubs",     name:"Clubs Hub",        facade:"024_warehouse",     built:true,  sub:"Nexora, Marketing Club and ICC.", doors:["nexora","mktg","icc"]},
  {id:"people",    name:"People Hub",       facade:"004_brownstone",    built:true,  sub:"Networking, and the people you love.", doors:["network","family"]},
  {id:"bizideas",  name:"Business Ideas Tower", facade:"087_modern", built:true, sub:"Folders of business ideas. Earn XP to unlock each one."},
  {id:"goals",     name:"Goals Tower",      facade:"064_industrial",    built:true,  sub:"Active goals, and the long-term vault."},
  {id:"projects",  name:"Projects",         facade:"090_modern",        built:true,  sub:"Things you're building, and whether they're in your portfolio."},
  {id:"learning",  name:"Learning",         facade:"074_art_nouveau",   built:true,  sub:"Courses and resources."},
  {id:"declutter", name:"Declutter Hub",    facade:"051_half_timber",   built:true,  sub:"Daily resets and digital clean-ups."},
  {id:"salon",     name:"Salon",            facade:"047_mediterranean", built:true,  sub:"Your Sunday self-care ritual."},
  {id:"hall",      name:"Role Models Hall", facade:"020_limestone",     built:true,  sub:"Women who are crazy, and you love it."},
  {id:"skills",    name:"Mall",             facade:"097_shop_terrace",  built:true,  sub:"Everything I want to buy, in folders."}
];
const SUBS = {
  casecomp:  {name:"Case Competitions", parent:"career", sub:"Comps you're entering, and what you learn from winners."},
  portfolio: {name:"Portfolio",         parent:"career", sub:"Certifications and finished projects."},
  internship:{name:"Internships",       parent:"career", sub:"Your current internship, and applications.", doors:["vov","internfuture"]},
  vov:       {name:"Veil of Veda",      parent:"internship", sub:"Your current internship: tasks and weekly updates."},
  internfuture:{name:"Future Internships", parent:"internship", sub:"Applications and dream companies. Coming up."},
  nexora:    {name:"Nexora",            parent:"clubs",  sub:"Nexora tasks and ideas."},
  mktg:      {name:"Marketing Club",    parent:"clubs",  sub:"Marketing Club tasks."},
  icc:       {name:"ICC",               parent:"clubs",  sub:"Unlocked: you landed an internship."},
  network:   {name:"Networking",        parent:"people", sub:"People to cold-message."},
  family:    {name:"Family & Friends",  parent:"people", sub:"Friends and family to call."}
};
try{ const _s=JSON.parse(localStorage.getItem("lifeisland.v2")||"{}"); (_s.customPlaces||[]).forEach(c=>{ if(!PLACES.some(p=>p.id===c.id)) PLACES.push({...c,facade:"087_modern"}); }); }catch(e){}
const PL = id => PLACES.find(p=>p.id===id) || (SUBS[id] && {id, ...SUBS[id], built:!SUBS[id].soon});
const parentOf = id => SUBS[id] ? parentOf(SUBS[id].parent) : id;
const familyOf = id => { const p=PLACES.find(x=>x.id===id)||SUBS[id]; return p&&p.doors ? [id,...p.doors.flatMap(d=>familyOf(d))] : [id]; };
const SOON = { family:"Send me your friends and family list to open this room.", skills:"Long-term skills you buy with coins. Coming soon." };
const GOAL_UNLOCK = 300;

/* ================= state: task occurrence (done) · notification (seen) · rule (rules) — kept apart ================= */
const keyOf = d => d.toLocaleDateString("en-CA");
const today = () => keyOf(new Date());
const dowOf = k => new Date(k+"T12:00:00").getDay();
const daysBetween = (a,b) => Math.round((new Date(b+"T12:00:00")-new Date(a+"T12:00:00"))/864e5);
const STORE = "lifeisland.v2";
function seed(){
  const t = today(), id = () => Math.random().toString(36).slice(2,9), TD="04 To-Do/To-Do.md";
  const once=(title,tier,due,place="bounty",note=TD)=>({id:id(),title,place,tier,repeat:"once",start:"2026-10-13",due,note});
  const sundays=[["Hair spa","medium"],["Eyebrows","small"],["Multani mitti (nose & underarms)","small"],["Shaving","small"],["Full-body moisturising","small"],["Gua sha","small"]];
  return {
    wallet:{coins:0,xp:0}, settings:{playlist:""},
    rules:[
      once("Finish and post the LinkedIn post","medium","2026-10-14"), once("Send audio (to who?)","small","2026-10-14"),
      once("Friday evening: check schedule first","small","2026-10-16"), once("Falak: Zudio for clothes","small","2026-10-19"),
      once("Text Jade","small","2026-10-18"), once("Apply for internships","big","2026-10-18","bounty","05 Outreach/Internships/Internships.md"),
      once("Complete IT club work","medium","2026-10-18"), once("Meeting with Parthesh Sir: Kinder Joy + Wonderla campaigns","medium","2026-10-19"),
      once("Send Portfolio to Boba Bhai + Moxie Wave campaign","medium","2026-10-18","bounty","10 Projects/Portfolio.md"),
      once("Get tickets for me and Tiwari","small","2026-10-18"), once("Sort Instagram saved posts into Obsidian","small","2026-10-25"),
      once("Share the Unstop competition with Advait","small","2026-10-13","clubs","07 Nexora/Ideas for Nexora.md"),
      once("Reach out to Irina Ghosh: career guidance app","medium","2026-10-21","network",TD),
      {id:id(),title:"Drink water",place:"bounty",tier:"small",repeat:"daily",start:t},
      {id:id(),title:"Read 20 pages",place:"bounty",tier:"medium",repeat:"daily",start:t},
      ...sundays.map(([title,tier])=>({id:id(),title,place:"salon",tier,repeat:"weekly",days:[0],start:t}))
    ],
    goals:["Martial Arts","DELF","IELTS","GMAT","Language Learning","YouTube Video Editing","Make My Own Clothes","Piano & Music Theory"].map(g=>({id:id(),title:g,note:"01 Goals/"+g+".md",milestones:[]})),
    people:["Kaushal Dhanuka|MDI Gurgaon (alum)","Harsh Sharma|BITS Pilani, IIM Indore","Apoorv Vashistha|Master's Union","Ishit Gupta|Master's Union","Sahil|Master's Union","Mayank|Master's Union"].map(s=>{const [name,where]=s.split("|");return {id:id(),name,where,status:0,note:"05 Outreach/People/"+name+".md"};}),
    internships:["Mars","dyou","Seore","Moxie","Boba Bhai","Sleepy Owl"].map(n=>({id:id(),name:n,status:0})),
    models:[{name:"Riley Rojas",line:"Product Manager at Meta for about 5 years, 3x entrepreneur, now building her own businesses.",note:"09 Role Models/Riley Rojas.md"},{name:"Michelle Khare"},{name:"Forbes Riley"},{name:"Grace Beverly"},{name:"Tate McRae"}].map(m=>({...m,unlocked:false})),
    done:{}, seen:{}
  };
}
let S; try{ S=JSON.parse(localStorage.getItem(STORE)); }catch(e){}
if(!S||!S.rules){ S=seed(); try{ const o=JSON.parse(localStorage.getItem("lifeisland.v1")); if(o&&o.wallet) S.wallet=o.wallet; }catch(e){} }
S.settings=S.settings||{playlist:""};
try{ if(!localStorage.getItem(STORE)) localStorage.setItem(STORE,JSON.stringify(S)); }catch(e){}
const save=()=>{ try{ localStorage.setItem(STORE,JSON.stringify(S)); }catch(e){} };
const PEOPLE_STEPS=["Not contacted","Requested","Connected","Replied","Talked"], INTERN_STEPS=["Not applied","Applied","Interview","Offer"], MODEL_COST=1000;

function occursOn(r,k){ if(r.archived||k<r.start) return false; if(r.repeat==="daily") return true; if(r.repeat==="weekly") return (r.days||[]).includes(dowOf(k)); return false; }
function itemsFor(place){
  const t=today(), out=[], fam=place&&place!=="today"?familyOf(place):null;
  for(const r of S.rules){
    if(fam && !fam.includes(r.place)) continue;
    if(r.repeat==="once"){
      if(r.archived||t<r.start) continue;
      const key=r.id+"|once", d=S.done[key];
      if(d && keyOf(new Date(d.at))!==t) continue;
      out.push({r,key,due:r.due||null,done:!!d,seen:!!S.seen[key],overdue:!d&&!!r.due&&r.due<t});
    } else if(r.repeat==="monthly"){ if(r.archived||t<r.start) continue; const key=r.id+"|"+t.slice(0,7), d=S.done[key]; if(d && keyOf(new Date(d.at))!==t) continue; out.push({r,key,due:null,done:!!d,seen:!!S.seen[key],overdue:false});
    } else if(occursOn(r,t)){ const key=r.id+"|"+t; out.push({r,key,due:t,done:!!S.done[key],seen:!!S.seen[key],overdue:false}); }
  }
  return place==="today" ? out.filter(i=>i.r.place==="today"||["overdue","today","done"].includes(bucketOf(i))) : out;
}
// one clear bucket per quest
function bucketOf(i){ const t=today(); if(i.done) return "done"; if(i.overdue) return "overdue"; if(i.r.repeat!=="once") return "today"; if(!i.due) return "anytime"; const d=daysBetween(t,i.due); return d<=0?"today":d<=7?"week":"later"; }
const BUCKETS=[["overdue","Overdue: do these first"],["today","Due today"],["week","This week"],["later","Later"],["anytime","Anytime (no deadline)"],["done","Done today (gone tomorrow)"]];
function dueText(i){
  if(i.r.repeat==="daily") return "Every day";
  if(i.r.repeat==="monthly") return "Once a month";
  if(i.r.repeat==="weekly") return "Every "+(i.r.days||[]).map(d=>DOW[d]).join(", ");
  if(!i.due) return "Anytime";
  const d=daysBetween(today(),i.due), nice=new Date(i.due+"T12:00:00").toLocaleDateString("en-IN",{weekday:"short",day:"numeric",month:"short"});
  if(d<0) return `${-d} day${d===-1?"":"s"} late · was due ${nice}`; if(d===0) return "Due today"; if(d===1) return "Due tomorrow · "+nice; return `Due in ${d} days · ${nice}`;
}
function markerFor(place){ const open=itemsFor(place).filter(i=>!i.done); if(!open.length) return ""; return open.some(i=>!i.seen)?"new":"seen"; }
function acknowledge(place){ let c=false; for(const i of itemsFor(place)) if(!i.done&&!i.seen){ S.seen[i.key]=Date.now(); c=true; } if(c) save(); }
const earnedToday=()=>Object.values(S.done).filter(v=>keyOf(new Date(v.at))===today()).reduce((a,v)=>a+v.coins,0)+(S.bonusDay===today()?S.bonus||0:0);
function addBonus(c){ if(S.bonusDay!==today()){ S.bonusDay=today(); S.bonus=0; } S.bonus+=c; }
const level = xp => { let lv=1,need=300,rest=xp; while(rest>=need){ rest-=need; lv++; need=Math.round(need*1.15);} return {lv,rest,need}; };
// v3: new buildings, doors, goal vault, projects, courses, declutter dailies, current internship
function migrateV3(){
  if(S.v3) return; const id=()=>Math.random().toString(36).slice(2,9), t=today();
  for(const r of S.rules){
    if(r.place==="bounty") r.place="today";
    if(r.place==="clubs") r.place="nexora";
    if(/Apply for internships/i.test(r.title)) r.place="internship";
    if(/Portfolio to Boba Bhai/i.test(r.title)) r.place="portfolio";
    if(/Instagram saved posts/i.test(r.title)) r.place="declutter";
  }
  S.rules.push(
    {id:id(),title:"Update your Obsidian",place:"declutter",tier:"small",repeat:"daily",start:t,note:"Home.md"},
    {id:id(),title:"Visit every building",place:"declutter",tier:"medium",repeat:"daily",start:t,auto:"visitall"},
    {id:id(),title:"Clean your room",place:"declutter",tier:"small",repeat:"daily",start:t},
    {id:id(),title:"Clear YouTube Watch Later",place:"declutter",tier:"small",repeat:"weekly",days:[6],start:t},
    {id:id(),title:"Organise Instagram saved posts",place:"declutter",tier:"medium",repeat:"weekly",days:[0],start:t},
    {id:id(),title:"Send the weekly update email to Veil of Veda",place:"internship",tier:"medium",repeat:"weekly",days:[5],start:t,note:"05 Outreach/Internships/Veil of Veda.md"}
  );
  S.goals.forEach(g=>{ if(!g.state) g.state="vault"; });
  S.projects=S.projects||[{id:id(),title:"Lock-In System",note:"10 Projects/Lock-In System.md",inPortfolio:false},{id:id(),title:"Life Management Game",note:"10 Projects/Life Management Game.md",inPortfolio:false}];
  S.courses=S.courses||[{id:id(),title:"IIT Guwahati Course (NLP)",note:"08 Courses & Certifications/IIT Guwahati Course/IIT Guwahati Course.md",done:false}];
  S.certs=S.certs||[];
  S.job=S.job||{company:"Veil of Veda",note:"05 Outreach/Internships/Veil of Veda.md"};
  S.visits=S.visits||{date:t,ids:[]};
  S.v3=true; save();
}
migrateV3();
// quest inbox: new quests Venn asks for land here and merge in once (by id)
const INBOX=[
  {id:"call-prashant-20261018",title:"Call Prashant",place:"family",tier:"small",repeat:"once",start:"2026-10-18",due:"2026-10-18"},
  {id:"call-rohit-bava-20261018",title:"Call Rohit Bava",place:"family",tier:"small",repeat:"once",start:"2026-10-18",due:"2026-10-18"}
];
INBOX.forEach(q=>{ if(!S.rules.some(r=>r.id===q.id)) S.rules.push({...q}); }); save();
// one quest = one card: archive duplicate titles, hide quests Claude made up, route Veil of Veda to its own room
const ROUTINE_RULES=[
 {id:"rr-nexora-mail",title:"Update mail",place:"nexora",tier:"small",repeat:"daily",note:"30 Clubs/Nexora/Nexora.md"},
 {id:"rr-nexora-assign",title:"Assign work",place:"nexora",tier:"small",repeat:"weekly",days:[0],note:"30 Clubs/Nexora/Nexora.md"},
 {id:"rr-call-parents",title:"Call Mom and Dad",place:"family",tier:"small",repeat:"weekly",days:[6],note:"12 Routines/Weekly and Monthly Rhythm.md"},
 {id:"rr-call-kritika",title:"Call Kritika",place:"family",tier:"small",repeat:"monthly",note:"12 Routines/Weekly and Monthly Rhythm.md"},
 {id:"rr-vov-saturday",title:"Veil of Veda office: 1 to 5 pm",place:"vov",tier:"medium",repeat:"weekly",days:[6],note:"20 Career/Internships/Veil of Veda.md"},
 {id:"rr-vov-reels",title:"VOV: build 3 aesthetic reels",place:"vov",tier:"big",repeat:"once",due:"2026-10-24",note:"20 Career/Internships/Veil of Veda.md",steps:[{t:"Reel 1",done:false},{t:"Reel 2",done:false},{t:"Reel 3",done:false}]}];
ROUTINE_RULES.forEach(q=>{ if(!S.rules.some(r=>r.id===q.id)) S.rules.push({...q,start:today()}); });
const DREAMS=["Mars","dyou","Seore","Moxie","Boba Bhai","Turbo AI","Mila Mend","ElevenLabs","Plum","un:fltrd","indē wild","Fix My Curls","Rella","Alchemai","Nami Matcha","Gnani.ai","Sarvam AI","Savana","Fraganote","The Whole Truth Foods","Kinder Joy","Sleepy Owl","New York tech companies"];
function tidyOnce(){ if(S.v4) return; S.v4=true;
  S.rules.forEach(r=>{ if(r.repeat==="daily"&&!r.auto&&!String(r.id).startsWith("rr-")) r.archived=true;
    if(/^full-body moisturising$/i.test(r.title||"")||/^sunday salon: multani mitti/i.test(r.title||"")||/^clean, neat desk setup$/i.test(r.title||"")) r.archived=true;
    if(/^multani mitti/i.test(r.title||"")) r.title="Multani mitti";
    if(/cult brand/i.test(r.title||"")&&!r.due) r.due="2026-10-24"; });
  S.internships=S.internships||[]; DREAMS.forEach(n=>{ if(!S.internships.some(x=>x.name.toLowerCase()===n.toLowerCase())) S.internships.push({id:Math.random().toString(36).slice(2,9),name:n,status:0}); });
  const dd=(arr,key)=>{ const seen={}; return (arr||[]).filter(x=>{ const k=String(x[key]||"").toLowerCase().trim(); if(!k||seen[k]) return !k; seen[k]=1; return true; }); };
  S.goals=dd(S.goals,"title"); S.projects=dd(S.projects,"title"); S.courses=dd(S.courses,"title"); S.people=dd(S.people,"name"); S.internships=dd(S.internships,"name");
  save(); }
// v5: the IIT Guwahati course is not finished yet; undo a wrong "done" caused by a duplicate merge
function tidyV5(){ if(S.v5) return; S.v5=true;
  (S.courses||[]).forEach(c=>{ if(/iit guwahati/i.test(c.title||"")) c.done=false; });
  if(Array.isArray(S.certs)) S.certs=S.certs.filter(x=>!/iit guwahati/i.test(x.title||""));
  save(); }
tidyOnce(); tidyV5();
function tidyRules(){ const seen={}; let c=false;
  for(const r of S.rules){ if(r.id==="ix-q-20261020-lifeisle-names"&&!r.archived){ r.archived=true; c=true; }
    if(r.place==="internship"&&/veil of veda|vov/i.test((r.title||"")+" "+(r.note||""))){ r.place="vov"; c=true; }
    if(/^send the weekly update email to veil of veda$/i.test(r.title||"")&&!r.archived){ r.archived=true; c=true; }
    if(r.archived||r.auto||!r.title) continue;
    const k=r.title.toLowerCase().replace(/\s+/g," ").trim()+"|"+r.repeat;
    if(seen[k]){ const keep=seen[k], rd=!!S.done[r.id+"|once"], kd=!!S.done[keep.id+"|once"]; if(rd&&!kd){ keep.archived=true; seen[k]=r; } else r.archived=true; c=true; }
    else seen[k]=r; }
  if(c) save(); }
tidyRules();
if(S.job&&S.job.company!=="Veil of Veda"&&/Vale of Veda/.test(S.job.company)){ S.job.company="Veil of Veda"; S.job.note="05 Outreach/Internships/Veil of Veda.md"; }
S.rules.forEach(r=>{ if(r.title&&/Vale of Veda/.test(r.title)){ r.title=r.title.replace("Vale of Veda","Veil of Veda"); r.note="05 Outreach/Internships/Veil of Veda.md"; } }); save();
const TOP_BUILT = () => PLACES.filter(p=>p.built).map(p=>p.id);
function visitedToday(){ if(!S.visits||S.visits.date!==today()) S.visits={date:today(),ids:[]}; return S.visits.ids; }
function markVisit(id){ const v=visitedToday(), top=parentOf(id); if(!v.includes(top)){ v.push(top); save(); checkAuto(); } }
function checkAuto(){ for(const i of itemsFor("declutter")) if(i.r.auto==="visitall"&&!i.done){ const need=TOP_BUILT(), got=visitedToday().filter(x=>need.includes(x)).length;
    if(got>=need.length){ const t=TIERS[i.r.tier]; S.done[i.key]={at:Date.now(),coins:t.coins,xp:t.xp}; S.seen[i.key]=Date.now(); pay(t,"Visited every building"); } } }


/* ================= sound ================= */
let AC=null;
function blip(freqs,type="square",vol=.05){ try{ AC=AC||new (window.AudioContext||window.webkitAudioContext)(); const t=AC.currentTime;
  freqs.forEach((f,i)=>{ const o=AC.createOscillator(), g=AC.createGain(); o.type=type; o.frequency.value=f; g.gain.setValueAtTime(vol,t+i*.07); g.gain.exponentialRampToValueAtTime(.001,t+i*.07+.18); o.connect(g).connect(AC.destination); o.start(t+i*.07); o.stop(t+i*.07+.2); }); }catch(e){} }
const clink=()=>blip([1320,1760]), door=()=>blip([220,165],"triangle",.08);
const music=document.getElementById("music"); let musicOn=false;
function setMusic(on){ musicOn=on; if(on){ music.volume=.35; music.play().catch(()=>{musicOn=false; renderHUD();}); } else music.pause(); renderHUD(); }

/* ================= pixel player (placeholder until the PixelLab sprite) ================= */
const PW=20, PH=36;
function makePlayer(){
  const W=PW,H=PH, frames=5, c=document.createElement("canvas"); c.width=W*frames; c.height=H; const g=c.getContext("2d");
  const P=(f,x,y,w,h,col)=>{ if(w>0&&h>0){ g.fillStyle=col; g.fillRect(f*W+x,y,w,h); } };
  const HAIR="#1d1411", HAIR2="#35251d", HAIR3="#4a3428", SKIN="#e8b896", SKIN2="#d39c7a", SW="#66704f", SW2="#525b3f", SW3="#7a8560", JN="#7389ad", JN2="#5c7196", JN3="#8ea2c2", SNK="#efebe2", SOLE="#9a958c", BAG="#17161b";
  for(let f=0;f<frames;f++){
    const bob=f===0?0:(f%2), step=[0,1,0,-1,0][f];
    // tote bag hanging behind (left side, facing right)
    P(f,2,17+bob,5,9,BAG); P(f,3,16+bob,3,1,BAG); P(f,6,12+bob,1,6,BAG);
    // wide jeans: two loose legs that swing
    const L=step>0?1:0, Rr=step<0?1:0;
    P(f,5-L,25+bob,5,9-bob,JN2); P(f,10+Rr,25+bob,5,9-bob,JN); P(f,6-L,26+bob,1,7,JN3); P(f,13+Rr,26+bob,1,7,JN3);
    P(f,4-L,32,6,2,JN2); P(f,10+Rr,32,6,2,JN);                      // flared hems
    // sneakers
    P(f,4-L-(step>0?1:0),34,6,2,SNK); P(f,10+Rr+(step<0?1:0),34,7,2,SNK); P(f,4-L,35,6,1,SOLE); P(f,10+Rr,35,7,1,SOLE);
    // oversized sweater with dropped shoulders + ribbed hem
    P(f,4,14+bob,12,11,SW); P(f,3,16+bob,2,8,SW2); P(f,4,14+bob,12,1,SW3); P(f,4,24+bob,12,2,SW2); for(let k=5;k<16;k+=2) P(f,k,24+bob,1,2,SW);
    // sleeve + hand (swings a little)
    const arm=step>0?1:step<0?-1:0; P(f,13,16+bob+arm,4,8,SW2); P(f,13,16+bob+arm,1,8,SW); P(f,14,24+bob+arm,3,2,SKIN);
    // neck + headphones around the neck
    P(f,9,12+bob,4,2,SKIN2); P(f,7,13+bob,9,2,"#3f4a3c"); P(f,6,13+bob,2,3,"#55634f"); P(f,15,13+bob,2,3,"#55634f");
    // face
    P(f,9,4+bob,7,9,SKIN); P(f,15,7+bob,1,4,SKIN); P(f,13,7+bob,2,1,"#2a1a1a"); P(f,13,6+bob,2,1,HAIR); P(f,12,9+bob,1,1,"#c98a77"); P(f,14,9+bob,1,1,"#c98a77"); P(f,14,11+bob,2,1,"#b36a6a");
    P(f,10,10+bob,1,2,"#e2b04a");                                      // gold hoop
    // big curly hair: volume on top/back, curls falling past the shoulders
    P(f,6,1+bob,11,4,HAIR); P(f,5,2+bob,3,13,HAIR); P(f,4,4+bob,3,11,HAIR); P(f,7,0+bob,8,2,HAIR); P(f,15,2+bob,3,5,HAIR); P(f,16,4+bob,2,3,HAIR);
    P(f,9,4+bob,4,2,HAIR); P(f,12,4+bob,4,1,HAIR);                      // fringe curls
    [[7,1],[11,0],[15,2],[5,4],[4,8],[6,12],[4,13],[8,2],[13,1]].forEach(([x,y])=>P(f,x,y+bob,2,1,HAIR3));
    [[6,6],[5,10],[7,9],[10,2],[14,3],[3,11]].forEach(([x,y])=>P(f,x,y+bob,1,2,HAIR2));
    P(f,4,15+bob,2,2,HAIR); P(f,6,15+bob,2,1,HAIR);
  }
  return c;
}
// a little black cat that follows her around
function makeCat(){ const c=document.createElement("canvas"); c.width=14*3; c.height=10; const g=c.getContext("2d"); const P=(f,x,y,w,h,col)=>{ g.fillStyle=col; g.fillRect(f*14+x,y,w,h); };
  for(let f=0;f<3;f++){ const B="#141218";
    if(f===2){ P(f,3,4,7,6,B); P(f,8,1,4,4,B); P(f,8,0,1,2,B); P(f,11,0,1,2,B); P(f,10,2,1,1,"#e8c84a"); P(f,1,6,2,4,B); P(f,0,5,1,2,B); continue; } // sitting
    P(f,2,4,9,4,B); P(f,9,1,4,4,B); P(f,9,0,1,2,B); P(f,12,0,1,2,B); P(f,11,2,1,1,"#e8c84a"); P(f,0,2,2,1,B); P(f,1,3,2,2,B);
    P(f,3+(f?1:0),8,1,2,B); P(f,6-(f?1:0),8,1,2,B); P(f,8+(f?1:0),8,1,2,B); P(f,10-(f?1:0),8,1,2,B); }
  return c; }
const CAT=makeCat();
// Aki: Venn's character (cut from her sheet): stand · walk · front (coffee) · sit (laptop)
const AKI=new Image(); AKI.src="assets/aki.png"; let AKI_OL=null;
AKI.onload=()=>{ // soft cream rim + dark contour, baked once
  const w=AKI.width+4, h=AKI.height+4, c=document.createElement("canvas"); c.width=w; c.height=h; const x=c.getContext("2d");
  const sil=(col)=>{ const t=document.createElement("canvas"); t.width=AKI.width; t.height=AKI.height; const y=t.getContext("2d"); y.drawImage(AKI,0,0); y.globalCompositeOperation="source-in"; y.fillStyle=col; y.fillRect(0,0,t.width,t.height); return t; };
  const dark=sil("rgba(12,8,22,.9)"), light=sil("rgba(255,232,205,.7)");
  for(const [dx,dy] of [[-2,0],[2,0],[0,-2],[0,2],[-1,-1],[1,-1],[-1,1],[1,1]]) x.drawImage(light,2+dx,2+dy);
  for(const [dx,dy] of [[-1,0],[1,0],[0,-1],[0,1]]) x.drawImage(dark,2+dx,2+dy);
  x.drawImage(AKI,2,2); AKI_OL=c; renderHUD(); };
const AKF={stand: [0, 6, 38, 80], walk: [46, 2, 48, 84], front: [102, 4, 40, 82], sit: [150, 14, 54, 72]};
let idleT=0;
const PLAYER=makePlayer();

/* ================= UI ================= */
const esc=s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
// Obsidian links open outside the game (new tab), so the game never turns into a blank page
const obsURL=n=>`obsidian://open?vault=${encodeURIComponent(VAULT)}&file=${encodeURIComponent(n)}`;
const noteLink=(n,label)=>n?`<a class="note-link" href="${obsURL(n)}" target="_blank" rel="noopener" title="Opens this note in Obsidian">📓 ${esc(label||n.split("/").pop().replace(/\.md$/,""))}</a>`:"";
let mode="title", openPlace=null, logOpen=false, musicMenu=false, portrait=null, panelMin=false;

const UI_ICONS={"city": "<svg viewBox=\"0 0 24 24\"><path d=\"M4 21V8l5-3v16M9 21V3l8 3v15M3 21h18M12 8h2M12 11h2M12 14h2M6 11h1M6 14h1\"/></svg>", "street": "<svg viewBox=\"0 0 24 24\"><path d=\"M10 6l-6 6 6 6M4 12h16\"/></svg>", "log": "<svg viewBox=\"0 0 24 24\"><path d=\"M6 3h9l3 3v15H6zM9 9h6M9 13h6M9 17h4\"/></svg>", "moon": "<svg viewBox=\"0 0 24 24\"><path d=\"M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z\"/></svg>", "heart": "<svg viewBox=\"0 0 24 24\"><path d=\"M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.6-7 10-7 10z\"/></svg>", "bolt": "<svg viewBox=\"0 0 24 24\"><path d=\"M13 2L4 14h7l-1 8 9-12h-7z\"/></svg>", "spark": "<svg viewBox=\"0 0 24 24\"><path d=\"M12 2c.6 5 2.4 7.4 8 10-5.6 2.6-7.4 5-8 10-.6-5-2.4-7.4-8-10 5.6-2.6 7.4-5 8-10z\"/></svg>", "arrow": "<svg viewBox=\"0 0 24 24\"><path d=\"M5 12h14M13 6l6 6-6 6\"/></svg>"};
const VEN_FACE=new Image(); VEN_FACE.src="assets/ven_face.jpg"; VEN_FACE.onload=()=>renderHUD();
function renderHUD(){
  let h=document.getElementById("hud");
  if(mode==="title"){ if(h) h.remove(); return; }
  if(!h){ h=document.createElement("div"); h.id="hud"; h.className="hud"; document.body.appendChild(h); }
  const L=level(S.wallet.xp), e=earnedToday();
  h.innerHTML=`<div class="who glass"><canvas id="ava" width="96" height="96" aria-hidden="true"></canvas>
      <div class="whoinfo"><div class="lvl">Ven <span class="sp">${UI_ICONS.spark}</span></div><div class="lvsub">Lv. ${L.lv}</div>
      <div class="statrow" title="XP: progress to your next level. XP never goes down."><span class="si heart">${UI_ICONS.heart}</span><div class="bar"><i style="width:${(L.rest/L.need*100).toFixed(1)}%"></i></div><span class="num">${L.rest}/${L.need} <em>XP</em></span></div>
      <div class="statrow" title="Coins earned today. A full day of quests is about 2,000."><span class="si bolt">${UI_ICONS.bolt}</span><div class="bar day"><i style="width:${Math.min(100,e/DAY_GOAL*100).toFixed(1)}%"></i></div><span class="num">${e.toLocaleString()}/${DAY_GOAL.toLocaleString()} <em>today</em></span></div></div></div>
    <div class="right">
      <div class="btnrow">${mode!=="city"?`<button class="hbtn glass ${mode==="street"?"lit":""}" data-act="${mode==="room"?"leave":"city"}">${mode==="room"?UI_ICONS.street+"<span>Street</span>":UI_ICONS.city+"<span>City</span>"}</button><i class="sep"></i>`:""}
      <button class="hbtn glass" data-act="log" aria-expanded="${logOpen}">${UI_ICONS.log}<span>Quest log</span></button><i class="sep"></i>
      <div class="mwrap"><button class="hbtn glass" data-act="musicmenu" aria-expanded="${musicMenu}" aria-label="Music">${UI_ICONS.moon}<span>${musicOn?"On":"Off"}</span></button>
        ${musicMenu?`<div class="mmenu box">
          <div class="mtitle">Music</div>
          <button class="mopt" data-act="music">${musicOn?"⏸ Pause city lofi":"▶ Play city lofi"}</button>
          <div class="mtitle" style="margin-top:10px">My playlist</div>
          <p class="mhelp">Paste a Spotify or YouTube link (your Tate McRae or deep work playlist). It opens in a new tab, so keep that tab playing while you work. Pause the city lofi first.</p>
          <form data-playlist><label for="pl-url" class="sr">Playlist link</label><input id="pl-url" name="url" type="url" placeholder="https://open.spotify.com/playlist/…" value="${esc(S.settings.playlist)}"><button class="sell" type="submit">Save</button></form>
          ${S.settings.playlist?`<a class="sell linkbtn" href="${esc(S.settings.playlist)}" target="_blank" rel="noopener">Open my playlist ↗</a>`:""}
        </div>`:""}</div>
      </div>
      <div class="purse glass" id="purse" aria-label="${S.wallet.coins} coins"><span class="pc">${UI_ICONS.spark}</span>${S.wallet.coins.toLocaleString()}</div>
    </div>`;
  const a=document.getElementById("ava").getContext("2d"); a.imageSmoothingEnabled=true; a.clearRect(0,0,96,96); if(VEN_FACE.complete&&VEN_FACE.naturalWidth) a.drawImage(VEN_FACE,0,0,96,96); else if(AKI.complete&&AKI.naturalWidth) a.drawImage(AKI,96,2,28,28,0,0,96,96);
}
function renderQuests(){
  let q=document.getElementById("quests");
  if(mode!=="city"||logOpen){ if(q) q.remove(); return; }
  if(!q){ q=document.createElement("section"); q.id="quests"; q.className="quests glass"; q.setAttribute("aria-label","Next up"); document.body.appendChild(q); }
  const open=itemsFor().filter(i=>!i.done); const ov=open.filter(i=>i.overdue).length, td=open.filter(i=>bucketOf(i)==="today").length;
  const min=!!S.settings.nextMin; q.classList.toggle("min",min);
  const head=`<h2><button class="minbtn" data-act="nextmin" aria-expanded="${!min}">${min?"▸":"▾"} Next up</button><small>${ov?`<b class="late">${ov} late</b> · `:""}${td} today</small></h2>`;
  if(min){ q.innerHTML=head; return; }
  const next=open.sort((a,b)=>BUCKETS.findIndex(x=>x[0]===bucketOf(a))-BUCKETS.findIndex(x=>x[0]===bucketOf(b))).slice(0,4);
  q.innerHTML=`${head}
    ${next.map(i=>`<button class="qrow" data-go="${i.r.place}"><span class="dot ${i.overdue?"overdue":i.seen?"seen":""}"></span><span class="qt">${esc(i.r.title)}<em>${esc(dueText(i))}</em></span><span class="where">${esc(PL(i.r.place).name)} →</span></button>`).join("")||'<div class="empty">All clear. Rest well.</div>'}
    <div class="legend"><span><i class="lg new"></i>new quest</span><span><i class="lg seen"></i>seen</span><button class="ghost" data-act="log">Quest log</button></div>`;
}
function renderZoom(){
  let z=document.getElementById("zoomctl");
  if(mode!=="city"){ if(z) z.remove(); return; }
  if(z) return; z=document.createElement("div"); z.id="zoomctl"; z.className="zoomctl glass";
  z.innerHTML=`<button data-act="zin" aria-label="Zoom in">＋</button><button data-act="zout" aria-label="Zoom out">－</button><button data-act="zreset" aria-label="Reset view">⟲</button><span class="zhelp">Scroll or pinch to zoom · drag to move · tap a pin</span>`;
  document.body.appendChild(z);
}
/* ---- quest cards: one shape everywhere ---- */
function questCard(i,opts={}){
  const t=TIERS[i.r.tier], b=bucketOf(i);
  const status=i.done?`<span class="tag ok">Done ✓</span>`:i.overdue?`<span class="tag overdue">Late</span>`:(!i.seen?`<span class="tag new">New</span>`:"");
  const act=i.done?`<button class="ghost" data-unsell="${i.key}" title="Mark as not done and return the coins">Undo</button>`
    :opts.locked?`<span class="tag">${esc(opts.locked)}</span>`
    :i.r.auto==="visitall"?`<span class="tag">${visitedToday().filter(x=>TOP_BUILT().includes(x)).length}/${TOP_BUILT().length} visited</span>`
    :`<button class="sell" data-sell="${i.key}" aria-label="Mark ${esc(i.r.title)} done, earn ${t.coins} coins">✓ Done</button>`;
  return `<article class="card ${i.done?"done":""} ${b}"><span class="ico" aria-hidden="true">${ICONS[b]}</span>
    <div class="grow"><div class="t">${esc(i.r.title)} ${status}</div>${(i.r.steps||[]).length?`<div class="steps">${i.r.steps.map((s,n)=>`<label class="step ${s.done?"sd":""}"><input type="checkbox" data-step="${esc(i.r.id)}|${n}" ${s.done?"checked":""}> ${esc(s.t)}</label>`).join("")}</div>`:""}
      <div class="m"><span class="when">${esc(dueText(i))}</span>${opts.showPlace?`<button class="chip" data-go="${i.r.place}">${esc(PL(i.r.place).name)}</button>`:""}${noteLink(i.r.note)}</div></div>
    <div class="reward" title="${t.label} quest"><span><span class="coin"></span>+${t.coins}</span><small>+${t.xp} XP</small></div>
    ${act}<button class="icon-btn" data-archive="${i.r.id}" aria-label="Delete quest ${esc(i.r.title)}" title="Delete quest">🗑</button></article>`;
}
const ICONS={anytime:'<svg viewBox="0 0 24 24"><path d="M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18M12 7v5l3 2"/></svg>',overdue:'<svg viewBox="0 0 24 24"><path d="M12 3c1 4 5 5 5 10a5 5 0 0 1-10 0c0-3 2-4 2-7 2 1 3 3 3 5"/></svg>',today:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2"/></svg>',week:'<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>',later:'<svg viewBox="0 0 24 24"><path d="M6 3h12M6 21h12M7 3c0 5 10 5 10 9s-10 4-10 9M17 3c0 5-10 5-10 9"/></svg>',done:'<svg viewBox="0 0 24 24"><path d="M4 12l5 5L20 6"/></svg>'};
function grouped(items,opts){ return BUCKETS.map(([k,label])=>{ const xs=items.filter(i=>bucketOf(i)===k); return xs.length?`<div class="section-label ${k}"><span>${label}</span><i></i><b>${xs.length}</b></div>${xs.map(i=>questCard(i,opts)).join("")}`:""; }).join("")||'<div class="empty">No quests here. Add one below.</div>'; }
function addForm(place){
  const where=place?`<input type="hidden" name="place" value="${place}">`:`<label for="f-place">Where it lives<select id="f-place" name="place">${[...PLACES.filter(p=>p.built&&!p.doors&&p.id!=="hall"),...Object.keys(SUBS).map(PL).filter(p=>p.built)].map(p=>`<option value="${p.id}">${esc(p.name)}</option>`).join("")}</select></label>`;
  return `<form class="add" data-add>
    <label class="full" for="f-title">New quest<input id="f-title" name="title" required maxlength="80" placeholder="What needs doing?"></label>
    ${where}
    <label for="f-tier">Size<select id="f-tier" name="tier">${Object.entries(TIERS).map(([k,v])=>`<option value="${k}" ${k==="medium"?"selected":""}>${v.label} · +${v.coins} coins</option>`).join("")}</select></label>
    <label for="f-repeat">Repeats<select id="f-repeat" name="repeat"><option value="once">Just once</option><option value="daily">Every day</option><option value="weekly">Weekly on…</option></select></label>
    <label for="f-due" id="f-duewrap">Due by<input id="f-due" name="due" type="date"></label>
    <div class="full days" id="f-days" hidden>${DOW.map((d,n)=>`<label><input type="checkbox" name="days" value="${n}">${d}</label>`).join("")}</div>
    <label class="full" for="f-note">Obsidian note (optional)<input id="f-note" name="note" placeholder="04 To-Do/To-Do.md"></label>
    <button class="sell full" type="submit">Add quest</button>
    <p class="full mhelp">Small = 5–15 min · Medium = up to an hour · Big = a real push. Done → coins to spend. XP stays forever.</p></form>`;
}
const HOWTO=`<details class="howto"><summary>How quests work</summary><ul>
  <li><b>Quest</b> = anything you need to do. Each one lives in a building.</li>
  <li><b>✓ Done</b> pays coins + XP right away. <b>Undo</b> takes them back if you tapped by mistake.</li>
  <li><b>Coins</b> are for spending (role model portraits, skills). <b>XP</b> never goes down; it levels you up.</li>
  <li>A <b>gold diamond</b> over a building = a quest you haven't looked at. Walk in and it calms down. It only disappears when the quest is done.</li>
  <li><b>Late</b> quests stay at the top until done or deleted.</li></ul></details>`;

const doorSections=hub=>PL(hub).doors.map(d=>{ const p=PL(d), xs=itemsFor(d);
  return `<div class="section-label"><span>${esc(p.name)}</span><i></i><b>${xs.filter(i=>!i.done).length}</b></div>${p.built?(xs.length?grouped(xs):'<div class="empty">Nothing here yet.</div>'):`<div class="empty">${esc(SOON[d]||"Coming soon.")}</div>`}`; }).join("");
const lobbyBoard=hub=>`<p class="mhelp">Everything behind these doors, in one place. Walk through a door to add to it.</p>${doorSections(hub)}`;
const roomBoard=(id,extra="")=>`${grouped(itemsFor(id))}${extra}<div class="section-label"><span>Add a quest</span><i></i></div>${addForm(id)}`;
const BOARDS={
  today:()=>`${HOWTO}<p class="mhelp">Everything due today or late, from every building, plus your general to-dos.</p>${grouped(itemsFor("today"),{showPlace:true})}<div class="section-label"><span>Add a to-do</span><i></i></div>${addForm("today")}`,
  career:()=>lobbyBoard("career"), clubs:()=>lobbyBoard("clubs"), people:()=>lobbyBoard("people"),
  casecomp:()=>roomBoard("casecomp",`<div class="section-label"><span>Your notes</span><i></i></div><div class="card"><div class="grow"><div class="t">Case comp playbook</div><div class="m">${noteLink("05 Outreach/Case Competitions.md")}${noteLink("05 Outreach/L'Oréal Brandstorm.md")}${noteLink("case comps/Winning case comp ppts.md")}</div></div></div>`),
  portfolio:()=>roomBoard("portfolio",`<div class="section-label"><span>Certifications</span><i></i><b>${S.certs.length}</b></div>${S.certs.map(c=>`<div class="card"><div class="grow"><div class="t">${esc(c.title)} <span class="tag ok">Certified</span></div><div class="m">${noteLink(c.note)}</div></div></div>`).join("")||'<div class="empty">Finish a course in Learning and it lands here.</div>'}
    <div class="section-label"><span>Projects in your portfolio</span><i></i><b>${S.projects.filter(p=>p.inPortfolio).length}</b></div>${S.projects.filter(p=>p.inPortfolio).map(p=>`<div class="card"><div class="grow"><div class="t">${esc(p.title)}</div><div class="m">${noteLink(p.note)}</div></div></div>`).join("")||'<div class="empty">Mark a project as "in portfolio" in the Projects building.</div>'}`),
  internship:()=>lobbyBoard("internship"),
  vov:()=>`<div class="card today"><span class="ico">${ICONS.week}</span><div class="grow"><div class="t">Current: ${esc(S.job.company)} <span class="tag ok">Interning</span></div><div class="m">Office: Saturdays 1 to 5 pm. Weekly update email every Friday.${noteLink("20 Career/Internships/Veil of Veda.md","Veil of Veda note")}</div></div></div>
    ${roomBoard("vov")}`,
  internfuture:()=>`<p class="mhelp">Dream brands and companies. Tap to move each one along: applied, interview, offer.</p>${roomBoard("internfuture",`<div class="section-label"><span>Dream internships</span><i></i></div>${S.internships.map(x=>`<div class="card"><div class="grow"><div class="t">${esc(x.name)} <span class="tag">${INTERN_STEPS[x.status]}</span></div></div>${x.status<INTERN_STEPS.length-1?`<button class="sell" data-intern="${x.id}">Mark ${esc(INTERN_STEPS[x.status+1].toLowerCase())}</button>`:'<span class="tag ok">Offer 🎉</span>'}</div>`).join("")}`)}`,
  nexora:()=>roomBoard("nexora",`<div class="m" style="margin-top:6px">${noteLink("07 Nexora/Ideas for Nexora.md")}</div>`),
  mktg:()=>roomBoard("mktg"), icc:()=>roomBoard("icc"), family:()=>roomBoard("family"),
  network:()=>`${roomBoard("network")}<div class="section-label"><span>Cold outreach</span><i></i><b>+${TIERS.small.coins} each step</b></div>
    ${S.people.map(p=>`<div class="card"><div class="grow"><div class="t">${esc(p.name)} <span class="tag ${p.status===0?"new":""}">${PEOPLE_STEPS[p.status]}</span></div><div class="m"><span>${esc(p.where)}</span>${noteLink(p.note)}</div></div>
      ${p.status<PEOPLE_STEPS.length-1?`<button class="sell" data-person="${p.id}">Mark ${esc(PEOPLE_STEPS[p.status+1].toLowerCase())}</button>`:`<span class="tag ok">Talked ✓</span>`}</div>`).join("")}`,
  declutter:()=>`<p class="mhelp">"Visit every building" ticks itself once you've walked into all ${TOP_BUILT().length} buildings today (${visitedToday().filter(x=>TOP_BUILT().includes(x)).length} so far).</p>${roomBoard("declutter")}`,
  goals(){
    const goalCard=g=>{ const dn=g.milestones.filter(m=>m.done).length;
      return `<article class="goal"><div class="t">${esc(g.title)} <small>${g.milestones.length?`${dn}/${g.milestones.length} milestones`:"No milestones yet"}</small></div><div class="m">${noteLink(g.note,"Open note")} <button class="ghost" data-gvault="${g.id}">Move back to long-term</button></div>
        ${g.milestones.map(m=>`<div class="card ${m.done?"done":""}"><div class="grow"><div class="t">${esc(m.title)} ${m.done?'<span class="tag ok">Reached ✓</span>':""}</div></div><div class="reward"><span><span class="coin"></span>+${TIERS.big.coins}</span><small>+${TIERS.big.xp} XP</small></div>${m.done?"":`<button class="sell" data-mile="${g.id}|${m.id}">✓ Reached</button>`}</div>`).join("")}
        <form class="add mini" data-goal="${g.id}"><label for="m-${g.id}" class="sr">New milestone for ${esc(g.title)}</label><input id="m-${g.id}" name="title" required maxlength="80" placeholder="Next milestone"><button class="sell" type="submit">Add</button></form></article>`; };
    const act=S.goals.filter(g=>g.state==="active"), vault=S.goals.filter(g=>g.state!=="active");
    return `<div class="section-label"><span>Active goals</span><i></i><b>${act.length}</b></div>${act.map(goalCard).join("")||'<div class="empty">No active goals. Unlock one from the vault below.</div>'}
      <div class="section-label"><span>Long-term vault</span><i></i><b>${vault.length}</b></div><p class="mhelp">Dreams you're not working on yet. Spend ${GOAL_UNLOCK} coins to unlock one, then add it to your active goals.</p>
      ${vault.map(g=>`<div class="card ${g.state==="vault"?"locked":""}"><span class="ico">${g.state==="vault"?'<svg viewBox="0 0 24 24"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>':ICONS.later}</span><div class="grow"><div class="t">${esc(g.title)}</div><div class="m">${noteLink(g.note)}</div></div>
        ${g.state==="vault"?`<button class="sell" data-gunlock="${g.id}" ${S.wallet.coins<GOAL_UNLOCK?"disabled":""}>Unlock · ${GOAL_UNLOCK}</button>`:`<button class="sell" data-gactive="${g.id}">Add to active</button>`}</div>`).join("")}
      <form class="add mini" data-newgoal><label for="ng" class="sr">New long-term goal</label><input id="ng" name="title" required maxlength="60" placeholder="Add a long-term goal"><button class="sell" type="submit">Add</button></form>`; },
  projects:()=>`<p class="mhelp">Tick "In portfolio" once a project is on your portfolio: +${TIERS.medium.coins} coins the first time.</p>
    ${S.projects.map(p=>`<div class="card ${p.inPortfolio?"done":""}"><span class="ico">${ICONS.week}</span><div class="grow"><div class="t">${esc(p.title)} ${p.inPortfolio?'<span class="tag ok">In portfolio ✓</span>':'<span class="tag">Not in portfolio</span>'}</div><div class="m">${noteLink(p.note)}</div></div>${p.inPortfolio?"":`<button class="sell" data-proj="${p.id}">In portfolio ✓</button>`}</div>`).join("")}
    <form class="add mini" data-newproj><label for="np" class="sr">New project</label><input id="np" name="title" required maxlength="60" placeholder="Add a project or idea"><button class="sell" type="submit">Add</button></form>${roomBoard("projects")}`,
  learning:()=>`<div class="section-label"><span>Courses</span><i></i><b>${S.courses.filter(c=>!c.done).length}</b></div>
    ${S.courses.filter(c=>!c.done).map(c=>`<div class="card"><span class="ico">${ICONS.later}</span><div class="grow"><div class="t">${esc(c.title)}</div><div class="m">${noteLink(c.note)}</div></div><button class="sell" data-course="${c.id}">Finished → portfolio</button></div>`).join("")||'<div class="empty">No courses in progress.</div>'}
    <form class="add mini" data-newcourse><label for="nc" class="sr">New course</label><input id="nc" name="title" required maxlength="60" placeholder="Add a course or resource"><button class="sell" type="submit">Add</button></form>${roomBoard("learning")}`,
  salon(){ const t=today(); const rules=S.rules.filter(r=>r.place==="salon"&&!r.archived);
    if(dowOf(t)===0) return grouped(itemsFor("salon"));
    const d=new Date(); while(d.getDay()!==0) d.setDate(d.getDate()+1); const next=keyOf(d);
    return `<div class="note-pin">The salon opens on <b>Sunday</b>. These unlock then, so you can't tick them early.</div>
      ${rules.map(r=>questCard({r,key:r.id+"|"+next,due:next,done:false,seen:true,overdue:false},{locked:"Opens Sunday"})).join("")}`; },
  hall(){ if(portrait!=null){ const m=S.models[portrait];
      return `<button class="ghost" data-act="portraits">← All portraits</button><article class="portrait"><div class="frame"><span>${esc(m.name.split(" ").map(w=>w[0]).join(""))}</span></div><h2>${esc(m.name)}</h2>
        <p>${m.line?esc(m.line):"Why do you love her? Write it in her Obsidian note and I'll put it here."}</p>${m.note?noteLink(m.note,"Open her note"):`<p class="mhelp">No note yet. Make one in 09 Role Models.</p>`}<p class="mhelp">No made-up quotes here, only your own notes.</p></article>`; }
    return `<p class="mhelp">Unlock a portrait for ${MODEL_COST} coins. Then click it to read why she's here.</p>${S.models.map((m,n)=>`<div class="card ${m.unlocked?"":"locked"}"><div class="grow"><div class="t">${esc(m.name)}</div></div>
      ${m.unlocked?`<button class="sell" data-portrait="${n}">View</button>`:`<button class="sell" data-unlock="${n}" ${S.wallet.coins<MODEL_COST?"disabled":""}>Unlock · ${MODEL_COST}</button>`}</div>`).join("")}`; }
};
function renderBoard(){
  let p=document.getElementById("panel");
  if(!openPlace){ if(p) p.remove(); return; }
  const pl=PL(openPlace);
  if(!p){ p=document.createElement("section"); p.id="panel"; p.className="panel paper"; p.setAttribute("aria-labelledby","ptitle"); document.body.appendChild(p); }
  let body=BOARDS[pl.id]?BOARDS[pl.id]():pl.built?roomBoard(pl.id):`<div class="empty">${esc(SOON[pl.id]||"Coming soon.")}</div>`;
  if(pl.id==="today"||pl.id==="declutter") body=routineHTML(pl.id)+body;
  const scroll=p.querySelector(".body")?.scrollTop||0;
  applyTheme(p,pl.id); p.classList.toggle("min",panelMin); p.innerHTML=`<header><div><div class="eyebrow">Notice board</div><h1 id="ptitle">${esc(pl.name)}<span class="spark">✦</span></h1><div class="sub">${esc(pl.sub)}</div></div><div class="hbtns"><button class="x" data-act="pmin" aria-expanded="${!panelMin}" title="${panelMin?"Expand":"Minimise"}">${panelMin?"▴ Open":"▾ Minimise"}</button><button class="x" data-act="close" aria-label="Close the board">✕</button></div></header><div class="body">${body}</div>`;
  p.querySelector(".body").scrollTop=scroll;
}
function renderLog(){
  let p=document.getElementById("log");
  if(!logOpen){ if(p) p.remove(); return; }
  if(!p){ p=document.createElement("section"); p.id="log"; p.className="panel paper wide"; p.setAttribute("aria-labelledby","ltitle"); document.body.appendChild(p); }
  const scroll=p.querySelector(".body")?.scrollTop||0;
  p.classList.toggle("min",panelMin); p.innerHTML=`<header><div><div class="eyebrow">All buildings</div><h1 id="ltitle">Quest log<span class="spark">✦</span></h1><div class="sub">Every quest in one place, sorted by when it's due.</div></div><div class="hbtns"><button class="x" data-act="pmin" aria-expanded="${!panelMin}">${panelMin?"▴ Open":"▾ Minimise"}</button><button class="x" data-act="log" aria-label="Close quest log">✕</button></div></header>
    <div class="body">${HOWTO}${grouped(itemsFor().filter(i=>!(i.r.place==="salon"&&dowOf(today())!==0)),{showPlace:true})}<div class="section-label">Add a quest</div>${addForm(null)}</div>`;
  p.querySelector(".body").scrollTop=scroll;
}
function renderAll(){ renderHUD(); renderQuests(); renderZoom(); renderBoard(); renderLog(); City.refresh(); }

/* ================= Business Ideas tower: folders of ideas, each unlocked with XP ================= */
const BIZ_COST=10000;
const BIZ_SEED=[{id:"lifeisle",title:"Lifeisle",sub:"A game-like operating system for ambitious people and teams",cost:BIZ_COST,color:"#e8a0b4",icon:"🏝️",note:"65 Business Ideas/Lifeisle.md",
  pitch:["Not a gamified to-do list: an immersive world where every quest moves a real goal.","Start with individuals (My Life Island), add Team Island once people love it.","Reward real outcomes, not busywork. Never surveillance."],
  steps:["Check domain + trademark for top 3 names","Write the 'games should give back to real life' story","Show it to 5 ambitious friends","Sketch the weekly Voyage Review"]}];
const bizIdeas=()=>{ S.biz=S.biz||{ideas:[],unlocked:{}}; return [...BIZ_SEED,...(S.biz.ideas||[])]; };
BOARDS.bizideas=()=>{ const xp=S.wallet.xp, ideas=bizIdeas(), open=S.bizOpen&&ideas.find(i=>i.id===S.bizOpen&&S.biz.unlocked[i.id]);
  if(open) return `<div class="biz"><button class="bz-back" data-bizopen="">← All ideas</button><h2 class="bz-h">${esc(open.title)}</h2><p class="bz-sub">${esc(open.sub||"")}</p>${(open.pitch||[]).map(x=>`<div class="bz-line">✦ ${esc(x)}</div>`).join("")}${open.steps?`<div class="bz-sec">Next steps</div>${open.steps.map(x=>`<div class="bz-line">☐ ${esc(x)}</div>`).join("")}`:""}<div class="bz-sec">Notes</div>${noteLink(open.note||"65 Business Ideas/Business Ideas.md")}</div>`;
  const cards=ideas.map(i=>{ const un=!!S.biz.unlocked[i.id], can=xp>=i.cost, pct=Math.min(100,Math.round(xp/i.cost*100));
    return `<div class="bz-card ${un?"un":"lk"}" style="--tab:${i.color||"#d9a7b8"}"><div class="bz-tab"></div><div class="bz-ic">${un?(i.icon||"📂"):"🔒"}</div><div class="bz-t">${esc(i.title)}</div>`+
      (un?`<div class="bz-m">Unlocked</div><button class="bz-btn" data-bizopen="${esc(i.id)}">Open →</button>`
         :`<div class="bz-bar"><i style="width:${pct}%"></i></div><div class="bz-m">${Math.min(xp,i.cost).toLocaleString()} / ${i.cost.toLocaleString()} XP</div><button class="bz-btn" data-bizunlock="${esc(i.id)}" ${can?"":'data-short="1"'}>${can?"Unlock":"Keep earning XP"}</button>`)+`</div>`; }).join("");
  return `<div class="biz"><h2 class="bz-h">Dream it now.<br>Build it anytime.</h2><div class="bz-add"><input id="bz-in" maxlength="60" placeholder="Name a business idea to save"><button class="bz-plus" data-bizadd="1" aria-label="Add idea">+</button></div><div class="bz-sec">My Ideas</div><div class="bz-grid">${cards}</div><p class="bz-foot">Each idea unlocks at ${BIZ_COST.toLocaleString()} XP. Your XP isn't spent.</p></div>`; };

/* ================= coloured room themes for the boards ================= */
const THEMES={bizideas:{img:"biz_office",tint:"255,236,240",acc:"#d9697e",gold:"#a8763c",ink:"#6b4a3a"},
  skills:{img:"biz_office",tint:"255,240,226",acc:"#e8956a",gold:"#b0702e",ink:"#6b4a3a"},
  clubs:{img:"bg_clubs",tint:"252,238,234",acc:"#b8323a",gold:"#8a2a30",ink:"#4a2a2a"},
  projects:{img:"bg_projects",tint:"242,236,252",acc:"#7a5cc8",gold:"#5a3fa0",ink:"#3a3060"},
  declutter:{img:"bg_declutter",tint:"238,246,236",acc:"#5c8a4a",gold:"#3f6a35",ink:"#2f4a2a"},
  learning:{img:"bg_learning",tint:"250,242,230",acc:"#a0662c",gold:"#7a4a1c",ink:"#4a3220"},
  salon:{img:"bg_salon",tint:"236,240,252",acc:"#d98a3a",gold:"#a8651c",ink:"#2f3a60"}};
["nexora","mktg","icc"].forEach(k=>THEMES[k]=THEMES.clubs); THEMES.internfuture=THEMES.projects;
function applyTheme(p,id){ const t=THEMES[id]; p.classList.toggle("th",!!t); if(!t){ p.removeAttribute("style"); return; }
  p.style.setProperty("--tint",t.tint); p.style.setProperty("--acc",t.acc); p.style.setProperty("--gold",t.gold); p.style.setProperty("--ink2",t.ink); p.style.setProperty("--bgimg",`url(assets/${t.img}.jpg)`); }

/* ================= Mall: wishlist in folders ================= */
const MALL_SEED=[
 {id:"decor",title:"Room decor",icon:"🏠",color:"#e8b4a0",items:["Room/air freshener (Starlight)"]},
 {id:"cleaning",title:"Cleaning",icon:"🧹",color:"#a8d0c0",items:["Dustbin"]},
 {id:"clothes",title:"Clothes & shoes",icon:"👗",color:"#e8a0b4",items:["Padded bra","Chunky shoes","Period panty"],boughtSeed:["Period panty"]},
 {id:"skin",title:"Skincare & body",icon:"🧴",color:"#d9c0e8",items:["Body lotion: Vaseline Gluta-Hya","Glycolic acid"]},
 {id:"tech",title:"Tech & Lock-In",icon:"💡",color:"#b8c8e8",items:["NFC tags (for the Lock-In System)","Coloured smart lights (for the Lock-In System)"]},
 {id:"daily",title:"Daily essentials",icon:"🎒",color:"#e8d8a0",items:["Water bottle"]}];
function mallState(){ if(!S.mall){ S.mall={bought:{},added:{},folders:[]}; MALL_SEED.forEach(f=>(f.boughtSeed||[]).forEach(x=>S.mall.bought[f.id+"|"+x]=true)); } return S.mall; }
const mallFolders=()=>{ const m=mallState(); return [...MALL_SEED,...m.folders].map(f=>({...f,all:[...(f.items||[]),...(m.added[f.id]||[])]})); };
BOARDS.skills=()=>{ const m=mallState(), fs=mallFolders(), open=S.mallOpen&&fs.find(f=>f.id===S.mallOpen);
  if(open){ return `<div class="biz"><button class="bz-back" data-mallopen="">← All folders</button><h2 class="bz-h">${open.icon} ${esc(open.title)}</h2>${open.all.map(x=>{ const k=open.id+"|"+x, b=!!m.bought[k]; return `<label class="bz-line ${b?"bz-got":""}"><input type="checkbox" data-malltick="${esc(k)}" ${b?"checked":""}> ${esc(x)}</label>`; }).join("")||'<div class="bz-line">Nothing here yet.</div>'}
    <div class="bz-add" style="margin-top:12px"><input id="mall-in" maxlength="80" placeholder="Add something to buy"><button class="bz-plus" data-malladd="${esc(open.id)}" aria-label="Add item">+</button></div></div>`; }
  const cards=fs.map(f=>{ const n=f.all.filter(x=>!m.bought[f.id+"|"+x]).length, g=f.all.length-n;
    return `<div class="bz-card un" style="--tab:${f.color}"><div class="bz-tab"></div><div class="bz-ic">${f.icon}</div><div class="bz-t">${esc(f.title)}</div><div class="bz-m">${n} to buy${g?` · ${g} bought`:""}</div><button class="bz-btn" data-mallopen="${esc(f.id)}">Open →</button></div>`; }).join("");
  return `<div class="biz"><h2 class="bz-h">Wish it now.<br>Buy it wisely.</h2><div class="bz-sec">Folders</div><div class="bz-grid">${cards}</div>
   <div class="bz-add" style="margin-top:14px"><input id="mall-fin" maxlength="40" placeholder="New folder name"><button class="bz-plus" data-mallfolder="1" aria-label="Add folder">+</button></div><p class="bz-foot">Sales everywhere? Only buy what's on this list. 🚨</p></div>`; };


/* ================= Daily routine: fresh every day, never overdue ================= */
const ROUTINE_SEED=[
 {id:"wake",title:"Wake up",when:"morning"},{id:"shower",title:"Shower",when:"morning"},{id:"iron",title:"Iron tablets",when:"morning"},
 {id:"workout",title:"Workout",when:"morning"},{id:"water",title:"Drink 2 litres of water",when:"morning"},
 {id:"desk",title:"Clean desk",when:"morning",also:["declutter"]},{id:"study",title:"Update study life",when:"morning"},
 {id:"read",title:"Read: one Aeon essay, or a non-college book",when:"night"},
 {id:"mails",title:"Clear all mails",when:"night",also:["declutter"]},{id:"notes",title:"Clear notes app",when:"night",also:["declutter"]}];
const routineItems=()=>[...ROUTINE_SEED,...((S.routineExtra)||[])];
function routineHTML(place){
  S.routineDone=S.routineDone||{}; const t=today(), done=S.routineDone[t]||{};
  const its=routineItems().filter(i=>place==="today"||(i.also||[]).includes(place));
  if(!its.length) return "";
  const grp=(w,label)=>{ const xs=its.filter(i=>i.when===w); return xs.length?`<div class="rt-sub">${label}</div><div class="rt-row">${xs.map(i=>`<button class="rt-b ${done[i.id]?"on":""}" data-rt="${esc(i.id)}" aria-pressed="${!!done[i.id]}">${done[i.id]?"✓ ":""}${esc(i.title)}</button>`).join("")}</div>`:""; };
  const n=its.filter(i=>done[i.id]).length;
  return `<div class="rt"><div class="rt-h">Daily routine <span>${n}/${its.length}</span></div>${grp("morning","Morning")}${grp("night","Night")}<div class="rt-foot">Fresh every day. Miss one and it simply starts over tomorrow.</div></div>`;
}
function openBoard(id){ openPlace=id; portrait=null; panelMin=false; acknowledge(id); logOpen=false; renderAll(); }
function closeBoard(){ openPlace=null; portrait=null; renderAll(); }

let tt; function toast(msg,coin){ const el=document.getElementById("toast"); el.innerHTML=(coin?'<span class="coin"></span>':"")+esc(msg); el.classList.add("show"); clearTimeout(tt); tt=setTimeout(()=>el.classList.remove("show"),2200); }
function flyCoins(x,y,n=6){
  const purse=document.getElementById("purse"); if(!purse) return; const r=purse.getBoundingClientRect();
  for(let i=0;i<n;i++){ const c=document.createElement("div"); c.className="flycoin"; c.style.left=x+"px"; c.style.top=y+"px"; document.body.appendChild(c);
    const dx=r.left+10-x, dy=r.top+10-y, sx=(Math.random()-.5)*80, sy=-40-Math.random()*50;
    c.animate([{transform:"translate(0,0)"},{transform:`translate(${sx}px,${sy}px)`,offset:.35},{transform:`translate(${dx}px,${dy}px) scale(.6)`}],{duration:700+i*60,easing:"cubic-bezier(.5,0,.6,1)"}).onfinish=()=>c.remove(); }
  setTimeout(clink,650);
}
function pay(t,msg,ev,bonus){ S.wallet.coins+=t.coins; S.wallet.xp+=t.xp; if(bonus) addBonus(t.coins); save(); if(ev) flyCoins(ev.clientX,ev.clientY); else clink(); toast(`${msg} · +${t.coins} coins · +${t.xp} XP`,true); renderAll(); }

document.addEventListener("click",e=>{
  if(musicMenu && !e.target.closest(".mwrap")){ musicMenu=false; renderHUD(); }
  const b=e.target.closest("[data-gunlock],[data-gactive],[data-gvault],[data-proj],[data-course],[data-focus],[data-go],[data-sell],[data-unsell],[data-archive],[data-mile],[data-person],[data-intern],[data-unlock],[data-portrait],[data-act],[data-rt],[data-bizadd],[data-bizopen],[data-bizunlock],[data-step],[data-mallopen],[data-malltick],[data-malladd],[data-mallfolder]"); if(!b) return;
  const d=b.dataset;
  if(d.rt){ S.routineDone=S.routineDone||{}; const t=today(), m=(S.routineDone[t]=S.routineDone[t]||{}); if(m[d.rt]){ delete m[d.rt]; S.wallet.coins=Math.max(0,S.wallet.coins-10); S.wallet.xp=Math.max(0,S.wallet.xp-5); } else { m[d.rt]=Date.now(); S.wallet.coins+=10; S.wallet.xp+=5; clink(); } for(const k of Object.keys(S.routineDone)) if(daysBetween(k,t)>3) delete S.routineDone[k]; save(); renderAll(); return; }
  if(d.step){ const [rid,n]=d.step.split("|"); const r=S.rules.find(x=>x.id===rid); if(r&&r.steps&&r.steps[+n]){ r.steps[+n].done=!r.steps[+n].done; save(); renderAll(); } return; }
  if(d.mallopen!==undefined){ S.mallOpen=d.mallopen||null; save(); renderAll(); return; }
  if(d.malltick){ const m=mallState(); m.bought[d.malltick]=!m.bought[d.malltick]; save(); renderAll(); return; }
  if(d.malladd){ const v=(document.getElementById("mall-in")?.value||"").trim(); if(v){ const m=mallState(); (m.added[d.malladd]=m.added[d.malladd]||[]).push(v.slice(0,80)); save(); toast("Added to your wishlist"); renderAll(); } return; }
  if(d.mallfolder){ const v=(document.getElementById("mall-fin")?.value||"").trim(); if(v){ const m=mallState(); m.folders.push({id:"f"+Date.now().toString(36),title:v.slice(0,40),icon:"🛍️",color:"#e8b4a0",items:[]}); save(); renderAll(); } return; }
  if(d.bizadd){ const v=(document.getElementById("bz-in")?.value||"").trim(); if(v){ bizIdeas(); S.biz.ideas.push({id:"i"+Date.now().toString(36),title:v.slice(0,60),sub:"New idea",cost:BIZ_COST,color:"#c9b3e0",icon:"💡",pitch:["Write the idea down in Obsidian: 65 Business Ideas."]}); save(); toast("Idea saved. Earn "+BIZ_COST.toLocaleString()+" XP to unlock it."); renderAll(); } return; }
  if(d.bizopen!==undefined){ S.bizOpen=d.bizopen||null; save(); renderAll(); return; }
  if(d.bizunlock){ const i=bizIdeas().find(x=>x.id===d.bizunlock); if(i){ if(S.wallet.xp>=i.cost){ S.biz.unlocked[i.id]=Date.now(); S.bizOpen=i.id; save(); toast("Unlocked: "+i.title,true); renderAll(); } else toast(`Need ${i.cost.toLocaleString()} XP. You have ${S.wallet.xp.toLocaleString()}.`); } return; }
  if(d.gunlock){ const g=S.goals.find(x=>x.id===d.gunlock); if(g&&g.state==="vault"&&S.wallet.coins>=GOAL_UNLOCK){ S.wallet.coins-=GOAL_UNLOCK; g.state="unlocked"; save(); toast(`Unlocked: ${g.title}`); renderAll(); } return; }
  if(d.gactive){ const g=S.goals.find(x=>x.id===d.gactive); if(g){ g.state="active"; save(); toast(`${g.title} is now an active goal`); renderAll(); } return; }
  if(d.gvault){ const g=S.goals.find(x=>x.id===d.gvault); if(g){ g.state="unlocked"; save(); renderAll(); } return; }
  if(d.proj){ const p=S.projects.find(x=>x.id===d.proj); if(p&&!p.inPortfolio){ p.inPortfolio=true; if(!p.paid){ p.paid=true; pay(TIERS.medium,`${p.title} is in your portfolio`,e,true); } else { save(); renderAll(); } } return; }
  if(d.course){ const c=S.courses.find(x=>x.id===d.course); if(c&&!c.done){ c.done=true; S.certs.push({title:c.title,note:c.note}); pay(TIERS.big,`Finished ${c.title}`,e,true); } return; }
  if(d.focus) City.focus(d.focus);
  else if(d.act==="unfocus") City.unfocus();
  else if(d.act==="zin") City.zoomBy(1.3);
  else if(d.act==="zout") City.zoomBy(1/1.3);
  else if(d.act==="zreset") City.reset();
  else if(d.act==="nextmin"){ S.settings.nextMin=!S.settings.nextMin; save(); renderQuests(); }
  else if(d.act==="pmin"){ panelMin=!panelMin; renderBoard(); renderLog(); }
  else if(d.act==="close") closeBoard();
  else if(d.act==="leave") Street.leaveRoom();
  else if(d.act==="city") goCity();
  else if(d.act==="music"){ setMusic(!musicOn); musicMenu=true; renderHUD(); }
  else if(d.act==="musicmenu"){ musicMenu=!musicMenu; renderHUD(); }
  else if(d.act==="log"){ logOpen=!logOpen; if(logOpen) openPlace=null; renderAll(); }
  else if(d.act==="portraits"){ portrait=null; renderBoard(); }
  else if(d.go){ logOpen=false; openPlace=null; diveTo(d.go); }
  else if(d.sell){ const it=itemsFor().find(i=>i.key===d.sell); if(it&&!it.done){ const t=TIERS[it.r.tier]; S.done[it.key]={at:Date.now(),coins:t.coins,xp:t.xp}; S.seen[it.key]=S.seen[it.key]||Date.now(); pay(t,`Done: ${it.r.title}`,e); } }
  else if(d.unsell){ const x=S.done[d.unsell]; if(x){ S.wallet.coins=Math.max(0,S.wallet.coins-x.coins); S.wallet.xp=Math.max(0,S.wallet.xp-x.xp); delete S.done[d.unsell]; save(); toast("Undone. Coins and XP returned."); renderAll(); } }
  else if(d.archive){ const r=S.rules.find(x=>x.id===d.archive); if(r){ r.archived=true; save(); toast(`Deleted: ${r.title}`); renderAll(); } }
  else if(d.mile){ const [gid,mid]=d.mile.split("|"); const m=S.goals.find(g=>g.id===gid)?.milestones.find(x=>x.id===mid); if(m&&!m.done){ m.done=true; pay(TIERS.big,"Milestone reached",e,true); } }
  else if(d.person){ const p=S.people.find(x=>x.id===d.person); if(p&&p.status<PEOPLE_STEPS.length-1){ p.status++; pay(TIERS.small,`${p.name}: ${PEOPLE_STEPS[p.status]}`,e,true); } }
  else if(d.intern){ const x=S.internships.find(y=>y.id===d.intern); if(x&&x.status<INTERN_STEPS.length-1){ x.status++; pay(x.status===INTERN_STEPS.length-1?TIERS.big:TIERS.medium,`${x.name}: ${INTERN_STEPS[x.status]}`,e,true); } }
  else if(d.unlock){ const m=S.models[+d.unlock]; if(m&&!m.unlocked&&S.wallet.coins>=MODEL_COST){ S.wallet.coins-=MODEL_COST; m.unlocked=true; save(); toast(`${m.name} joins your hall`); renderAll(); } }
  else if(d.portrait){ portrait=+d.portrait; renderBoard(); }
});
document.addEventListener("change",e=>{ if(e.target.id==="f-repeat"){ document.getElementById("f-days").hidden=e.target.value!=="weekly"; document.getElementById("f-duewrap").hidden=e.target.value!=="once"; } });
document.addEventListener("submit",e=>{
  e.preventDefault(); const f=e.target, fd=new FormData(f);
  if(f.hasAttribute("data-newgoal")||f.hasAttribute("data-newproj")||f.hasAttribute("data-newcourse")){ const tt=(fd.get("title")||"").trim(); if(!tt) return; const nid=Math.random().toString(36).slice(2,9);
    if(f.hasAttribute("data-newgoal")) S.goals.push({id:nid,title:tt,state:"vault",milestones:[]});
    if(f.hasAttribute("data-newproj")) S.projects.push({id:nid,title:tt,inPortfolio:false});
    if(f.hasAttribute("data-newcourse")) S.courses.push({id:nid,title:tt,done:false});
    save(); toast("Added."); renderAll(); return; }
  if(f.hasAttribute("data-playlist")){ const u=(fd.get("url")||"").trim(); if(u && !/^https:\/\//.test(u)){ toast("Paste a link that starts with https://"); return; } S.settings.playlist=u; save(); toast(u?"Playlist saved.":"Playlist removed."); renderHUD(); return; }
  const title=(fd.get("title")||"").trim(); if(!title) return; const id=Math.random().toString(36).slice(2,9);
  if(f.dataset.goal){ S.goals.find(g=>g.id===f.dataset.goal)?.milestones.push({id,title,done:false}); save(); renderAll(); return; }
  const repeat=fd.get("repeat"), days=fd.getAll("days").map(Number); if(repeat==="weekly"&&!days.length){ toast("Pick at least one day."); return; }
  const note=(fd.get("note")||"").trim(), place=fd.get("place")||"bounty";
  S.rules.push({id,title,place,tier:fd.get("tier"),repeat,days:repeat==="weekly"?days:undefined,start:today(),due:repeat==="once"?(fd.get("due")||today()):undefined,note:note||undefined});
  save(); toast(`Quest added to ${PL(place).name}.`); renderAll();
});
addEventListener("keydown",e=>{
  if(mode==="title"||e.target.closest("input,select,textarea")) return;
  if(e.key==="q"||e.key==="Q"){ logOpen=!logOpen; if(logOpen) openPlace=null; renderAll(); }
  if(e.key==="Escape"){ if(musicMenu){ musicMenu=false; renderHUD(); } else if(logOpen){ logOpen=false; renderAll(); } else if(openPlace) closeBoard(); else if(mode==="room") Street.leaveRoom(); else if(mode==="street") goCity(); }
});

/* ================= transitions ================= */
const fade=document.getElementById("fade");
const wait=ms=>new Promise(r=>setTimeout(r,ms));
async function diveTo(id){
  const top=parentOf(id);
  if(mode==="city"){ await City.dive(top); fade.classList.add("on"); await wait(360); setMode("street"); Street.jumpTo(top); await wait(60); fade.classList.remove("on"); }
  else if(mode==="room"){ await Street.leaveRoom(); if(mode==="room") await Street.leaveRoom(); Street.walkTo(top,true); }
  else Street.walkTo(top,true);
}
async function goCity(){ fade.classList.add("on"); await wait(360); openPlace=null; setMode("city"); City.reset(); await wait(60); fade.classList.remove("on"); }
function setMode(m){ mode=m;
  document.getElementById("street").hidden=!(m==="street"||m==="room");
  for(const id of ["isle","labels","sky"]) { const el=document.getElementById(id); if(el) el.style.visibility=m==="city"?"visible":"hidden"; }
  Street.active=(m==="street"||m==="room"); if(m==="city") Street.hidePrompt(); renderAll();
}

/* ================= STREET + ROOMS (canvas 2D, 960x540) ================= */
const Street=(()=>{
  const cv=document.getElementById("street"), g=cv.getContext("2d"); g.imageSmoothingEnabled=false;
  const VW=960,VH=540,GROUND=468,FLOOR=452;
  const img={}; const load=(k,src)=>new Promise(r=>{ const i=new Image(); i.onload=()=>{img[k]=i;r();}; i.onerror=()=>r(); i.src=src; });
  const lots=[]; let W=0, camX=0, px=200, target=null, face=1, walkT=0, autoAct=null, near=null, t0=performance.now();
  let room=null, rpx=0, streetPx=0; const keys={};
  async function init(){
    await Promise.all([load("back","assets/sky_back.png"),load("bld","assets/sky_buildings.png"),load("front","assets/sky_front.png"),load("clouds","assets/clouds.png"),load("cats","assets/cats.png"),load("room","assets/room.jpg"),load("biz","assets/biz_office.jpg"),load("bg_clubs","assets/bg_clubs.jpg"),load("bg_projects","assets/bg_projects.jpg"),load("bg_declutter","assets/bg_declutter.jpg"),load("bg_learning","assets/bg_learning.jpg"),load("bg_salon","assets/bg_salon.jpg"),load("arch","assets/arch.png"),load("gate","assets/gate.jpg"),
      ...PLACES.map(p=>load(p.facade,"assets/f/"+p.facade+".png"))]);
    let x=120;
    for(const p of PLACES){ const im=img[p.facade]; const w=im?im.width:200, h=im?im.height:330; lots.push({p,x,w,h,door:x+w/2,deco:im?greenify(im,x):null}); x+=w+64; }
    W=x+60; px=lots[2].door; fit(); addEventListener("resize",fit);
    addEventListener("keydown",e=>{ if(!Street.active||e.target.closest("input,select,textarea")) return; keys[e.key]=true;
      if((e.key==="e"||e.key==="E"||e.key==="Enter")&&!openPlace&&!logOpen){ act(); e.preventDefault(); } });
    addEventListener("keyup",e=>{ keys[e.key]=false; });
    cv.addEventListener("pointerdown",e=>{ if(openPlace||logOpen) return; const r=cv.getBoundingClientRect(); const sx=(e.clientX-r.left)/r.width*VW, sy=(e.clientY-r.top)/r.height*VH;
      if(room){ const st=stations().find(s=>Math.abs(s.x-sx)<s.w/2+10); target=st?st.x:sx; autoAct=st?st:null; return; }
      const wx=sx+camX; const hit=lots.find(l=>wx>=l.x&&wx<=l.x+l.w&&sy>GROUND-l.h&&sy<GROUND); target=hit?hit.door:wx; autoAct=hit?{enter:hit.p.id}:null; });
    requestAnimationFrame(loop);
  }

  // ---- biophilic touches, baked once per facade ----
  function greenify(im,seed){
    const W=im.width+20, H=im.height+30, c=document.createElement("canvas"); c.width=W; c.height=H; const x=c.getContext("2d");
    let s0=seed*9301+49297; const rnd=()=>((s0=(s0*16807)%2147483647)/2147483647);
    const LEAF=["#24452f","#2f5a3a","#3c6f45","#4f8a52","#6aa060"];
    const leaf=(px,py)=>{ x.fillStyle=LEAF[(rnd()*LEAF.length)|0]; x.fillRect(px|0,py|0,2+(rnd()<.4),2); };
    x.drawImage(im,10,30);
    // rooftop garden: railing + shrubs + a small tree
    x.fillStyle="#1d1626"; x.fillRect(10,24,im.width,2); for(let k=12;k<im.width+8;k+=8) x.fillRect(k,24,1,6);
    for(let k=0;k<im.width;k+=3){ const hgt=4+rnd()*8; for(let j=0;j<hgt;j+=2) leaf(12+k+rnd()*3,30-j-rnd()*2); }
    const tx=20+rnd()*(im.width-40); for(let j=0;j<60;j++){ const a=rnd()*Math.PI*2, r=rnd()*11; leaf(tx+Math.cos(a)*r,10+Math.sin(a)*r*.8); } x.fillStyle="#2a1d16"; x.fillRect(tx|0,16,2,12);
    // ivy climbing both sides and hanging from the cornice
    for(const side of [0,1]){ let px=side?im.width+8-rnd()*4:12+rnd()*4; const top=30+im.height*(.25+rnd()*.35);
      for(let py=H-8;py>top;py-=2){ px+=(rnd()-.5)*3; const spread=3+rnd()*5; for(let k=0;k<3;k++) leaf(px+(side?-1:1)*rnd()*spread,py+rnd()*2); } }
    for(let k=0;k<im.width;k+=2){ if(rnd()<.55){ const len=rnd()*28; for(let j=0;j<len;j+=2) leaf(12+k+(rnd()-.5)*2,32+j); } }
    // planters by the door + window-box hints along the shopfront line
    const dx=10+im.width/2; [[-34],[26]].forEach(([o])=>{ x.fillStyle="#3a2a22"; x.fillRect(dx+o,H-12,10,10); for(let j=0;j<16;j++) leaf(dx+o+rnd()*10,H-22+rnd()*10); });
    for(let k=16;k<im.width;k+=28) if(rnd()<.7){ x.fillStyle="#3a2a22"; x.fillRect(10+k,30+im.height*.62,14,3); for(let j=0;j<8;j++) leaf(10+k+rnd()*14,30+im.height*.62-3-rnd()*4); }
    return c;
  }
  function tree(cx,base,seed){ let s0=seed*7+13; const rnd=()=>((s0=(s0*16807)%2147483647)/2147483647);
    R(cx-2,base-70,5,70,"#2a1d16");
    const C=["#1f3a2a","#2a4d34","#36623f","#4a7c4c"]; for(let j=0;j<140;j++){ const a=rnd()*Math.PI*2, r=Math.sqrt(rnd())*30; g.fillStyle=C[(rnd()*C.length)|0]; g.fillRect(Math.round(cx+Math.cos(a)*r),Math.round(base-92+Math.sin(a)*r*.85),3,3); } }
  function fit(){ const s=Math.min(innerWidth/VW,innerHeight/VH); cv.style.width=VW*s+"px"; cv.style.height=VH*s+"px"; }
  function act(){
    if(room){ const st=nearStation(); if(!st) return;
      if(st.exit) leaveRoom();
      else if(st.door){ enterRoom(st.door); }
      else if(st.portrait!=null){ openBoard("hall"); const m=S.models[st.portrait]; if(m.unlocked){ portrait=st.portrait; renderBoard(); } }
      else openBoard(room); return; }
    if(near) enterRoom(near.p.id);
  }
  let hubPx=0;
  async function enterRoom(id){ door(); fade.classList.add("on"); await wait(320); openPlace=null;
    if(room && SUBS[id]){ hubPx=rpx; } else streetPx=px;
    room=id; rpx=110; target=null; autoAct=null; acknowledge(id); markVisit(id); setMode("room"); lastPrompt="-"; await wait(60); fade.classList.remove("on"); }
  async function leaveRoom(){ if(!room) return; door(); openPlace=null; fade.classList.add("on"); await wait(320);
    if(SUBS[room]){ room=SUBS[room].parent; rpx=hubPx; setMode("room"); } else { room=null; px=streetPx; setMode("street"); }
    lastPrompt="-"; await wait(60); fade.classList.remove("on"); }
  const nearStation=()=>stations().find(s=>Math.abs(s.x-rpx)<s.w/2+14)||null;
  function jumpTo(id){ const l=lots.find(l=>l.p.id===id); if(l){ px=l.door; camX=clampCam(px-VW/2); target=null; } }
  function walkTo(id,enter){ const l=lots.find(l=>l.p.id===id); if(l){ target=l.door; autoAct=enter?{enter:id}:null; } }
  const clampCam=x=>Math.max(0,Math.min(W-VW,x));
  function tile(im,par,y,scale,drift=0){ if(!im) return; const w=im.width*scale,h=im.height*scale; let off=-((camX*par+drift)%w); if(off>0) off-=w; for(let x=off;x<VW;x+=w) g.drawImage(im,Math.floor(x),y,w,h); }
  function glow(x,y,r,col,a){ const gr=g.createRadialGradient(x,y,0,x,y,r); gr.addColorStop(0,col.replace("A",a)); gr.addColorStop(1,col.replace("A",0)); g.fillStyle=gr; g.fillRect(x-r,y-r,r*2,r*2); }
  const R=(x,y,w,h,c)=>{ g.fillStyle=c; g.fillRect(Math.round(x),Math.round(y),w,h); };
  let catX=null, catFace=1, catWalk=0;
  function drawPlayer(x,y,scale,fr){
    // cat companion trails behind her, sits when she stops
    const want=x-face*18*scale; if(catX==null||Math.abs(catX-want)>400) catX=want; const d=want-catX; const moving=Math.abs(d)>3;
    if(moving){ catX+=Math.sign(d)*Math.min(Math.abs(d),3+Math.abs(d)*.08); catFace=Math.sign(d); catWalk+=.25; }
    const cf=moving?(Math.floor(catWalk)%2):2, cs=scale*.9; g.save(); g.translate(Math.round(catX),y-10*cs); if(catFace<0) g.scale(-1,1); g.drawImage(CAT,cf*14,0,14,10,-7*cs,0,14*cs,10*cs); g.restore();
    const k=scale/2; g.fillStyle="rgba(10,6,20,.45)"; g.fillRect(x-18*k,y-3,36*k,5);
    if(AKI.complete&&AKI.naturalWidth){ const pose=(room&&openPlace)?"sit":walkT?(Math.floor(walkT*5)%2?"walk":"stand"):(idleT>2.5?"front":"stand"); const [sx0,sy0,sw0,sh0]=AKF[pose], src=AKI_OL||AKI, o=AKI_OL?2:0, sx=sx0+o-o, sy=sy0, sw=sw0+o*2, sh=sh0+o*2; const bob=walkT&&Math.floor(walkT*5)%2?-1:0;
      g.save(); g.imageSmoothingEnabled=false; g.translate(x,y-sh*k+bob*k); if(face<0) g.scale(-1,1); g.drawImage(src,sx0+o-o,sy0+o-o,sw,sh,-sw/2*k,0,sw*k,sh*k); g.restore(); }
    else { g.save(); g.translate(x,y-PH*scale); if(face<0) g.scale(-1,1); g.drawImage(PLAYER,fr*PW,0,PW,PH,-PW/2*scale,0,PW*scale,PH*scale); g.restore(); } }
  function sign(cx,sy,label,hot,dim){ g.font="600 14px 'Pixelify Sans', monospace"; g.textAlign="center"; g.textBaseline="middle"; const tw=g.measureText(label).width+18;
    R(cx-tw/2,sy-11,tw,22,"#1d1430"); R(cx-tw/2,sy-11,tw,2,hot?"#f2c063":"#4b3a6b"); R(cx-tw/2,sy+9,tw,2,hot?"#f2c063":"#4b3a6b"); g.fillStyle=dim?"#9a8bb5":"#f6e7cf"; g.fillText(label,cx,sy+1); }
  function diamond(cx,by,state){ g.fillStyle=state==="new"?"#f2c063":"#8d7a5a"; g.beginPath(); g.moveTo(cx,by-9); g.lineTo(cx+7,by); g.lineTo(cx,by+9); g.lineTo(cx-7,by); g.fill(); if(state==="new"){ R(cx-1,by-5,2,6,"#2a1a08"); R(cx-1,by+3,2,2,"#2a1a08"); } }
  function cat(row,frames,fps,x,y,s,t){ if(!img.cats) return; const f=Math.floor(t*fps)%frames; g.drawImage(img.cats,f*64,row*64,64,64,Math.round(x),Math.round(y-64*s),64*s,64*s); }

  function drawStreet(t){
    g.fillStyle="#2b1d3f"; g.fillRect(0,0,VW,VH);
    tile(img.back,.04,-36,3); tile(img.clouds,.08,-10,1.2,t*6); tile(img.bld,.18,-36,3); tile(img.front,.35,-36,3);
    for(const l of lots){ const sx=Math.round(l.x-camX); if(sx>VW||sx+l.w<0) continue; const im=img[l.p.facade]; if(l.deco) g.drawImage(l.deco,sx-10,GROUND-l.h-30); else if(im) g.drawImage(im,sx,GROUND-l.h); }
    g.save(); g.globalCompositeOperation="multiply"; const gr=g.createLinearGradient(0,0,0,VH); gr.addColorStop(0,"#d3b0e0"); gr.addColorStop(.6,"#bf9bd1"); gr.addColorStop(1,"#8a74b0"); g.fillStyle=gr; g.fillRect(0,0,VW,VH); g.restore();
    R(0,GROUND,VW,30,"#3b2c4f"); R(0,GROUND,VW,3,"#4a3862"); for(let x=-((camX)%32);x<VW;x+=32) R(x,GROUND+3,2,27,"#33264a");
    R(0,GROUND+30,VW,VH-GROUND-30,"#1e1630"); for(let x=-((camX)%64);x<VW;x+=64) R(x,GROUND+52,28,3,"#d9b25a");
    g.save(); g.globalCompositeOperation="lighter";
    for(const l of lots){ const sx=l.x-camX, lx=Math.round(sx+l.w+32), fl=.55+.08*Math.sin(t*7+l.x)+(Math.random()<.01?-.2:0);
      glow(lx,GROUND-108,95,"rgba(255,170,90,A)",fl*.6); glow(lx,GROUND,75,"rgba(255,160,80,A)",fl*.4);
      if(l.p.built&&markerFor(l.p.id)==="new") glow(sx+l.w/2,GROUND-22,70+6*Math.sin(t*4),"rgba(255,205,100,A)",.55);
      glow(sx+l.w/2,GROUND-20,40,"rgba(255,190,120,A)",.25); }
    g.restore();
    for(const l of lots){ const lx=Math.round(l.x-camX+l.w+32); if(lx<-80||lx>VW+80) continue; tree(lx-14,GROUND,l.x); }
    for(const l of lots){ const lx=Math.round(l.x-camX+l.w+32); R(lx-2,GROUND-104,4,104,"#1a1226"); R(lx-8,GROUND-110,16,6,"#1a1226"); R(lx-6,GROUND-104,12,3,"#ffd38a"); }
    for(const l of lots){ const cx=Math.round(l.door-camX); if(cx<-200||cx>VW+200) continue; const sy=GROUND-l.h-18;
      sign(cx,sy,l.p.name+(l.p.built?"":" · soon"),near===l,!l.p.built);
      const m=l.p.built?markerFor(l.p.id):""; if(m) diamond(cx,sy-28+Math.round(Math.sin(t*3+l.x)*3),m); }
    const L=id=>lots.find(l=>l.p.id===id);
    cat(0,4,4,L("today").x+L("today").w-46-camX,GROUND+4,.6,t); cat(1,2,2,L("salon").x+10-camX,GROUND+4,.6,t); cat(2,4,1.5,L("learning").x+L("learning").w-50-camX,GROUND+6,.55,t);
    drawPlayer(Math.round(px-camX),GROUND+18,2,walkT?1+Math.floor(walkT*8)%4:0);
  }

  // ---------- rooms ----------
  // every building can get its own interior image later: ROOM_IMG[id] = "assets/rooms/<id>.jpg"
  const ROOM_DEF={accent:"#f2c063",label:"Notice board"};
  const ROOM={ today:{label:"Today board"}, salon:{accent:"#f08aa0",label:"Ritual board"}, goals:{label:"Goal board"}, hall:{label:"Portraits"},
    career:{label:"Career board"}, clubs:{label:"Clubs board"}, people:{label:"People board"}, declutter:{label:"Reset board"}, projects:{label:"Project board"}, learning:{label:"Course board"} };
  const RC=id=>({...ROOM_DEF,...(ROOM[id]||{})});
  function stations(){ if(!room) return []; const s=[{x:40,w:56,label:SUBS[room]?"Back to the lobby":"Exit",exit:true}];
    const P=PLACES.find(p=>p.id===room)||(SUBS[room]&&SUBS[room].doors?{id:room,doors:SUBS[room].doors}:null);
    if(P&&P.doors){ const xs=P.doors.length===3?[166,481,798]:[166,798]; s.push({x:P.doors.length===3?325:481,w:80,label:RC(room).label,board:true}); P.doors.forEach((d,i)=>s.push({x:xs[i],w:110,label:PL(d).name,door:d})); }
    else if(room==="hall") S.models.forEach((m,n)=>s.push({x:170+n*80,w:60,label:m.unlocked?m.name.split(" ")[0]:"Locked",portrait:n}));
    else s.push({x:690,w:260,label:RC(room).label,board:true});
    return s; }
  const FLOOR2=440;
  const ROOMBG={bizideas:"biz",clubs:"bg_clubs",nexora:"bg_clubs",mktg:"bg_clubs",icc:"bg_clubs",projects:"bg_projects",declutter:"bg_declutter",learning:"bg_learning",salon:"bg_salon"};
  function roomBg(dim){ const im=(ROOMBG[room]&&img[ROOMBG[room]])||img.room; if(im){ const sc=VW/im.width, h=im.height*sc; g.imageSmoothingEnabled=true; g.drawImage(im,0,(VH-h)/2,VW,h); g.imageSmoothingEnabled=false; } else R(0,0,VW,VH,"#2a2140");
    if(dim){ g.fillStyle=`rgba(14,10,30,${dim})`; g.fillRect(0,0,VW,VH); } }
  // stone archway with a glimpse of the room behind it
  function archDoor(cx,base,d,t,hot){ const A=img.arch, s=.6, w=A?A.width*s:240, h=A?A.height*s:236, x=cx-w/2, y=base-h;
    g.save(); g.beginPath(); const ox=x+85*s, ow=117*s, oy=y+83*s, oh=168*s, r=ow/2; g.moveTo(ox,oy+oh); g.lineTo(ox,oy+r); g.arc(ox+r,oy+r,r,Math.PI,0); g.lineTo(ox+ow,oy+oh); g.closePath(); g.clip();
    const im=img.room; if(im){ g.imageSmoothingEnabled=true; const sx=(d.length*137)%Math.max(1,im.width-400); g.drawImage(im,sx,180,360,600,ox-10,oy,ow+20,oh); g.imageSmoothingEnabled=false; }
    g.globalCompositeOperation="lighter"; glow(ox+ow/2,oy+oh*.6,ow,"rgba(255,200,140,A)",.25+.08*Math.sin(t*2+cx)); g.restore();
    if(A){ g.imageSmoothingEnabled=true; g.drawImage(A,x,y,w,h); g.imageSmoothingEnabled=false; }
    if(hot){ g.save(); g.globalCompositeOperation="lighter"; glow(cx,base-h/2,w*.7,"rgba(200,180,255,A)",.25); g.restore(); }
    const P=PL(d), m=P.built?markerFor(d):""; sign(cx,y-6,P.name+(P.built?"":" · soon"),hot,!P.built); if(m) diamond(cx,y-34+Math.round(Math.sin(t*3+cx)*3),m); }
  function drawRoom(t){
    const P=PL(room), built=P.built, hub=PLACES.find(p=>p.id===room&&p.doors)||(SUBS[room]&&SUBS[room].doors?{id:room,doors:SUBS[room].doors}:null);
    if(!hub) roomBg(0);
    g.save(); g.globalCompositeOperation="lighter"; glow(626,220,110,"rgba(255,170,90,A)",.18+.05*Math.sin(t*.8)); glow(780,360,140,"rgba(255,190,120,A)",.10+.03*Math.sin(t*1.3)); g.restore();
    for(let i=0;i<26;i++){ const lx=30+((i*131)%520), ly=290+((i*47)%60); if(Math.sin(t*1.7+i*2.3)>.55) R(lx,ly,2,2,"#ffe3a0"); }
    const st=nearStation();
    if(hub){ // gateway hall (Venn's image): our labels over the painted arches, a standing board
      const G=img.gate; if(G){ g.imageSmoothingEnabled=true; const sc=VW/G.width, h=G.height*sc; g.drawImage(G,0,(VH-h)/2,VW,h); g.imageSmoothingEnabled=false; }
      // cover the painted plaques (City / Nature / Space) with blank star plaques
      [[76,262],[383,265],[709,265]].forEach(([px,py])=>{ g.fillStyle="#2a2633"; g.beginPath(); g.moveTo(px-17,py-36); g.lineTo(px+17,py-36); g.lineTo(px+17,py+28); g.lineTo(px,py+38); g.lineTo(px-17,py+28); g.closePath(); g.fill(); g.strokeStyle="#c9a86a"; g.lineWidth=1; g.stroke();
        g.fillStyle="#e9d6a6"; g.beginPath(); g.moveTo(px,py-12); g.lineTo(px+3,py-3); g.lineTo(px+12,py); g.lineTo(px+3,py+3); g.lineTo(px,py+12); g.lineTo(px-3,py+3); g.lineTo(px-12,py); g.lineTo(px-3,py-3); g.closePath(); g.fill(); });
      stations().forEach(s=>{ if(s.door){ const hot=st===s, P2=PL(s.door), m=P2.built?markerFor(s.door):"";
          if(hot){ g.save(); g.globalCompositeOperation="lighter"; glow(s.x,290,120,"rgba(255,220,170,A)",.28); g.restore(); }
          sign(s.x,146,P2.name+(P2.built?"":" · soon"),hot,!P2.built); if(m) diamond(s.x,120+Math.round(Math.sin(t*3+s.x)*3),m); } });
      const bs=stations().find(s=>s.board), m=markerFor(room), bx=bs.x;
      R(bx-1,420,2,62,"#c9a86a"); R(bx-14,480,28,2,"#c9a86a");
      g.fillStyle="rgba(28,24,40,.78)"; g.fillRect(bx-32,358,64,64); g.strokeStyle="#c9a86a"; g.lineWidth=1; g.strokeRect(bx-32.5,357.5,65,65);
      const open=itemsFor(room).filter(i=>!i.done); for(let i=0;i<Math.min(open.length,6);i++){ R(bx-24,366+i*9,i%3?36:44,3,open[i].overdue?"#f08aa0":"#e9d6a6"); }
      if(m) diamond(bx,342+Math.round(Math.sin(t*3)*3),m); sign(bx,350-28,RC(room).label,st&&st.board,false); }
    else if(room!=="hall"){ const m=built?markerFor(room):"", open=itemsFor(room).filter(i=>!i.done).length;
      if(built){ if(m) diamond(690,300+Math.round(Math.sin(t*3)*3),m);
        g.font="600 12px 'Pixelify Sans', monospace"; g.textAlign="center"; g.fillStyle="#ffe3a0"; g.fillText(open?`${open} open quest${open===1?"":"s"}`:"All clear ✓",690,412); }
      else { g.font="600 13px 'Pixelify Sans', monospace"; g.textAlign="center"; g.fillStyle="#d8c8f0"; g.fillText("Coming soon",690,412); }
      stations().forEach(s=>{ if(s.board) sign(s.x,272,P.name+" · "+s.label,st===s,false); }); }
    else { S.models.forEach((m,n)=>{ const fx=170+n*80; R(fx-1,370,2,70,"#1a1226"); R(fx-14,440,28,3,"#1a1226");
        R(fx-26,282,52,70,"#c98a2c"); R(fx-22,286,44,62,m.unlocked?"#3a2b55":"#15100e");
        if(m.unlocked){ R(fx-7,298,14,16,"#e9b48f"); R(fx-10,294,20,7,"#3a2520"); R(fx-12,316,24,28,"#f2c063"); } else { g.font="700 20px 'Pixelify Sans', monospace"; g.textAlign="center"; g.fillStyle="#4b3a6b"; g.fillText("?",fx,324); } });
      stations().forEach(s=>{ if(s.portrait!=null) sign(s.x,266,s.label,st===s,false); }); }
    g.save(); g.globalCompositeOperation="lighter"; glow(40,420,60,"rgba(255,200,130,A)",.25); g.restore(); R(14,300,52,150,"rgba(20,14,30,.85)"); R(14,300,52,2,"#f2c063"); R(14,300,2,150,"#f2c063"); R(64,300,2,150,"#f2c063");
    if(room==="today") cat(0,4,4,250,FLOOR2+66,.7,t); if(room==="salon") cat(1,2,2,250,FLOOR2+66,.7,t); if(room==="learning") cat(2,4,1.5,250,FLOOR2+68,.65,t);
    sign(40,284,SUBS[room]?"Lobby":"Exit",st&&st.exit,false);
    drawPlayer(Math.round(rpx),FLOOR2+70,3,walkT?1+Math.floor(walkT*8)%4:0);
  }
  function loop(now){
    requestAnimationFrame(loop); if(!Street.active) return;
    const t=(now-t0)/1000, dt=Math.min(.05,(now-(loop.last||now))/1000); loop.last=now;
    let dir=0; if(keys.ArrowRight||keys.d||keys.D) dir=1; if(keys.ArrowLeft||keys.a||keys.A) dir=-1;
    const pos=room?rpx:px;
    if(dir){ target=null; autoAct=null; }
    else if(target!=null){ const d=target-pos; if(Math.abs(d)<3){ target=null; const a=autoAct; autoAct=null; if(a&&!openPlace){ if(a.enter) enterRoom(a.enter); else { act(); } } } else dir=Math.sign(d); }
    if(openPlace||logOpen) dir=0;
    if(dir){ face=dir; walkT+=dt; idleT=0; if(room) rpx=Math.max(40,Math.min(VW-40,rpx+dir*270*dt)); else px=Math.max(40,Math.min(W-40,px+dir*215*dt)); } else { walkT=0; idleT+=dt; }
    if(room){ drawRoom(t); }
    else { camX+=(clampCam(px-VW/2)-camX)*Math.min(1,dt*4); near=lots.find(l=>Math.abs(l.door-px)<36)||null; drawStreet(t); }
    const v=g.createRadialGradient(VW/2,VH/2,VH*.35,VW/2,VH/2,VH*.95); v.addColorStop(0,"rgba(0,0,0,0)"); v.addColorStop(1,"rgba(12,6,24,.5)"); g.fillStyle=v; g.fillRect(0,0,VW,VH);
    renderPrompt();
  }
  let lastPrompt="";
  function renderPrompt(){
    let text="";
    if(!openPlace&&!logOpen){ if(room){ const s=nearStation(); if(s) text=s.exit?(SUBS[room]?"Back to the "+PL(SUBS[room].parent).name+" lobby":"Leave to the street"):s.door?"Go through to "+PL(s.door).name:s.portrait!=null?(S.models[s.portrait].unlocked?"Look at "+S.models[s.portrait].name:"Locked: unlock at the portrait wall"):"Read the "+RC(room).label.toLowerCase(); }
      else if(near) text="Go inside "+near.p.name; }
    const key=(room||"st")+text; if(key===lastPrompt) return; lastPrompt=key;
    let b=document.getElementById("enterBtn"), h=document.getElementById("hint");
    if(!h){ h=document.createElement("div"); h.id="hint"; h.className="hint glass"; document.body.appendChild(h); }
    h.textContent=room?"← → walk · E use · Esc leave":"← → or tap to walk · E go inside · Q quest log · Esc city";
    if(text){ if(!b){ b=document.createElement("button"); b.id="enterBtn"; b.className="enter glass"; document.body.appendChild(b); b.onclick=act; } b.innerHTML=`<span class="ek">${UI_ICONS.spark}</span><i class="sep"></i><span class="et">${esc(text)}</span><kbd>E</kbd><span class="ea">${UI_ICONS.arrow}</span>`; }
    else if(b) b.remove();
  }
  return { init, jumpTo, walkTo, leaveRoom, active:false, hidePrompt(){ document.getElementById("enterBtn")?.remove(); document.getElementById("hint")?.remove(); lastPrompt="-"; } };
})();

/* ================= CITY — Venn's floating island (painted), with star pins, zoom & pan ================= */
const City={ dive:async()=>{}, reset(){}, refresh(){}, focus(){}, unfocus(){}, zoomBy(){}, ready:false };
async function initCity(){
  const IW=1412, IH=1114;
  // pin = the top of each building on the painting (image pixels)
  const SPOT={today:[722,286],goals:[838,330],career:[352,520],salon:[516,642],clubs:[716,580],people:[913,600],learning:[1103,508],hall:[716,768],declutter:[1012,690],projects:[600,455],skills:[260,640]};
  const LAMPS=[[585,395],[630,535],[800,527],[695,640],[655,600],[800,600],[860,560],[990,575],[1180,612],[432,730],[640,842],[780,842],[895,765],[540,700],[1060,660]];
  document.getElementById("city")?.remove();
  const isle=document.createElement("div"); isle.id="isle"; isle.setAttribute("aria-label","Your floating island. Tap a pin to visit a place.");
  const world=document.createElement("div"); world.className="world"; world.style.width=IW+"px"; world.style.height=IH+"px";
  world.innerHTML=`<img src="assets/island.jpg" alt="" draggable="false">
    <i class="fglow" style="left:${716/IW*100}%;top:${606/IH*100}%"></i>
    <i class="falls" style="left:${1074/IW*100}%;top:${790/IH*100}%"></i>
    ${LAMPS.map(([x,y],i)=>`<i class="lamp" style="left:${x/IW*100}%;top:${y/IH*100}%;animation-delay:${(i*.37)%2}s"></i>`).join("")}
    <i class="cloud c1"></i><i class="cloud c2"></i>`;
  isle.appendChild(world); document.body.insertBefore(isle,document.getElementById("labels"));
  const pinLayer=document.createElement("div"); pinLayer.className="pins"; world.appendChild(pinLayer);
  const pin={};
  PLACES.forEach((p,k)=>{ const [x,y]=SPOT[p.id]||(SPOT[p.id]=[300+((k*97)%800),300+((k*53)%420)]); const b=document.createElement("button"); b.className="pin4"+(p.built?"":" soon"); b.dataset.focus=p.id; b.setAttribute("aria-label",p.name);
    b.style.left=(x/IW*100)+"%"; b.style.top=(y/IH*100)+"%"; pinLayer.appendChild(b); pin[p.id]=b; });
  // camera
  let base=1, zoom=1, tx=0, ty=0, anim=null, focused=null; const ZMIN=1, ZMAX=3.4, NAMES_AT=1.55;
  function fit(){ base=Math.min(innerWidth/IW,innerHeight/IH)*1.06; }
  function clamp(){ const s=base*zoom, w=IW*s, h=IH*s; const mx=Math.max(0,(w-innerWidth)/2+80), my=Math.max(0,(h-innerHeight)/2+80);
    const cx=(innerWidth-w)/2, cy=(innerHeight-h)/2; tx=Math.max(cx-mx,Math.min(cx+mx,tx)); ty=Math.max(cy-my,Math.min(cy+my,ty)); }
  function centerOn(ix,iy,z){ const s=base*z; return [innerWidth/2-ix*s, innerHeight/2-iy*s]; }
  function apply(){ clamp(); world.style.transform=`translate(${tx}px,${ty}px) scale(${base*zoom})`; world.style.setProperty("--inv",1/(base*zoom)); isle.classList.toggle("named",zoom>=NAMES_AT); }
  function reset(){ fit(); zoom=1; [tx,ty]=centerOn(IW/2,IH/2,1); focused=null; anim=null; apply(); updateCard(); }
  addEventListener("resize",()=>{ const z=zoom; fit(); zoom=z; apply(); });
  function animateTo(ix,iy,z1,dur=.6){ return new Promise(res=>{ const [x1,y1]=centerOn(ix,iy,z1); anim={x0:tx,y0:ty,z0:zoom,x1,y1,z1,t:0,dur,res}; }); }
  let last=performance.now();
  (function tick(now){ requestAnimationFrame(tick); const dt=Math.min(.05,(now-last)/1000); last=now;
    if(anim){ anim.t=Math.min(1,anim.t+dt/anim.dur); const e=anim.t<.5?4*anim.t**3:1-(-2*anim.t+2)**3/2;
      zoom=anim.z0+(anim.z1-anim.z0)*e; tx=anim.x0+(anim.x1-anim.x0)*e; ty=anim.y0+(anim.y1-anim.y0)*e; apply(); if(anim.t>=1){ const r=anim.res; anim=null; r(); } }
    else if(mode==="title"){ const k=now/1000; zoom=1.04+Math.sin(k*.25)*.02; const [x,y]=centerOn(IW/2+Math.sin(k*.18)*30,IH/2,zoom); tx=x; ty=y; apply(); } })(last);
  // focus card
  const card=document.createElement("div"); card.id="focus"; card.className="focus glass"; card.hidden=true; document.body.appendChild(card);
  function updateCard(){ if(!focused||mode!=="city"){ card.hidden=true; return; } const p=PL(focused), open=itemsFor(focused).filter(i=>!i.done), late=open.filter(i=>i.overdue).length;
    card.hidden=false; card.innerHTML=`<div><div class="ft">${esc(p.name)}</div><div class="fs">${esc(p.sub)}</div><div class="fs">${p.built?`${open.length} open quest${open.length===1?"":"s"}${late?` · <b class="late">${late} late</b>`:""}`:"Not built yet"}</div></div>
      <div class="fb"><button class="sell" data-go="${focused}">Enter ▸</button><button class="ghost" data-act="unfocus" aria-label="Close">✕</button></div>`; }
  City.refresh=()=>{ PLACES.forEach(p=>{ const m=p.built?markerFor(p.id):""; const n=itemsFor(p.id).filter(i=>!i.done).length;
    pin[p.id].className="pin4"+(p.built?"":" soon")+(m?" has "+m:"")+(focused===p.id?" hot":"");
    pin[p.id].innerHTML=`<span class="pname">${esc(p.name)}${p.built?"":" · soon"}</span><span class="phead">${n&&p.built?`<b>${n}</b>`:`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3c.5 4.5 2.2 6.6 7 9-4.8 2.4-6.5 4.5-7 9-.5-4.5-2.2-6.6-7-9 4.8-2.4 6.5-4.5 7-9z"/></svg>`}</span>`;
     }); updateCard(); };
  City.focus=id=>{ focused=id; const [x,y]=SPOT[id]; animateTo(x,y+60,Math.max(zoom,2.1)); City.refresh(); };
  City.unfocus=()=>{ focused=null; City.refresh(); };
  City.zoomBy=(f,cx=innerWidth/2,cy=innerHeight/2)=>{ const z1=Math.max(ZMIN,Math.min(ZMAX,zoom*f)); const s0=base*zoom, s1=base*z1; tx=cx-(cx-tx)*s1/s0; ty=cy-(cy-ty)*s1/s0; zoom=z1; anim=null; apply(); };
  City.reset=reset;
  City.dive=id=>{ focused=null; updateCard(); const [x,y]=SPOT[id]; return animateTo(x,y+40,3.4,.8); };
  // drag / pinch / wheel
  const pts=new Map(); let drag=null, pinch=null;
  isle.addEventListener("pointerdown",e=>{ if(e.target.closest("button")) return; isle.setPointerCapture(e.pointerId); pts.set(e.pointerId,{x:e.clientX,y:e.clientY}); drag={x:e.clientX,y:e.clientY,moved:0}; anim=null;
    if(pts.size===2){ const [a,b]=[...pts.values()]; pinch={d:Math.hypot(a.x-b.x,a.y-b.y),z:zoom}; } });
  isle.addEventListener("pointermove",e=>{ if(!pts.has(e.pointerId)) return; pts.set(e.pointerId,{x:e.clientX,y:e.clientY});
    if(pinch&&pts.size===2){ const [a,b]=[...pts.values()]; City.zoomBy(pinch.z*Math.hypot(a.x-b.x,a.y-b.y)/pinch.d/zoom,(a.x+b.x)/2,(a.y+b.y)/2); return; }
    if(drag){ const dx=e.clientX-drag.x, dy=e.clientY-drag.y; drag.moved+=Math.abs(dx)+Math.abs(dy); drag.x=e.clientX; drag.y=e.clientY; tx+=dx; ty+=dy; apply(); } });
  const up=e=>{ const click=drag&&drag.moved<6; pts.delete(e.pointerId); if(pts.size<2) pinch=null; drag=null; if(click&&focused) City.unfocus(); };
  isle.addEventListener("pointerup",up); isle.addEventListener("pointercancel",up);
  isle.addEventListener("wheel",e=>{ e.preventDefault(); City.zoomBy(Math.pow(1.0015,-e.deltaY),e.clientX,e.clientY); },{passive:false});
  reset(); City.refresh();
  City.ready=true; document.getElementById("loading")?.remove();
}


/* ================= Obsidian → game mailbox (artifact db "inbox") =================
   Any Claude chat can drop a document into collection "inbox" of this artifact; the game imports each once.
   Shapes: {type:"quest",title,building,size,repeat,due,days,note} · {type:"done",title|ref} · {type:"goal",title,note}
           {type:"project",title,note} · {type:"course",title,note} · {type:"person",name,where,group} · {type:"building",id,name,sub} */
const SIZE={small:"small",medium:"medium",big:"big",s:"small",m:"medium",l:"big"};
const BLOCKED_DOCS=["q-20261020-lifeisle-names"];
function importDoc(id,d){
  S.imported=S.imported||{}; if(BLOCKED_DOCS.includes(id)){ S.imported[id]=1; return false; } if(S.imported[id]||!d||!d.type) return false;
  if(d.type==="quest"&&d.title&&S.rules.some(r=>!r.archived&&r.title&&r.title.toLowerCase().trim()===String(d.title).toLowerCase().trim())){ S.imported[id]=Date.now(); return false; }
  const nid=()=>Math.random().toString(36).slice(2,9), place=d.building&&(PL(d.building)?d.building:null)||"today";
  switch(d.type){
    case "quest": S.rules.push({id:"ix-"+id,title:String(d.title||"Untitled quest").slice(0,120),place,tier:SIZE[d.size]||"medium",repeat:["daily","weekly","monthly"].includes(d.repeat)?d.repeat:"once",
        days:d.repeat==="weekly"?(Array.isArray(d.days)&&d.days.length?d.days.map(Number):[dowOf(today())]):undefined,start:today(),due:d.repeat&&d.repeat!=="once"?undefined:(d.due||undefined),note:d.note||undefined,steps:Array.isArray(d.steps)&&d.steps.length?d.steps.slice(0,12).map(x=>({t:String(x).slice(0,100),done:false})):undefined}); break;
    case "done": { const it=itemsFor().find(i=>!i.done&&(i.r.id==="ix-"+d.ref||(d.title&&i.r.title.toLowerCase()===String(d.title).toLowerCase())));
        if(it){ const t=TIERS[it.r.tier]; S.done[it.key]={at:Date.now(),coins:t.coins,xp:t.xp}; S.wallet.coins+=t.coins; S.wallet.xp+=t.xp; } break; }
    case "goal": if(S.goals.some(x=>x.title.toLowerCase()===String(d.title).toLowerCase())) break; S.goals.push({id:nid(),title:d.title,note:d.note,state:"vault",milestones:[]}); break;
    case "project": if(S.projects.some(x=>x.title.toLowerCase()===String(d.title).toLowerCase())) break; S.projects.push({id:nid(),title:d.title,note:d.note,inPortfolio:false}); break;
    case "course": if(S.courses.some(x=>x.title.toLowerCase()===String(d.title).toLowerCase())) break; S.courses.push({id:nid(),title:d.title,note:d.note,done:false}); break;
    case "person": if(d.group==="family"){ S.rules.push({id:"ix-"+id,title:"Call "+d.name,place:"family",tier:"small",repeat:"weekly",days:[0],start:today(),note:d.note}); }
                   else S.people.push({id:nid(),name:d.name,where:d.where||"",status:0,note:d.note}); break;
    case "buy": { const m=mallState(), key=String(d.folder||"daily").toLowerCase(); let f=mallFolders().find(x=>x.id===key||x.title.toLowerCase()===key);
        if(!f){ f={id:"f"+nid(),title:String(d.folder).slice(0,40),icon:"🛍️",color:"#e8b4a0",items:[]}; m.folders.push(f); }
        if(d.item){ const list=(m.added[f.id]=m.added[f.id]||[]); if(![...(f.items||[]),...list].some(x=>x.toLowerCase()===String(d.item).toLowerCase())) list.push(String(d.item).slice(0,80)); } break; }
    case "idea": { bizIdeas(); if(!S.biz.ideas.some(x=>x.title.toLowerCase()===String(d.title).toLowerCase())) S.biz.ideas.push({id:"i"+nid(),title:String(d.title).slice(0,60),sub:d.sub||"New idea",cost:BIZ_COST,color:"#c9b3e0",icon:"💡",note:d.note,pitch:d.pitch||[]}); break; }
    case "dream": { S.internships=S.internships||[]; if(d.name&&!S.internships.some(x=>x.name.toLowerCase()===String(d.name).toLowerCase())) S.internships.push({id:nid(),name:String(d.name).slice(0,60),status:0}); break; }
    case "routine": { S.routineExtra=S.routineExtra||[]; if(d.title&&!routineItems().some(x=>x.title.toLowerCase()===String(d.title).toLowerCase())) S.routineExtra.push({id:"r"+nid(),title:String(d.title).slice(0,80),when:d.when==="night"?"night":"morning",also:Array.isArray(d.also)?d.also:[]}); break; }
    case "building": S.customPlaces=S.customPlaces||[]; if(d.id&&!PL(d.id)) S.customPlaces.push({id:String(d.id),name:d.name||d.id,sub:d.sub||"",built:true,facade:"087_modern"}); break;
    default: return false;
  }
  S.imported[id]=Date.now(); return true;
}
(async()=>{ try{ const db=await window.claude?.use?.("db"); if(!db) return;
  db.collection("inbox").onSnapshot(snap=>{ let n=0, b=0; for(const doc of snap.docs){ const d=doc.data(); if(importDoc(doc.id,d)){ n++; if(d.type==="building") b++; } }
    if(n){ tidyRules(); save(); renderAll(); toast(`${n} update${n>1?"s":""} from Obsidian${b?" · reload to see the new building":""}`); } }, ()=>{}); }catch(e){} })();

/* ================= boot: title over the slowly turning city ================= */
const sky=document.getElementById("sky"); for(let i=0;i<90;i++){ const s=document.createElement("i"); s.style.left=Math.random()*100+"%"; s.style.top=Math.random()*70+"%"; s.style.animationDelay=(Math.random()*3)+"s"; if(Math.random()<.15) s.style.width=s.style.height="3px"; sky.appendChild(s); }
document.getElementById("labels").style.visibility="hidden";
Street.init();
initCity().catch(err=>{ console.warn("3D city unavailable",err); document.getElementById("city")?.remove(); document.getElementById("loading")?.remove(); City.failed=true; });
function start(){ const t=document.getElementById("title"); if(!t) return; t.classList.add("gone"); setTimeout(()=>t.remove(),500); setMusic(true);
  if(City.failed){ setMode("street"); } else { setMode("city"); document.getElementById("labels").style.visibility="visible"; const il=document.getElementById("isle"); if(il) il.style.visibility="visible"; } }
document.getElementById("start").addEventListener("click",start);
addEventListener("keydown",e=>{ if(mode==="title"&&document.getElementById("title")) { e.preventDefault(); start(); } });
