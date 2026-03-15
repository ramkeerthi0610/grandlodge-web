import{useState,useContext,createContext,useCallback,useMemo}from"react";

const TRIAL_DAYS=15;
const LICENSE_KEY="GRAND_LODGE_TRIAL_v1";
const TrialEngine={
  init(){try{const s=localStorage.getItem(LICENSE_KEY);if(!s){const d={startDate:new Date().toISOString()};localStorage.setItem(LICENSE_KEY,JSON.stringify(d));return d;}return JSON.parse(s);}catch(e){return{startDate:new Date().toISOString()};}},
  getDaysLeft(){try{const d=this.init();const diff=Math.floor((new Date()-new Date(d.startDate))/864e5);return Math.max(0,TRIAL_DAYS-diff);}catch(e){return 15;}},
  isExpired(){return this.getDaysLeft()===0;},
  getExpiryDate(){try{const d=this.init();const e=new Date(d.startDate);e.setDate(e.getDate()+TRIAL_DAYS);return e.toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"});}catch(e){return "";}},
  getStartDate(){try{const d=this.init();return new Date(d.startDate).toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"});}catch(e){return "";}},
  extendTrial(days=15){try{const n=new Date();n.setDate(n.getDate()-(TRIAL_DAYS-days));localStorage.setItem(LICENSE_KEY,JSON.stringify({startDate:n.toISOString()}));}catch(e){}}
};

const USERS=[
  {id:"a1",email:"admin@grandlodge.com",pw:"admin123",name:"Admin",role:"admin",av:"AD"},
  {id:"o1",email:"operator@grandlodge.com",pw:"op123",name:"Operator",role:"operator",av:"OP",shift:"Morning"},
];
const RD=[
  ...Array.from({length:5},(_,i)=>({id:101+i,type:"Standard",floor:1,ac:true,maxPax:2,rate:1800,amenities:["WiFi","TV","AC","Geyser"]})),
  ...Array.from({length:5},(_,i)=>({id:201+i,type:"Deluxe",floor:2,ac:true,maxPax:3,rate:2800,amenities:["WiFi","TV","AC","Fridge"]})),
  ...Array.from({length:4},(_,i)=>({id:301+i,type:"Suite",floor:3,ac:true,maxPax:4,rate:5500,amenities:["WiFi","TV","AC","Jacuzzi"]})),
  ...Array.from({length:3},(_,i)=>({id:401+i,type:"Dorm",floor:1,ac:false,maxPax:1,rate:500,amenities:["WiFi","Fan"]})),
];
const ST=["available","occupied","available","occupied","reserved","available","occupied","available","available","reserved","occupied","available","available","available","available","available","available"];
const SV=[{id:"s1",n:"Breakfast",p:180,e:"🍳"},{id:"s2",n:"Lunch",p:250,e:"🍱"},{id:"s3",n:"Dinner",p:280,e:"🍽️"},{id:"s4",n:"Tea",p:40,e:"☕"},{id:"s5",n:"Laundry",p:80,e:"👕"},{id:"s6",n:"Airport",p:600,e:"🚗"},{id:"s7",n:"City Drop",p:400,e:"🚕"}];
const inr=n=>new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:0}).format(n||0);
const calcBill=(svcs,disc,rc,gstOn,gstRate)=>{const s=svcs.reduce((a,i)=>a+i.p*(i.q||1),0);const da=s*(disc/100);const b=s-da+rc;const tax=gstOn?b*gstRate:0;return{s,da,b,tax,total:b+tax*2};};
const SORD=Array.from({length:35},(_,i)=>{const d=new Date();d.setDate(d.getDate()-Math.floor(Math.random()*14));return{id:"INV"+(1e3+i),gn:["Rahul M","Priya S","Amit K","Sunita D","Vijay R","Meera P"][i%6],rm:101+Math.floor(Math.random()*17),tot:1500+Math.floor(Math.random()*8000),pay:["Cash","UPI","Card","Credit"][Math.floor(Math.random()*4)],gstOn:Math.random()>.3,dt:d.toISOString(),op:["o1","o2"][i%2]};});

const Ctx=createContext(null);
const useA=()=>useContext(Ctx);

function Provider({children}){
  const[sc,setSc]=useState("login");
  const[user,setUser]=useState(null);
  const[rooms,setRooms]=useState(RD.map((r,i)=>({...r,status:ST[i]||"available",guest:null})));
  const[guests,setGuests]=useState([
    {id:"G001",name:"Rajesh Mehta",phone:"9876543210",idType:"Aadhaar",idNo:"XXXX-1234",rm:102,ci:"2026-03-12",co:"2026-03-15",ni:3,px:2,pur:"Business",st:"in",adv:2000,svcs:[],gstOn:true},
    {id:"G002",name:"Priya Sharma",phone:"9876543211",idType:"Passport",idNo:"P1234567",rm:201,ci:"2026-03-13",co:"2026-03-14",ni:1,px:1,pur:"Tourism",st:"in",adv:1500,svcs:[{id:"s1",n:"Breakfast",p:180,e:"🍳",q:1}],gstOn:false},
  ]);
  const[orders,setOrders]=useState(SORD);
  const[toast,setToast]=useState(null);
  const[gstCfg,setGstCfg]=useState({on:true,c:6,s:6});
  const notify=useCallback((msg,t="ok")=>{setToast({msg,t,k:Date.now()});setTimeout(()=>setToast(null),3e3);},[]);
  const login=(e,p)=>{if(TrialEngine.isExpired()){notify("Trial expired!","err");return;}const u=USERS.find(x=>x.email===e&&x.pw===p);if(!u){notify("Invalid credentials","err");return;}setUser(u);setSc(u.role==="admin"?"admin":"op");notify("Welcome, "+u.name+"!");};
  const logout=()=>{setUser(null);setSc("login");};
  const checkIn=d=>{const g={...d,id:"G"+Date.now().toString().slice(-4),st:"in",svcs:[]};setGuests(p=>[g,...p]);setRooms(p=>p.map(r=>r.id===d.rm?{...r,status:"occupied",guest:g.name}:r));notify("✓ "+g.name+" checked in Rm "+g.rm+"!");return g;};
  const checkOut=(gid,bill,pay)=>{const g=guests.find(x=>x.id===gid);if(!g)return;setOrders(p=>[{id:"INV"+Date.now().toString().slice(-6),gn:g.name,rm:g.rm,tot:bill.total,pay,gstOn:g.gstOn,dt:new Date().toISOString(),op:user?.id},...p]);setGuests(p=>p.map(x=>x.id===gid?{...x,st:"out"}:x));setRooms(p=>p.map(r=>r.id===g.rm?{...r,status:"cleaning",guest:null}:r));notify("✓ Checked out via "+pay);};
  const addSvc=(gid,svc)=>{setGuests(p=>p.map(g=>g.id===gid?{...g,svcs:[...g.svcs,{...svc,q:1}]}:g));notify(svc.e+" "+svc.n+" added");};
  const markReady=rid=>{setRooms(p=>p.map(r=>r.id===rid?{...r,status:"available",guest:null}:r));notify("Room "+rid+" ready!");};
  return React.createElement(Ctx.Provider,{value:{sc,setSc,user,rooms,guests,orders,toast,gstCfg,setGstCfg,login,logout,checkIn,checkOut,addSvc,markReady,notify,SV}},children);
}

function useStats(ords,period,opId){
  return useMemo(()=>{
    const now=new Date();
    const f=ords.filter(o=>{const diff=Math.floor((now-new Date(o.dt))/864e5);const ok=period==="day"?diff<1:period==="week"?diff<7:period==="month"?diff<30:diff<365;return ok&&(opId?o.op===opId:true);});
    const rev=f.reduce((s,o)=>s+o.tot,0);
    const pb=["Cash","UPI","Card","Credit"].map(m=>({m,n:f.filter(o=>o.pay===m).length,t:f.filter(o=>o.pay===m).reduce((s,o)=>s+o.tot,0)}));
    const ch=Array.from({length:7},(_,i)=>{const d=new Date();d.setDate(d.getDate()-(6-i));const dO=ords.filter(o=>new Date(o.dt).toDateString()===d.toDateString()&&(opId?o.op===opId:true));return{d:d.toLocaleDateString("en-IN",{weekday:"short"}),v:dO.reduce((s,o)=>s+o.tot,0),n:dO.length};});
    return{f,rev,cnt:f.length,pb,ch,avg:f.length?rev/f.length:0};
  },[ords,period,opId]);
}

const g={background:"linear-gradient(135deg,#c9a84c,#e8c97a)",color:"#12100a"};
const Btn=({label,onClick,style={},disabled,full})=><button onClick={onClick} disabled={disabled} style={{display:"inline-flex",alignItems:"center",justifyContent:"center",gap:6,padding:"10px 18px",borderRadius:12,fontSize:13,fontWeight:700,transition:"all .15s",opacity:disabled?.4:1,width:full?"100%":"auto",cursor:"pointer",border:"none",...style}}>{label}</button>;
const Inp=({label,value,onChange,type="text",placeholder,icon})=>(
  <div style={{display:"flex",flexDirection:"column",gap:5}}>
    {label&&<label style={{fontSize:11,fontWeight:700,color:"rgba(251,191,36,0.5)",textTransform:"uppercase",letterSpacing:1}}>{label}</label>}
    <div style={{position:"relative"}}>
      {icon&&<span style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",fontSize:14,pointerEvents:"none"}}>{icon}</span>}
      <input type={type} value={value} onChange={onChange} placeholder={placeholder} style={{width:"100%",background:"rgba(255,255,255,0.05)",border:"1px solid rgba(201,168,76,0.2)",borderRadius:10,color:"white",padding:"10px 14px",paddingLeft:icon?34:14,fontSize:13,outline:"none",boxSizing:"border-box"}}/>
    </div>
  </div>
);
const PwdInp=({label,value,onChange,onKeyDown})=>{
  const[show,setShow]=useState(false);
  return <div style={{display:"flex",flexDirection:"column",gap:5}}>
    {label&&<label style={{fontSize:11,fontWeight:700,color:"rgba(251,191,36,0.5)",textTransform:"uppercase",letterSpacing:1}}>{label}</label>}
    <div style={{position:"relative"}}>
      <span style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)"}}>🔒</span>
      <input type={show?"text":"password"} value={value} onChange={onChange} onKeyDown={onKeyDown} placeholder="Enter password" style={{width:"100%",background:"rgba(255,255,255,0.05)",border:"1px solid rgba(201,168,76,0.2)",borderRadius:10,color:"white",padding:"10px 48px 10px 34px",fontSize:13,outline:"none",letterSpacing:show?"normal":value?"3px":"normal",boxSizing:"border-box"}}/>
      <button type="button" onClick={()=>setShow(s=>!s)} style={{position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",fontSize:11,fontWeight:700,color:"rgba(201,168,76,0.6)",padding:2,background:"none",border:"none",cursor:"pointer"}}>{show?"HIDE":"SHOW"}</button>
    </div>
  </div>;
};
const Sel=({label,value,onChange,options})=>(
  <div style={{display:"flex",flexDirection:"column",gap:5}}>
    {label&&<label style={{fontSize:11,fontWeight:700,color:"rgba(251,191,36,0.5)",textTransform:"uppercase",letterSpacing:1}}>{label}</label>}
    <select value={value} onChange={onChange} style={{background:"#1a1510",border:"1px solid rgba(201,168,76,0.2)",borderRadius:10,color:"white",padding:"10px 14px",fontSize:13,outline:"none"}}>
      {options.map(o=><option key={o.v||o} value={o.v||o}>{o.l||o}</option>)}
    </select>
  </div>
);
const Toggle=({on,toggle,label,sub})=>(
  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:12,cursor:"pointer",userSelect:"none"}} onClick={toggle}>
    <div><p style={{margin:0,fontSize:13,fontWeight:600,color:"#fef3c7"}}>{label}</p>{sub&&<p style={{margin:0,fontSize:11,color:"rgba(120,113,108,0.8)",marginTop:2}}>{sub}</p>}</div>
    <div style={{width:44,height:24,borderRadius:12,background:on?"linear-gradient(135deg,#c9a84c,#e8c97a)":"rgba(255,255,255,0.1)",display:"flex",alignItems:"center",padding:"0 2px",flexShrink:0,transition:"background .2s"}}>
      <div style={{width:20,height:20,borderRadius:10,background:"white",transform:on?"translateX(20px)":"translateX(0)",transition:"transform .2s"}}/>
    </div>
  </div>
);
const Card=({children,style={}})=><div style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:16,...style}}>{children}</div>;
const GCard=({children,style={}})=><div style={{background:"linear-gradient(135deg,rgba(180,83,9,0.15),rgba(30,27,24,0.5))",border:"1px solid rgba(201,168,76,0.25)",borderRadius:16,...style}}>{children}</div>;
const Bdg=({s})=>{const m={available:{bg:"rgba(16,185,129,0.1)",c:"#6ee7b7",b:"rgba(16,185,129,0.2)"},"in":{bg:"rgba(59,130,246,0.1)",c:"#93c5fd",b:"rgba(59,130,246,0.2)"},"out":{bg:"rgba(100,116,139,0.1)",c:"#94a3b8",b:"rgba(100,116,139,0.2)"},occupied:{bg:"rgba(239,68,68,0.1)",c:"#fca5a5",b:"rgba(239,68,68,0.2)"},reserved:{bg:"rgba(245,158,11,0.1)",c:"#fcd34d",b:"rgba(245,158,11,0.2)"},cleaning:{bg:"rgba(139,92,246,0.1)",c:"#c4b5fd",b:"rgba(139,92,246,0.2)"}};const l={available:"Available","in":"Checked In","out":"Checked Out",occupied:"Occupied",reserved:"Reserved",cleaning:"Cleaning"};const st=m[s]||m.available;return <span style={{display:"inline-flex",alignItems:"center",gap:4,padding:"2px 8px",borderRadius:99,fontSize:11,fontWeight:700,background:st.bg,color:st.c,border:"1px solid "+st.b}}><span style={{width:6,height:6,borderRadius:3,background:st.c,display:"inline-block"}}/>{l[s]||s}</span>;};
function Modal({open,close,title,children,wide}){if(!open)return null;return <div style={{position:"fixed",inset:0,zIndex:50,display:"flex",alignItems:"flex-end",justifyContent:"center"}}><div style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.85)",backdropFilter:"blur(8px)"}} onClick={close}/><div style={{position:"relative",background:"#110e08",border:"1px solid rgba(201,168,76,0.2)",borderRadius:"24px 24px 0 0",width:"100%",maxWidth:wide?680:480,maxHeight:"90vh",display:"flex",flexDirection:"column"}}><div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"16px 24px",borderBottom:"1px solid rgba(201,168,76,0.1)"}}><h3 style={{margin:0,fontWeight:700,color:"#fef3c7",fontSize:16}}>{title}</h3><button onClick={close} style={{width:32,height:32,borderRadius:10,background:"rgba(255,255,255,0.08)",color:"#94a3b8",fontSize:14,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",border:"none"}}>✕</button></div><div style={{overflowY:"auto",padding:24,flex:1}}>{children}</div></div></div>;}
function Toast(){const{toast}=useA();if(!toast)return null;return <div key={toast.k} style={{position:"fixed",top:16,left:"50%",transform:"translateX(-50%)",zIndex:999,padding:"10px 20px",borderRadius:12,border:"1px solid",fontSize:14,fontWeight:600,whiteSpace:"nowrap",background:toast.t==="err"?"rgba(127,29,29,0.95)":"rgba(6,78,59,0.95)",borderColor:toast.t==="err"?"rgba(239,68,68,0.4)":"rgba(52,211,153,0.4)",color:toast.t==="err"?"#fca5a5":"#6ee7b7"}}>{toast.t==="err"?"✕ ":"✓ "}{toast.msg}</div>;}

function TrialBanner(){
  const dl=TrialEngine.getDaysLeft();
  const urgent=dl<=3,warning=dl<=7;
  return <div style={{padding:"8px 16px",background:urgent?"rgba(239,68,68,0.1)":warning?"rgba(245,158,11,0.08)":"rgba(16,185,129,0.06)",borderBottom:"1px solid "+(urgent?"rgba(239,68,68,0.2)":warning?"rgba(245,158,11,0.15)":"rgba(16,185,129,0.12)"),display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:8}}>
    <div style={{display:"flex",alignItems:"center",gap:8}}>
      <span style={{fontSize:16}}>{urgent?"🚨":warning?"⚠️":"✅"}</span>
      <span style={{fontSize:12,fontWeight:700,color:urgent?"#fca5a5":warning?"#fcd34d":"#6ee7b7"}}>{urgent?"TRIAL EXPIRES IN "+dl+" DAY"+(dl!==1?"S":"")+"!":warning?"Trial: "+dl+" days remaining":"Free Trial Active — "+dl+" days left"}</span>
      <span style={{fontSize:11,color:"rgba(120,113,108,0.7)"}}>Expires: {TrialEngine.getExpiryDate()}</span>
    </div>
  </div>;
}

function ExpiredScreen(){
  return <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:24,background:"#0d0a05",textAlign:"center"}}>
    <div style={{fontSize:72,marginBottom:16}}>🔒</div>
    <h1 style={{fontFamily:"Georgia,serif",fontSize:32,fontWeight:700,color:"#fca5a5",margin:"0 0 8px"}}>Trial Expired</h1>
    <p style={{color:"rgba(120,113,108,0.8)",fontSize:15,margin:"0 0 32px"}}>Your 15-day free trial has ended. Contact us to activate your full license.</p>
    <div style={{background:"rgba(239,68,68,0.06)",border:"1px solid rgba(239,68,68,0.2)",borderRadius:16,padding:20,maxWidth:320,width:"100%"}}>
      <p style={{margin:"0 0 12px",fontWeight:700,color:"#fef3c7",fontSize:14}}>Contact for License</p>
      <a href="tel:+919876543210" style={{display:"flex",alignItems:"center",gap:8,padding:"10px 14px",background:"rgba(255,255,255,0.04)",borderRadius:10,textDecoration:"none",color:"#fcd34d",fontSize:13,fontWeight:600,marginBottom:8}}>📞 +91 98765 43210</a>
      <a href="https://wa.me/919876543210" style={{display:"flex",alignItems:"center",gap:8,padding:"10px 14px",background:"rgba(37,211,102,0.1)",border:"1px solid rgba(37,211,102,0.2)",borderRadius:10,textDecoration:"none",color:"#6ee7b7",fontSize:13,fontWeight:600}}>💬 WhatsApp Us</a>
    </div>
  </div>;
}

function RmGrid(){
  const{rooms}=useA();
  const stC={available:"rgba(16,185,129,0.1)",occupied:"rgba(239,68,68,0.1)",reserved:"rgba(245,158,11,0.1)",cleaning:"rgba(139,92,246,0.1)"};
  const stB={available:"rgba(16,185,129,0.2)",occupied:"rgba(239,68,68,0.2)",reserved:"rgba(245,158,11,0.2)",cleaning:"rgba(139,92,246,0.2)"};
  const stT={available:"#6ee7b7",occupied:"#fca5a5",reserved:"#fcd34d",cleaning:"#c4b5fd"};
  const cnt={available:rooms.filter(r=>r.status==="available").length,occupied:rooms.filter(r=>r.status==="occupied").length,reserved:rooms.filter(r=>r.status==="reserved").length,cleaning:rooms.filter(r=>r.status==="cleaning").length};
  return <Card style={{padding:16}}>
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
      <span style={{fontWeight:700,color:"#fbbf24",fontSize:14}}>Room Availability</span>
      <span style={{display:"flex",alignItems:"center",gap:6,fontSize:11,color:"#6ee7b7",background:"rgba(16,185,129,0.1)",border:"1px solid rgba(16,185,129,0.2)",borderRadius:99,padding:"3px 10px"}}><span style={{width:6,height:6,borderRadius:3,background:"#6ee7b7",display:"inline-block"}}/>Live</span>
    </div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,marginBottom:12}}>
      {Object.entries(cnt).map(([s,v])=><div key={s} style={{background:stC[s],border:"1px solid "+stB[s],borderRadius:10,padding:"8px 4px",textAlign:"center"}}><div style={{fontSize:20,fontWeight:900,color:stT[s],fontFamily:"monospace"}}>{v}</div><div style={{fontSize:10,color:"rgba(120,113,108,0.8)",textTransform:"capitalize",marginTop:2}}>{s}</div></div>)}
    </div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(9,1fr)",gap:4}}>
      {rooms.map(r=><div key={r.id} style={{background:stC[r.status],border:"1px solid "+stB[r.status],borderRadius:6,padding:"4px 2px",textAlign:"center"}}><div style={{fontSize:10,fontWeight:900,color:stT[r.status]}}>{r.id}</div><div style={{fontSize:8,color:"rgba(120,113,108,0.8)"}}>{r.type.slice(0,3)}</div></div>)}
    </div>
  </Card>;
}

function StatsView({st,per,setPer,opMode}){
  const mv=Math.max(...st.ch.map(c=>c.v),1);
  return <div style={{display:"flex",flexDirection:"column",gap:16}}>
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:8}}>
      <span style={{fontWeight:700,color:"#fbbf24",fontSize:15}}>{opMode?"Today's Statistics":"Revenue Analytics"}</span>
      {!opMode&&<div style={{display:"flex",gap:4}}>{[["day","Today"],["week","7 Days"],["month","30 Days"],["year","1 Year"]].map(([p,l])=><button key={p} onClick={()=>setPer(p)} style={{padding:"6px 12px",borderRadius:10,fontSize:11,fontWeight:700,background:per===p?"rgba(245,158,11,0.2)":"rgba(255,255,255,0.05)",color:per===p?"#fcd34d":"rgba(120,113,108,0.8)",border:"1px solid "+(per===p?"rgba(245,158,11,0.3)":"rgba(255,255,255,0.08)"),cursor:"pointer"}}>{l}</button>)}</div>}
    </div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:10}}>
      {[{l:"Revenue",v:inr(st.rev),i:"💰",c:"amber"},{l:"Transactions",v:st.cnt,i:"🧾",c:"blue"},{l:"Avg Bill",v:inr(st.avg),i:"📊",c:"violet"},{l:"GST Rev",v:inr(st.f.filter(o=>o.gstOn).reduce((s,o)=>s+o.tot,0)*0.1),i:"🏛️",c:"green"}].map((s,i)=>(
        <div key={i} style={{borderRadius:14,border:"1px solid",padding:14,borderColor:s.c==="amber"?"rgba(245,158,11,0.2)":s.c==="blue"?"rgba(59,130,246,0.2)":s.c==="violet"?"rgba(139,92,246,0.2)":"rgba(16,185,129,0.2)",background:s.c==="amber"?"rgba(245,158,11,0.06)":s.c==="blue"?"rgba(59,130,246,0.06)":s.c==="violet"?"rgba(139,92,246,0.06)":"rgba(16,185,129,0.06)"}}>
          <div style={{fontSize:20,marginBottom:6}}>{s.i}</div><div style={{fontSize:18,fontWeight:700,color:"white"}}>{s.v}</div><div style={{fontSize:11,color:"rgba(120,113,108,0.8)",marginTop:2}}>{s.l}</div>
        </div>
      ))}
    </div>
    <Card style={{padding:14}}>
      <p style={{margin:"0 0 12px",fontSize:11,fontWeight:700,color:"rgba(251,191,36,0.5)",textTransform:"uppercase",letterSpacing:1}}>Daily Revenue — Last 7 Days</p>
      <div style={{display:"flex",alignItems:"flex-end",gap:8,height:90}}>
        {st.ch.map((d,i)=><div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
          {d.v>0&&<div style={{fontSize:8,color:"rgba(120,113,108,0.8)",fontFamily:"monospace"}}>{inr(d.v).replace("₹","").slice(0,5)}</div>}
          <div style={{width:"100%",background:"linear-gradient(to top,rgba(180,83,9,0.6),rgba(245,158,11,0.3))",borderRadius:"3px 3px 0 0",height:(d.v/mv)*100+"%",minHeight:d.v>0?4:2}}/>
          <span style={{fontSize:10,color:"rgba(120,113,108,0.8)"}}>{d.d}</span>
        </div>)}
      </div>
    </Card>
    <Card style={{padding:14}}>
      <p style={{margin:"0 0 12px",fontSize:11,fontWeight:700,color:"rgba(251,191,36,0.5)",textTransform:"uppercase",letterSpacing:1}}>Payment Breakdown</p>
      {st.pb.map(p=>{const pct=st.rev>0?(p.t/st.rev)*100:0;return <div key={p.m} style={{marginBottom:10}}><div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:4}}><span style={{color:"rgba(180,160,120,0.8)"}}>{p.m==="Cash"?"💵":p.m==="UPI"?"📱":p.m==="Card"?"💳":"🏦"} {p.m} ({p.n})</span><span style={{fontFamily:"monospace",fontWeight:700,color:"white"}}>{inr(p.t)}</span></div><div style={{height:6,background:"rgba(255,255,255,0.05)",borderRadius:3}}><div style={{height:6,background:"linear-gradient(to right,#b45309,#f59e0b)",borderRadius:3,width:pct+"%",transition:"width .5s"}}/></div></div>;})}
    </Card>
  </div>;
}

function BillView({guest,room,onPay}){
  const{gstCfg}=useA();
  const[disc,setDisc]=useState(0);const[mode,setMode]=useState("Cash");const[gstOn,setGstOn]=useState(guest?.gstOn!==undefined?guest.gstOn:gstCfg.on);
  const rc=(room?.rate||0)*(guest?.ni||1);
  const bill=calcBill(guest?.svcs||[],disc,rc,gstOn,gstCfg.c/100);
  const bal=Math.max(0,bill.total-(guest?.adv||0));
  return <div style={{display:"flex",flexDirection:"column",gap:14}}>
    <div style={{background:"rgba(255,255,255,0.03)",borderRadius:12,padding:14,fontFamily:"monospace",fontSize:13}}>
      <div style={{display:"flex",justifyContent:"space-between",color:"rgba(180,160,120,0.7)",marginBottom:6}}><span>Room {guest?.rm} ({guest?.ni}N×{inr(room?.rate||0)})</span><span>{inr(rc)}</span></div>
      {(guest?.svcs||[]).map((s,i)=><div key={i} style={{display:"flex",justifyContent:"space-between",color:"rgba(180,160,120,0.7)",marginBottom:4}}><span>{s.e} {s.n}</span><span>{inr(s.p)}</span></div>)}
      {disc>0&&<div style={{display:"flex",justifyContent:"space-between",color:"#6ee7b7",marginBottom:4}}><span>Discount ({disc}%)</span><span>−{inr(bill.da)}</span></div>}
      <div style={{borderTop:"1px solid rgba(255,255,255,0.1)",paddingTop:8,marginTop:4}}>
        {gstOn?<><div style={{display:"flex",justifyContent:"space-between",color:"rgba(120,113,108,0.7)",fontSize:11,marginBottom:3}}><span>CGST {gstCfg.c}%</span><span>{inr(bill.tax)}</span></div><div style={{display:"flex",justifyContent:"space-between",color:"rgba(120,113,108,0.7)",fontSize:11,marginBottom:6}}><span>SGST {gstCfg.s}%</span><span>{inr(bill.tax)}</span></div></>:<div style={{color:"rgba(120,113,108,0.6)",fontSize:11,fontStyle:"italic",marginBottom:6}}>No GST applied</div>}
      </div>
      <div style={{display:"flex",justifyContent:"space-between",color:"white",fontWeight:900,fontSize:15,borderTop:"1px solid rgba(255,255,255,0.1)",paddingTop:8,marginBottom:4}}><span>TOTAL</span><span style={{color:"#fcd34d"}}>{inr(bill.total)}</span></div>
      {guest?.adv>0&&<div style={{display:"flex",justifyContent:"space-between",color:"#6ee7b7",marginBottom:4}}><span>Advance</span><span>−{inr(guest.adv)}</span></div>}
      <div style={{display:"flex",justifyContent:"space-between",color:"#fef3c7",fontWeight:900,fontSize:17,borderTop:"1px solid rgba(255,255,255,0.1)",paddingTop:8}}><span>BALANCE DUE</span><span>{inr(bal)}</span></div>
    </div>
    <div style={{background:"rgba(245,158,11,0.07)",border:"1px solid rgba(245,158,11,0.2)",borderRadius:12,padding:12}}>
      <Toggle on={gstOn} toggle={()=>setGstOn(x=>!x)} label={"GST: "+(gstOn?"Applied ✓":"Not Applied")} sub={gstOn?"CGST "+gstCfg.c+"% + SGST "+gstCfg.s+"%":"Bill without GST"}/>
    </div>
    <Inp label="Discount %" type="number" value={disc} onChange={e=>setDisc(Math.min(100,Math.max(0,+e.target.value)))} icon="🏷️"/>
    <div><p style={{margin:"0 0 8px",fontSize:11,fontWeight:700,color:"rgba(251,191,36,0.5)",textTransform:"uppercase",letterSpacing:1}}>Payment Mode</p>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8}}>
        {["Cash","UPI","Card","Credit"].map(m=><button key={m} onClick={()=>setMode(m)} style={{padding:"10px 4px",borderRadius:10,fontSize:12,fontWeight:700,border:"1px solid",borderColor:mode===m?"transparent":"rgba(255,255,255,0.1)",background:mode===m?"linear-gradient(135deg,#c9a84c,#e8c97a)":"rgba(255,255,255,0.05)",color:mode===m?"#12100a":"rgba(180,160,120,0.7)",cursor:"pointer"}}>{m==="Cash"?"💵":m==="UPI"?"📱":m==="Card"?"💳":"🏦"}<br/>{m}</button>)}
      </div>
    </div>
    <Btn label={"Collect "+inr(bal)+" via "+mode} onClick={()=>onPay(bill,mode)} style={{...g,borderRadius:12,padding:"14px 20px",fontSize:15,fontWeight:900,width:"100%"}}/>
  </div>;
}

function CIForm({room,onOk,onCx}){
  const{gstCfg,notify}=useA();
  const td=new Date().toISOString().split("T")[0];
  const[f,setF]=useState({nm:"",ph:"",it:"Aadhaar",in_:"",ci:td,co:new Date(Date.now()+864e5).toISOString().split("T")[0],px:1,pur:"Travel",adv:0,gt:gstCfg.on});
  const s=k=>e=>setF(p=>({...p,[k]:e.target.value}));
  const ni=Math.max(1,Math.round((new Date(f.co)-new Date(f.ci))/864e5));
  return <div style={{display:"flex",flexDirection:"column",gap:12}}>
    <div style={{background:"rgba(245,158,11,0.07)",border:"1px solid rgba(245,158,11,0.2)",borderRadius:10,padding:10,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
      <span style={{fontWeight:700,color:"#fef3c7"}}>Room {room?.id} — {room?.type}</span>
      <span style={{fontWeight:700,color:"#fcd34d",fontSize:17}}>{inr(room?.rate)}<span style={{fontSize:11,color:"rgba(120,113,108,0.8)",fontWeight:400}}>/night</span></span>
    </div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
      <Inp label="Full Name *" value={f.nm} onChange={s("nm")} placeholder="As per ID" icon="👤"/>
      <Inp label="Mobile *" value={f.ph} onChange={s("ph")} placeholder="10-digit" icon="📞" type="tel"/>
      <Sel label="ID Type *" value={f.it} onChange={s("it")} options={["Aadhaar","Passport","Driving Licence","Voter ID"]}/>
      <Inp label="ID Number *" value={f.in_} onChange={s("in_")} placeholder="Number" icon="🪪"/>
      <Inp label="Check-in *" value={f.ci} onChange={s("ci")} type="date" icon="📅"/>
      <Inp label="Check-out *" value={f.co} onChange={s("co")} type="date" icon="📅"/>
      <Inp label="Advance (₹)" value={f.adv} onChange={s("adv")} type="number" icon="💰" placeholder="0"/>
      <Inp label="No. of Guests" value={f.px} onChange={s("px")} type="number" icon="👥"/>
    </div>
    <div style={{background:"rgba(245,158,11,0.07)",border:"1px solid rgba(245,158,11,0.2)",borderRadius:10,padding:10}}>
      <Toggle on={f.gt} toggle={()=>setF(p=>({...p,gt:!p.gt}))} label={"GST: "+(f.gt?"Applied":"Not Applied")} sub={f.gt?"CGST "+gstCfg.c+"% + SGST "+gstCfg.s+"%":"No GST"}/>
    </div>
    {f.ci&&f.co&&room&&<div style={{background:"rgba(255,255,255,0.03)",borderRadius:10,padding:10,display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,textAlign:"center",fontFamily:"monospace",fontSize:13}}>
      <div><div style={{fontWeight:900,color:"#fcd34d"}}>{ni}</div><div style={{fontSize:10,color:"rgba(120,113,108,0.7)"}}>Nights</div></div>
      <div><div style={{fontWeight:900,color:"#fcd34d"}}>{inr(room.rate*ni)}</div><div style={{fontSize:10,color:"rgba(120,113,108,0.7)"}}>Room Total</div></div>
      <div><div style={{fontWeight:900,color:"#fcd34d"}}>{inr(Math.max(0,room.rate*ni-(+f.adv||0)))}</div><div style={{fontSize:10,color:"rgba(120,113,108,0.7)"}}>Balance</div></div>
    </div>}
    <div style={{display:"flex",gap:10}}>
      <Btn label="Cancel" onClick={onCx} style={{background:"rgba(255,255,255,0.08)",color:"white",border:"1px solid rgba(255,255,255,0.12)",borderRadius:10,flex:1}}/>
      <Btn label="✅ Confirm Check In" onClick={()=>{if(!f.nm||!f.ph||!f.in_)return notify("Fill required fields","err");onOk({...f,name:f.nm,phone:f.ph,idType:f.it,idNo:f.in_,rm:room?.id,ni,adv:+f.adv||0,gstOn:f.gt});}} style={{...g,borderRadius:10,flex:1}}/>
    </div>
  </div>;
}

function Login(){
  const{login}=useA();
  const[tab,setTab]=useState("ch");
  const[em,setEm]=useState("");const[pw,setPw]=useState("");
  if(TrialEngine.isExpired())return <ExpiredScreen/>;
  const dl=TrialEngine.getDaysLeft();
  if(tab==="ch")return(
    <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:24,position:"relative",overflow:"hidden",background:"#0d0a05"}}>
      <div style={{position:"absolute",top:0,left:"50%",transform:"translateX(-50%)",width:600,height:300,borderRadius:"50%",filter:"blur(80px)",opacity:0.2,background:"radial-gradient(ellipse,#c9a84c,transparent)",pointerEvents:"none"}}/>
      <div style={{position:"relative",width:"100%",maxWidth:420,textAlign:"center"}}>
        <div style={{marginBottom:28}}>
          <div style={{display:"inline-flex",alignItems:"center",justifyContent:"center",width:80,height:80,borderRadius:20,marginBottom:16,...g,boxShadow:"0 0 60px rgba(201,168,76,0.4)"}}><span style={{fontSize:36}}>🏨</span></div>
          <h1 style={{fontFamily:"Georgia,serif",fontSize:40,fontWeight:700,color:"#fef3c7",margin:"0 0 4px"}}>Grand Lodge</h1>
          <p style={{color:"rgba(120,113,108,0.7)",fontSize:12,letterSpacing:2,textTransform:"uppercase",margin:0}}>Hotel Management System</p>
        </div>
        <div style={{background:dl<=3?"rgba(239,68,68,0.08)":dl<=7?"rgba(245,158,11,0.06)":"rgba(16,185,129,0.06)",border:"1px solid "+(dl<=3?"rgba(239,68,68,0.2)":dl<=7?"rgba(245,158,11,0.15)":"rgba(16,185,129,0.15)"),borderRadius:12,padding:"10px 16px",marginBottom:20,display:"flex",alignItems:"center",gap:10}}>
          <span style={{fontSize:20}}>{dl<=3?"🚨":dl<=7?"⚠️":"✅"}</span>
          <div style={{textAlign:"left"}}>
            <p style={{margin:0,fontSize:13,fontWeight:700,color:dl<=3?"#fca5a5":dl<=7?"#fcd34d":"#6ee7b7"}}>Free Trial — {dl} days remaining</p>
            <p style={{margin:0,fontSize:11,color:"rgba(120,113,108,0.6)"}}>Expires: {TrialEngine.getExpiryDate()}</p>
          </div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:20}}>
          {[{k:"ad",i:"🔐",lb:"Admin",h:"Full access + analytics",cl:"rgba(180,83,9,0.15)"},{k:"op",i:"🖥️",lb:"Operator",h:"Billing + day stats",cl:"rgba(30,58,138,0.2)"}].map(d=>(
            <button key={d.k} onClick={()=>setTab(d.k)} style={{background:d.cl,border:"1px solid rgba(201,168,76,0.25)",borderRadius:14,padding:18,textAlign:"left",cursor:"pointer"}}>
              <div style={{fontSize:28,marginBottom:8}}>{d.i}</div>
              <h3 style={{margin:"0 0 4px",fontFamily:"Georgia,serif",fontWeight:700,color:"#fef3c7",fontSize:14}}>{d.lb}</h3>
              <p style={{margin:0,fontSize:11,color:"rgba(120,113,108,0.7)"}}>{d.h}</p>
            </button>
          ))}
        </div>
        <p style={{color:"rgba(87,83,78,0.6)",fontSize:11}}>⚡ Grand Lodge HMS · Trial Edition</p>
      </div>
    </div>
  );
  const isA=tab==="ad";
  return(
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",padding:24,background:"#0d0a05"}}>
      <div style={{width:"100%",maxWidth:360}}>
        <button onClick={()=>{setTab("ch");setEm("");setPw("");}} style={{display:"flex",alignItems:"center",gap:6,color:"rgba(180,83,9,0.8)",fontSize:13,marginBottom:20,cursor:"pointer",background:"none",border:"none"}}>← Back</button>
        <div style={{textAlign:"center",marginBottom:20}}>
          <div style={{fontSize:36,marginBottom:8}}>{isA?"🔐":"🖥️"}</div>
          <h2 style={{fontFamily:"Georgia,serif",fontSize:28,fontWeight:700,color:"#fef3c7",margin:"0 0 4px"}}>{isA?"Admin Login":"Operator Login"}</h2>
          <span style={{display:"inline-block",marginTop:6,padding:"3px 12px",borderRadius:99,fontSize:11,fontWeight:700,background:isA?"rgba(245,158,11,0.1)":"rgba(59,130,246,0.1)",color:isA?"#fcd34d":"#93c5fd",border:"1px solid "+(isA?"rgba(245,158,11,0.25)":"rgba(59,130,246,0.25)")}}>{isA?"ADMINISTRATOR":"OPERATOR"}</span>
        </div>
        <Card style={{padding:20}}>
          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            <Inp label="Email" type="email" value={em} onChange={e=>setEm(e.target.value)} placeholder="Enter email" icon="✉️"/>
            <PwdInp label="Password" value={pw} onChange={e=>setPw(e.target.value)} onKeyDown={e=>e.key==="Enter"&&login(em,pw)}/>
            <Btn label="Sign In →" onClick={()=>login(em,pw)} style={{...g,borderRadius:10,padding:"12px 20px",fontSize:14,fontWeight:900,width:"100%"}}/>
            <div style={{background:"rgba(245,158,11,0.04)",border:"1px solid rgba(245,158,11,0.12)",borderRadius:10,padding:12,fontSize:12}}>
              <p style={{margin:"0 0 6px",color:"rgba(245,158,11,0.5)",fontWeight:700}}>Credentials</p>
              {isA?<><p style={{margin:"0 0 2px",color:"rgba(120,113,108,0.7)",fontFamily:"monospace"}}>admin@grandlodge.com</p><p style={{margin:0,color:"rgba(120,113,108,0.7)",fontFamily:"monospace"}}>admin123</p></>:<p style={{margin:0,color:"rgba(120,113,108,0.7)",fontFamily:"monospace"}}>operator@grandlodge.com / op123</p>}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

function Admin(){
  const{user,logout,rooms,guests,orders,checkOut,addSvc,markReady,SV,checkIn,notify,gstCfg,setGstCfg}=useA();
  const[pg,setPg]=useState("db");const[per,setPer]=useState("week");
  const st=useStats(orders,per,null);const tSt=useStats(orders,"day",null);
  const[sR,setSR]=useState(null);const[sG,setSG]=useState(null);
  const[mCI,setMCI]=useState(false);const[mP,setMP]=useState(false);const[mS,setMS]=useState(false);
  const[fSt,setFSt]=useState("All");const[gs,setGs]=useState("");
  const act=guests.filter(gg=>gg.st==="in");
  const sRL=sR?rooms.find(r=>r.id===sR.id)||sR:null;
  const sGL=sG?guests.find(gg=>gg.id===sG.id)||sG:null;
  const NAV=[{id:"db",i:"📊",l:"Dashboard"},{id:"rm",i:"🛏️",l:"Rooms"},{id:"gu",i:"👥",l:"Guests"},{id:"bi",i:"💰",l:"Billing"},{id:"an",i:"📈",l:"Analytics"},{id:"se",i:"⚙️",l:"Settings"}];
  const stC={available:"rgba(16,185,129,0.1)",occupied:"rgba(239,68,68,0.1)",reserved:"rgba(245,158,11,0.1)",cleaning:"rgba(139,92,246,0.1)"};
  const stB={available:"rgba(16,185,129,0.2)",occupied:"rgba(239,68,68,0.2)",reserved:"rgba(245,158,11,0.2)",cleaning:"rgba(139,92,246,0.2)"};
  const stT={available:"#6ee7b7",occupied:"#fca5a5",reserved:"#fcd34d",cleaning:"#c4b5fd"};
  const fR=fSt==="All"?rooms:rooms.filter(r=>r.status===fSt);
  const fG=guests.filter(gg=>!gs||gg.name.toLowerCase().includes(gs.toLowerCase())||String(gg.rm).includes(gs));
  return <div style={{display:"flex",height:"100vh",overflow:"hidden",background:"#0d0a05"}}>
    <div style={{width:220,flexShrink:0,display:"flex",flexDirection:"column",borderRight:"1px solid rgba(201,168,76,0.12)",background:"rgba(13,10,5,0.98)"}}>
      <div style={{padding:20,borderBottom:"1px solid rgba(201,168,76,0.1)"}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:40,height:40,borderRadius:10,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,color:"#12100a",fontSize:13,...g}}>{user?.av}</div>
          <div><div style={{fontFamily:"Georgia,serif",fontWeight:700,color:"#fcd34d",fontSize:13}}>{user?.name}</div><div style={{fontSize:10,color:"rgba(245,158,11,0.5)",fontWeight:700,textTransform:"uppercase",letterSpacing:1}}>Admin</div></div>
        </div>
      </div>
      <nav style={{flex:1,padding:12,display:"flex",flexDirection:"column",gap:2,overflowY:"auto"}}>
        {NAV.map(n=><button key={n.id} onClick={()=>setPg(n.id)} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",borderRadius:10,fontSize:13,fontWeight:600,background:pg===n.id?"rgba(245,158,11,0.12)":"transparent",color:pg===n.id?"#fcd34d":"rgba(120,113,108,0.8)",border:pg===n.id?"1px solid rgba(245,158,11,0.2)":"1px solid transparent",cursor:"pointer",textAlign:"left"}}>
          <span style={{width:20}}>{n.i}</span><span>{n.l}</span>
          {n.id==="gu"&&act.length>0&&<span style={{marginLeft:"auto",background:"#b45309",color:"#12100a",fontSize:10,fontWeight:900,borderRadius:99,width:20,height:20,display:"flex",alignItems:"center",justifyContent:"center"}}>{act.length}</span>}
        </button>)}
      </nav>
      <div style={{padding:12,borderTop:"1px solid rgba(201,168,76,0.1)"}}>
        <div style={{background:"rgba(245,158,11,0.06)",border:"1px solid rgba(245,158,11,0.12)",borderRadius:8,padding:"8px 10px",marginBottom:10}}>
          <p style={{margin:0,fontSize:10,color:"rgba(245,158,11,0.6)",fontWeight:700}}>TRIAL LICENSE</p>
          <p style={{margin:"2px 0 0",fontSize:11,color:"#fcd34d",fontWeight:700}}>{TrialEngine.getDaysLeft()} days remaining</p>
        </div>
        <Btn label="🚪 Sign Out" onClick={logout} style={{background:"rgba(255,255,255,0.08)",color:"white",border:"1px solid rgba(255,255,255,0.12)",borderRadius:10,width:"100%",fontSize:12}}/>
      </div>
    </div>
    <main style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
      <TrialBanner/>
      <div style={{height:50,borderBottom:"1px solid rgba(201,168,76,0.1)",display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 20px",background:"rgba(13,10,5,0.96)",flexShrink:0}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <h1 style={{margin:0,fontFamily:"Georgia,serif",fontWeight:700,color:"#fef3c7",fontSize:15}}>{NAV.find(n=>n.id===pg)?.l}</h1>
          <span style={{fontSize:11,background:"rgba(245,158,11,0.1)",color:"#fcd34d",border:"1px solid rgba(245,158,11,0.2)",padding:"2px 8px",borderRadius:99,fontWeight:700}}>ADMIN</span>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:6,fontSize:12,color:"#6ee7b7",background:"rgba(16,185,129,0.08)",border:"1px solid rgba(16,185,129,0.2)",borderRadius:99,padding:"3px 10px"}}><span style={{width:6,height:6,borderRadius:3,background:"#6ee7b7",display:"inline-block"}}/>Live</div>
      </div>
      <div style={{flex:1,overflow:"hidden",padding:16}} key={pg}>
        <div style={{height:"100%",overflowY:"auto",display:"flex",flexDirection:"column",gap:14,paddingBottom:16}}>
          {pg==="db"&&<>
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10}}>
              {[{l:"Occupied",v:rooms.filter(r=>r.status==="occupied").length+"/"+rooms.length,i:"🛏️",c:"rose"},{l:"Available",v:rooms.filter(r=>r.status==="available").length,i:"🟢",c:"green"},{l:"Active Guests",v:act.length,i:"👥",c:"blue"},{l:"Today Revenue",v:inr(tSt.rev),i:"💰",c:"amber"}].map((s,i)=>(
                <div key={i} style={{borderRadius:14,border:"1px solid",padding:14,borderColor:s.c==="amber"?"rgba(245,158,11,0.2)":s.c==="rose"?"rgba(239,68,68,0.2)":s.c==="green"?"rgba(16,185,129,0.2)":"rgba(59,130,246,0.2)",background:s.c==="amber"?"rgba(245,158,11,0.06)":s.c==="rose"?"rgba(239,68,68,0.06)":s.c==="green"?"rgba(16,185,129,0.06)":"rgba(59,130,246,0.06)"}}>
                  <div style={{fontSize:22,marginBottom:6}}>{s.i}</div><div style={{fontSize:22,fontWeight:700,color:"white",fontFamily:"Georgia,serif"}}>{s.v}</div><div style={{fontSize:11,color:"rgba(120,113,108,0.8)",marginTop:2}}>{s.l}</div>
                </div>
              ))}
            </div>
            <RmGrid/>
            <Card style={{padding:14}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
                <span style={{fontWeight:700,color:"#fbbf24",fontSize:14}}>Recent Checkouts</span>
                <Btn label="Analytics →" onClick={()=>setPg("an")} style={{background:"rgba(255,255,255,0.08)",color:"white",border:"1px solid rgba(255,255,255,0.12)",borderRadius:8,padding:"5px 10px",fontSize:11}}/>
              </div>
              {orders.slice(0,5).map((o,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 10px",background:"rgba(255,255,255,0.03)",borderRadius:10,marginBottom:6}}>
                <div style={{width:32,height:32,borderRadius:8,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:12,color:"#12100a",...g}}>{o.gn[0]}</div>
                <div style={{flex:1,minWidth:0}}><p style={{margin:0,fontSize:13,fontWeight:600,color:"#fef3c7"}}>{o.gn}</p><p style={{margin:0,fontSize:11,color:"rgba(120,113,108,0.7)"}}>Rm {o.rm}</p></div>
                {o.gstOn&&<span style={{fontSize:10,color:"rgba(245,158,11,0.6)",border:"1px solid rgba(245,158,11,0.2)",padding:"1px 6px",borderRadius:6}}>GST</span>}
                <span style={{fontSize:11,color:"rgba(120,113,108,0.7)"}}>{o.pay}</span>
                <span style={{fontFamily:"monospace",fontWeight:700,color:"#fcd34d",fontSize:13}}>{inr(o.tot)}</span>
              </div>)}
            </Card>
          </>}
          {pg==="rm"&&<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,alignItems:"start"}}>
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>{["All","available","occupied","reserved","cleaning"].map(f=><button key={f} onClick={()=>setFSt(f)} style={{padding:"5px 10px",borderRadius:8,fontSize:11,fontWeight:700,textTransform:"capitalize",background:fSt===f?"rgba(245,158,11,0.15)":"rgba(255,255,255,0.05)",color:fSt===f?"#fcd34d":"rgba(120,113,108,0.7)",border:"1px solid "+(fSt===f?"rgba(245,158,11,0.3)":"rgba(255,255,255,0.08)"),cursor:"pointer"}}>{f}</button>)}</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:6}}>
                {fR.map(r=><button key={r.id} onClick={()=>setSR(r)} style={{background:stC[r.status],border:"2px solid "+(sRL?.id===r.id?"rgba(245,158,11,0.8)":stB[r.status]),borderRadius:8,padding:"8px 4px",textAlign:"center",cursor:"pointer"}}>
                  <div style={{fontSize:12,fontWeight:900,color:stT[r.status]}}>{r.id}</div>
                  <div style={{fontSize:9,color:"rgba(120,113,108,0.7)"}}>{r.type.slice(0,3)}</div>
                  {r.guest&&<div style={{fontSize:8,color:"rgba(120,113,108,0.6)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",padding:"0 2px"}}>{r.guest.split(" ")[0]}</div>}
                </button>)}
              </div>
            </div>
            <div>{sRL?<GCard style={{padding:18}}>
              <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:12}}>
                <div><h3 style={{margin:0,fontFamily:"Georgia,serif",fontSize:22,color:"#fef3c7"}}>Room {sRL.id}</h3><p style={{margin:0,color:"rgba(120,113,108,0.7)",fontSize:13}}>{sRL.type} · Fl.{sRL.floor}{sRL.ac?" · ❄️":""}</p></div>
                <Bdg s={sRL.status}/>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12}}>
                <div style={{background:"rgba(16,185,129,0.08)",border:"1px solid rgba(16,185,129,0.2)",borderRadius:10,padding:10,textAlign:"center"}}><div style={{fontFamily:"Georgia,serif",fontWeight:700,color:"#6ee7b7",fontSize:18}}>{inr(sRL.rate)}</div><div style={{fontSize:11,color:"rgba(120,113,108,0.7)"}}>Per Night</div></div>
                <div style={{background:"rgba(59,130,246,0.08)",border:"1px solid rgba(59,130,246,0.2)",borderRadius:10,padding:10,textAlign:"center"}}><div style={{fontFamily:"Georgia,serif",fontWeight:700,color:"#93c5fd",fontSize:18}}>{sRL.maxPax}</div><div style={{fontSize:11,color:"rgba(120,113,108,0.7)"}}>Max Guests</div></div>
              </div>
              <div style={{display:"flex",flexWrap:"wrap",gap:5,marginBottom:12}}>{sRL.amenities.map((a,i)=><span key={i} style={{fontSize:11,padding:"3px 8px",borderRadius:99,background:"rgba(245,158,11,0.07)",color:"rgba(245,158,11,0.6)",border:"1px solid rgba(245,158,11,0.15)"}}>{a}</span>)}</div>
              {sRL.status==="occupied"&&(()=>{const gg=guests.find(x=>x.rm===sRL.id&&x.st==="in");return gg&&<div style={{background:"rgba(255,255,255,0.04)",borderRadius:10,padding:10,marginBottom:10}}>
                <p style={{margin:"0 0 4px",fontWeight:700,color:"#fcd34d",fontSize:13}}>{gg.name}</p>
                <p style={{margin:"0 0 2px",fontSize:11,color:"rgba(120,113,108,0.7)"}}>📞 {gg.phone}</p>
                <p style={{margin:"0 0 8px",fontSize:11,color:"rgba(120,113,108,0.7)"}}>📅 {gg.ci} → {gg.co} · {gg.ni}N</p>
                <div style={{display:"flex",gap:8}}><Btn label="+ Service" onClick={()=>{setSG(gg);setMS(true);}} style={{background:"rgba(16,185,129,0.12)",color:"#6ee7b7",border:"1px solid rgba(16,185,129,0.25)",borderRadius:8,fontSize:12,padding:"6px 10px"}}/><Btn label="💰 Checkout" onClick={()=>{setSG(gg);setMP(true);}} style={{background:"rgba(245,158,11,0.12)",color:"#fcd34d",border:"1px solid rgba(245,158,11,0.25)",borderRadius:8,fontSize:12,padding:"6px 10px"}}/></div>
              </div>;})()}
              <div style={{display:"flex",gap:8}}>
                {(sRL.status==="available"||sRL.status==="reserved")&&<Btn label="✅ Check In Guest" onClick={()=>setMCI(true)} style={{...g,borderRadius:10,flex:1}}/>}
                {sRL.status==="cleaning"&&<Btn label="✅ Mark Room Ready" onClick={()=>markReady(sRL.id)} style={{background:"rgba(16,185,129,0.15)",color:"#6ee7b7",border:"1px solid rgba(16,185,129,0.3)",borderRadius:10,flex:1}}/>}
              </div>
            </GCard>:<Card style={{height:200,display:"flex",alignItems:"center",justifyContent:"center"}}><div style={{textAlign:"center"}}><div style={{fontSize:36,marginBottom:8}}>🛏️</div><p style={{color:"rgba(120,113,108,0.6)",margin:0}}>Select a room</p></div></Card>}</div>
          </div>}
          {pg==="gu"&&<>
            <Inp value={gs} onChange={e=>setGs(e.target.value)} placeholder="Search name or room..." icon="🔍"/>
            {fG.map((gg,i)=><GCard key={i} style={{padding:14}}>
              <div style={{display:"flex",alignItems:"flex-start",gap:10}}>
                <div style={{width:40,height:40,borderRadius:10,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,color:"#12100a",...g}}>{gg.name[0]}</div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap",marginBottom:4}}><span style={{fontWeight:700,color:"#fef3c7"}}>{gg.name}</span><Bdg s={gg.st}/></div>
                  <p style={{margin:"0 0 2px",fontSize:11,color:"rgba(120,113,108,0.7)"}}>🛏️ Rm {gg.rm} · 📞 {gg.phone} · 🪪 {gg.idType}: {gg.idNo}</p>
                  <p style={{margin:0,fontSize:11,color:"rgba(120,113,108,0.7)"}}>📅 {gg.ci} → {gg.co} · {gg.ni}N</p>
                </div>
                <div style={{textAlign:"right",flexShrink:0}}>
                  <p style={{margin:"0 0 6px",fontFamily:"Georgia,serif",fontWeight:700,color:"#fcd34d",fontSize:15}}>{inr((rooms.find(r=>r.id===gg.rm)?.rate||0)*gg.ni)}</p>
                  {gg.st==="in"&&<div style={{display:"flex",flexDirection:"column",gap:5}}><Btn label="+Svc" onClick={()=>{setSG(gg);setMS(true);}} style={{background:"rgba(16,185,129,0.12)",color:"#6ee7b7",border:"1px solid rgba(16,185,129,0.25)",borderRadius:8,fontSize:12,padding:"5px 8px"}}/><Btn label="Pay" onClick={()=>{setSG(gg);setSR(rooms.find(r=>r.id===gg.rm));setMP(true);}} style={{background:"rgba(245,158,11,0.12)",color:"#fcd34d",border:"1px solid rgba(245,158,11,0.25)",borderRadius:8,fontSize:12,padding:"5px 8px"}}/></div>}
                </div>
              </div>
            </GCard>)}
          </>}
          {pg==="bi"&&<>
            <RmGrid/>
            <Card style={{padding:14}}>
              <h3 style={{margin:"0 0 12px",fontWeight:700,color:"#fbbf24",fontSize:14}}>Active Folios ({act.length})</h3>
              {act.length===0?<p style={{textAlign:"center",color:"rgba(120,113,108,0.6)",padding:20}}>No active guests</p>:act.map((gg,i)=>{
                const rm=rooms.find(r=>r.id===gg.rm);
                const bill=calcBill(gg.svcs||[],0,(rm?.rate||0)*gg.ni,gg.gstOn,gstCfg.c/100);
                return <div key={i} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 12px",background:"rgba(255,255,255,0.03)",borderRadius:10,marginBottom:8}}>
                  <div style={{width:36,height:36,borderRadius:8,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,color:"#12100a",fontSize:13,...g}}>{gg.name[0]}</div>
                  <div style={{flex:1,minWidth:0}}><p style={{margin:0,fontWeight:600,color:"#fef3c7",fontSize:13}}>{gg.name}</p><p style={{margin:0,fontSize:11,color:"rgba(120,113,108,0.7)"}}>Rm {gg.rm} · {gg.ni}N · Adv:{inr(gg.adv)}</p></div>
                  <div style={{textAlign:"right"}}><p style={{margin:0,fontFamily:"Georgia,serif",fontWeight:700,color:"#fcd34d",fontSize:14}}>{inr(bill.total)}</p><p style={{margin:0,fontSize:11,color:"rgba(120,113,108,0.7)"}}>Due:{inr(Math.max(0,bill.total-gg.adv))}</p></div>
                  <Btn label="Checkout" onClick={()=>{setSG(gg);setSR(rm);setMP(true);}} style={{background:"rgba(245,158,11,0.12)",color:"#fcd34d",border:"1px solid rgba(245,158,11,0.25)",borderRadius:8,fontSize:12,padding:"6px 10px",flexShrink:0}}/>
                </div>;
              })}
            </Card>
          </>}
          {pg==="an"&&<StatsView st={st} per={per} setPer={setPer}/>}
          {pg==="se"&&<div style={{maxWidth:480,display:"flex",flexDirection:"column",gap:14}}>
            <div style={{background:"rgba(239,68,68,0.05)",border:"1px solid rgba(239,68,68,0.2)",borderRadius:16,padding:18}}>
              <h3 style={{margin:"0 0 4px",fontFamily:"Georgia,serif",fontWeight:700,color:"#fca5a5",fontSize:16}}>🔐 License & Trial</h3>
              <p style={{margin:"0 0 14px",fontSize:12,color:"rgba(120,113,108,0.7)"}}>Manage trial period</p>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:14}}>
                <div style={{background:"rgba(255,255,255,0.03)",borderRadius:10,padding:10,textAlign:"center"}}><div style={{fontWeight:900,color:"#fcd34d",fontSize:18}}>{TrialEngine.getDaysLeft()}</div><div style={{fontSize:10,color:"rgba(120,113,108,0.7)"}}>Days Left</div></div>
                <div style={{background:"rgba(255,255,255,0.03)",borderRadius:10,padding:10,textAlign:"center"}}><div style={{fontWeight:900,color:"#fcd34d",fontSize:11}}>{TrialEngine.getStartDate()}</div><div style={{fontSize:10,color:"rgba(120,113,108,0.7)"}}>Start Date</div></div>
                <div style={{background:"rgba(255,255,255,0.03)",borderRadius:10,padding:10,textAlign:"center"}}><div style={{fontWeight:900,color:"#fca5a5",fontSize:11}}>{TrialEngine.getExpiryDate()}</div><div style={{fontSize:10,color:"rgba(120,113,108,0.7)"}}>Expiry</div></div>
              </div>
              <div style={{display:"flex",gap:8}}>
                <Btn label="🔄 Reset to 15 Days" onClick={()=>{TrialEngine.extendTrial(15);notify("✓ Trial reset!");window.location.reload();}} style={{background:"rgba(16,185,129,0.12)",color:"#6ee7b7",border:"1px solid rgba(16,185,129,0.25)",borderRadius:10,flex:1,fontSize:11}}/>
                <Btn label="⚠️ Expire Now" onClick={()=>{TrialEngine.extendTrial(0);notify("Trial expired","err");window.location.reload();}} style={{background:"rgba(239,68,68,0.12)",color:"#fca5a5",border:"1px solid rgba(239,68,68,0.25)",borderRadius:10,flex:1,fontSize:11}}/>
              </div>
            </div>
            <GCard style={{padding:18}}>
              <h3 style={{margin:"0 0 14px",fontFamily:"Georgia,serif",fontWeight:700,color:"#fcd34d"}}>GST Configuration</h3>
              <Toggle on={gstCfg.on} toggle={()=>setGstCfg(p=>({...p,on:!p.on}))} label="Enable GST by Default" sub="Toggle per booking"/>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginTop:12}}>
                <Inp label="CGST Rate %" type="number" value={gstCfg.c} onChange={e=>setGstCfg(p=>({...p,c:+e.target.value}))}/>
                <Inp label="SGST Rate %" type="number" value={gstCfg.s} onChange={e=>setGstCfg(p=>({...p,s:+e.target.value}))}/>
              </div>
              <div style={{marginTop:12}}><Btn label="💾 Save GST Settings" onClick={()=>notify("✓ GST settings saved!")} style={{...g,borderRadius:10,padding:"10px 18px",fontSize:13}}/></div>
            </GCard>
          </div>}
        </div>
      </div>
    </main>
    <Modal open={mCI} close={()=>setMCI(false)} title={"Check In — Room "+(sRL?.id)} wide><CIForm room={sRL} onOk={d=>{checkIn(d);setMCI(false);}} onCx={()=>setMCI(false)}/></Modal>
    <Modal open={mS} close={()=>setMS(false)} title={"Add Service — "+(sGL?.name)}>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>{SV.map(s=><button key={s.id} onClick={()=>{if(sGL)addSvc(sGL.id,s);}} style={{display:"flex",alignItems:"center",gap:10,background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:10,padding:10,cursor:"pointer"}}><span style={{fontSize:24}}>{s.e}</span><div><p style={{margin:0,fontSize:13,fontWeight:600,color:"#fef3c7"}}>{s.n}</p><p style={{margin:0,fontSize:11,color:"rgba(245,158,11,0.5)",fontFamily:"monospace"}}>{inr(s.p)}</p></div></button>)}</div>
      <div style={{marginTop:12}}><Btn label="Done" onClick={()=>setMS(false)} style={{background:"rgba(255,255,255,0.08)",color:"white",border:"1px solid rgba(255,255,255,0.12)",borderRadius:10,width:"100%"}}/></div>
    </Modal>
    <Modal open={mP} close={()=>setMP(false)} title={"Checkout — "+(sGL?.name)}>{sGL&&<BillView guest={sGL} room={sRL||rooms.find(r=>r.id===sGL?.rm)} onPay={(bill,mode)=>{checkOut(sGL.id,bill,mode);setMP(false);}}/>}</Modal>
  </div>;
}

function Operator(){
  const{user,logout,rooms,guests,orders,checkOut,addSvc,checkIn,markReady,SV,notify,gstCfg}=useA();
  const[pg,setPg]=useState("db");
  const dSt=useStats(orders,"day",user?.id);
  const[sR,setSR]=useState(null);const[sG,setSG]=useState(null);
  const[mCI,setMCI]=useState(false);const[mP,setMP]=useState(false);const[mS,setMS]=useState(false);
  const act=guests.filter(gg=>gg.st==="in");
  const sRL=sR?rooms.find(r=>r.id===sR.id)||sR:null;
  const sGL=sG?guests.find(gg=>gg.id===sG.id)||sG:null;
  const NAV=[{id:"db",i:"📊",l:"Dashboard"},{id:"ci",i:"✅",l:"Check In"},{id:"bi",i:"💰",l:"Billing"},{id:"rm",i:"🛏️",l:"Rooms"}];
  return <div style={{display:"flex",height:"100vh",overflow:"hidden",background:"#0d0a05"}}>
    <div style={{width:200,flexShrink:0,display:"flex",flexDirection:"column",borderRight:"1px solid rgba(59,130,246,0.12)",background:"rgba(13,10,5,0.98)"}}>
      <div style={{padding:20,borderBottom:"1px solid rgba(59,130,246,0.1)"}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:40,height:40,borderRadius:10,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,color:"white",fontSize:13,background:"rgba(59,130,246,0.3)",border:"1px solid rgba(59,130,246,0.3)"}}>{user?.av}</div>
          <div><div style={{fontWeight:700,color:"#93c5fd",fontSize:13}}>{user?.name}</div><div style={{fontSize:10,color:"rgba(59,130,246,0.5)",fontWeight:700,textTransform:"uppercase"}}>{user?.shift} Shift</div></div>
        </div>
      </div>
      <nav style={{flex:1,padding:12,display:"flex",flexDirection:"column",gap:2}}>
        {NAV.map(n=><button key={n.id} onClick={()=>setPg(n.id)} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",borderRadius:10,fontSize:13,fontWeight:600,background:pg===n.id?"rgba(59,130,246,0.12)":"transparent",color:pg===n.id?"#93c5fd":"rgba(120,113,108,0.8)",border:pg===n.id?"1px solid rgba(59,130,246,0.2)":"1px solid transparent",cursor:"pointer",textAlign:"left"}}><span style={{width:20}}>{n.i}</span><span>{n.l}</span></button>)}
      </nav>
      <div style={{padding:12}}>
        <div style={{background:"rgba(59,130,246,0.05)",border:"1px solid rgba(59,130,246,0.15)",borderRadius:8,padding:"8px 10px",marginBottom:10}}>
          <p style={{margin:0,fontSize:10,color:"rgba(147,197,253,0.6)",fontWeight:700}}>TRIAL: {TrialEngine.getDaysLeft()} DAYS LEFT</p>
          <p style={{margin:"2px 0 0",fontSize:10,color:"rgba(120,113,108,0.5)"}}>⚠ Day stats only</p>
        </div>
        <Btn label="🚪 Sign Out" onClick={logout} style={{background:"rgba(255,255,255,0.08)",color:"white",border:"1px solid rgba(255,255,255,0.12)",borderRadius:10,width:"100%",fontSize:12}}/>
      </div>
    </div>
    <main style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
      <TrialBanner/>
      <div style={{height:50,borderBottom:"1px solid rgba(59,130,246,0.1)",display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 20px",background:"rgba(13,10,5,0.96)",flexShrink:0}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <h1 style={{margin:0,fontWeight:700,color:"#bfdbfe",fontSize:15}}>{NAV.find(n=>n.id===pg)?.l}</h1>
          <span style={{fontSize:11,background:"rgba(59,130,246,0.1)",color:"#93c5fd",border:"1px solid rgba(59,130,246,0.2)",padding:"2px 8px",borderRadius:99,fontWeight:700}}>OPERATOR</span>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:6,fontSize:12,color:"#6ee7b7",background:"rgba(16,185,129,0.08)",border:"1px solid rgba(16,185,129,0.2)",borderRadius:99,padding:"3px 10px"}}><span style={{width:6,height:6,borderRadius:3,background:"#6ee7b7",display:"inline-block"}}/>Live</div>
      </div>
      <div style={{flex:1,overflow:"hidden",padding:16}} key={pg}>
        <div style={{height:"100%",overflowY:"auto",display:"flex",flexDirection:"column",gap:14,paddingBottom:16}}>
          {pg==="db"&&<>
            <div style={{background:"rgba(59,130,246,0.07)",border:"1px solid rgba(59,130,246,0.2)",borderRadius:14,padding:"12px 16px",display:"flex",gap:10}}>
              <span style={{fontSize:20,flexShrink:0}}>ℹ️</span>
              <div><p style={{margin:0,fontSize:13,fontWeight:700,color:"#93c5fd"}}>Today's Statistics — {user?.name}</p><p style={{margin:0,fontSize:11,color:"rgba(120,113,108,0.7)",marginTop:2}}>Full analytics available to Admin only.</p></div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10}}>
              {[{l:"Today Revenue",v:inr(dSt.rev),i:"💰",c:"amber"},{l:"Transactions",v:dSt.cnt,i:"🧾",c:"blue"},{l:"Avg Bill",v:inr(dSt.avg),i:"📊",c:"violet"},{l:"Active Guests",v:act.length,i:"👥",c:"green"}].map((s,i)=>(
                <div key={i} style={{borderRadius:14,border:"1px solid",padding:14,borderColor:s.c==="amber"?"rgba(245,158,11,0.2)":s.c==="blue"?"rgba(59,130,246,0.2)":s.c==="violet"?"rgba(139,92,246,0.2)":"rgba(16,185,129,0.2)",background:s.c==="amber"?"rgba(245,158,11,0.06)":s.c==="blue"?"rgba(59,130,246,0.06)":s.c==="violet"?"rgba(139,92,246,0.06)":"rgba(16,185,129,0.06)"}}>
                  <div style={{fontSize:22,marginBottom:6}}>{s.i}</div><div style={{fontSize:20,fontWeight:700,color:"white"}}>{s.v}</div><div style={{fontSize:11,color:"rgba(120,113,108,0.8)",marginTop:2}}>{s.l}</div>
                </div>
              ))}
            </div>
            <RmGrid/>
            <Card style={{padding:14}}>
              <p style={{margin:"0 0 10px",fontWeight:700,color:"#fbbf24",fontSize:13}}>Payment Mode — Today</p>
              {dSt.pb.map(p=>{const pct=dSt.rev>0?(p.t/dSt.rev)*100:0;return <div key={p.m} style={{marginBottom:10}}><div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:4}}><span style={{color:"rgba(180,160,120,0.8)"}}>{p.m==="Cash"?"💵":p.m==="UPI"?"📱":p.m==="Card"?"💳":"🏦"} {p.m} ({p.n})</span><span style={{fontFamily:"monospace",fontWeight:700,color:"white"}}>{inr(p.t)}</span></div><div style={{height:6,background:"rgba(255,255,255,0.05)",borderRadius:3}}><div style={{height:6,background:"linear-gradient(to right,#b45309,#f59e0b)",borderRadius:3,width:pct+"%",transition:"width .5s"}}/></div></div>;})}
            </Card>
            <Card style={{padding:14}}>
              <p style={{margin:"0 0 10px",fontWeight:700,color:"#fbbf24",fontSize:13}}>Today's Invoices ({dSt.cnt})</p>
              {dSt.f.length===0?<p style={{textAlign:"center",color:"rgba(120,113,108,0.6)",padding:16}}>No transactions today yet</p>:dSt.f.slice(0,8).map((o,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 10px",background:"rgba(255,255,255,0.03)",borderRadius:10,marginBottom:6}}>
                <div style={{width:28,height:28,borderRadius:7,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:11,color:"#12100a",...g}}>{o.gn[0]}</div>
                <div style={{flex:1,minWidth:0}}><p style={{margin:0,fontSize:13,fontWeight:600,color:"#fef3c7",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{o.gn}</p><p style={{margin:0,fontSize:11,color:"rgba(120,113,108,0.7)"}}>Rm {o.rm}</p></div>
                {o.gstOn&&<span style={{fontSize:10,color:"rgba(245,158,11,0.5)",border:"1px solid rgba(245,158,11,0.15)",padding:"1px 5px",borderRadius:6}}>GST</span>}
                <span style={{fontSize:11,color:"rgba(120,113,108,0.7)"}}>{o.pay}</span>
                <span style={{fontFamily:"monospace",fontWeight:700,color:"#fcd34d",fontSize:13}}>{inr(o.tot)}</span>
              </div>)}
            </Card>
          </>}
          {pg==="ci"&&<div style={{display:"flex",flexDirection:"column",gap:10}}>
            <p style={{margin:0,color:"rgba(120,113,108,0.7)",fontSize:13}}>Select an available room to check in a guest.</p>
            <div style={{display:"grid",gridTemplateColumns:"repeat(6,1fr)",gap:6}}>
              {rooms.filter(r=>r.status==="available"||r.status==="reserved").map(r=><button key={r.id} onClick={()=>{setSR(r);setMCI(true);}} style={{background:r.status==="available"?"rgba(16,185,129,0.1)":"rgba(245,158,11,0.1)",border:"1px solid "+(r.status==="available"?"rgba(16,185,129,0.2)":"rgba(245,158,11,0.2)"),borderRadius:8,padding:"10px 4px",textAlign:"center",cursor:"pointer"}}>
                <div style={{fontSize:13,fontWeight:900,color:r.status==="available"?"#6ee7b7":"#fcd34d"}}>{r.id}</div>
                <div style={{fontSize:9,color:"rgba(120,113,108,0.7)"}}>{r.type.slice(0,3)}</div>
                <div style={{fontSize:9,color:"rgba(120,113,108,0.6)",fontFamily:"monospace"}}>{inr(r.rate)}</div>
              </button>)}
            </div>
          </div>}
          {pg==="bi"&&<Card style={{padding:14}}>
            <p style={{margin:"0 0 12px",fontWeight:700,color:"#fbbf24",fontSize:14}}>Active Check-ins ({act.length})</p>
            {act.length===0?<p style={{textAlign:"center",color:"rgba(120,113,108,0.6)",padding:20}}>No active guests</p>:act.map((gg,i)=>{
              const rm=rooms.find(r=>r.id===gg.rm);
              const bill=calcBill(gg.svcs||[],0,(rm?.rate||0)*gg.ni,gg.gstOn,gstCfg.c/100);
              return <div key={i} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 12px",background:"rgba(255,255,255,0.03)",borderRadius:10,marginBottom:8}}>
                <div style={{width:36,height:36,borderRadius:8,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,color:"#12100a",fontSize:13,...g}}>{gg.name[0]}</div>
                <div style={{flex:1,minWidth:0}}><p style={{margin:0,fontWeight:600,color:"#fef3c7",fontSize:13}}>{gg.name}</p><p style={{margin:0,fontSize:11,color:"rgba(120,113,108,0.7)"}}>Rm {gg.rm} · {gg.ni}N</p></div>
                <div style={{textAlign:"right"}}><p style={{margin:0,fontWeight:700,color:"#fcd34d",fontSize:14,fontFamily:"Georgia,serif"}}>{inr(bill.total)}</p><p style={{margin:0,fontSize:11,color:"rgba(120,113,108,0.7)"}}>Due:{inr(Math.max(0,bill.total-gg.adv))}</p></div>
                <div style={{display:"flex",flexDirection:"column",gap:5}}>
                  <Btn label="+Svc" onClick={()=>{setSG(gg);setMS(true);}} style={{background:"rgba(16,185,129,0.12)",color:"#6ee7b7",border:"1px solid rgba(16,185,129,0.25)",borderRadius:8,fontSize:12,padding:"5px 8px"}}/>
                  <Btn label="Pay" onClick={()=>{setSG(gg);setSR(rm);setMP(true);}} style={{background:"rgba(245,158,11,0.12)",color:"#fcd34d",border:"1px solid rgba(245,158,11,0.25)",borderRadius:8,fontSize:12,padding:"5px 8px"}}/>
                </div>
              </div>;
            })}
          </Card>}
          {pg==="rm"&&<div style={{display:"flex",flexDirection:"column",gap:12}}>
            <RmGrid/>
            <Card style={{padding:14}}>
              <p style={{margin:"0 0 12px",fontWeight:700,color:"#fbbf24",fontSize:14}}>Rooms Needing Housekeeping</p>
              {rooms.filter(r=>r.status==="cleaning").map(r=><div key={r.id} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",background:"rgba(139,92,246,0.07)",border:"1px solid rgba(139,92,246,0.15)",borderRadius:10,marginBottom:8}}><span style={{color:"#c4b5fd",fontWeight:900,fontFamily:"monospace"}}>{r.id}</span><span style={{color:"rgba(180,160,120,0.8)",fontSize:13,flex:1}}>{r.type} — needs cleaning</span><Btn label="Mark Ready" onClick={()=>markReady(r.id)} style={{background:"rgba(16,185,129,0.12)",color:"#6ee7b7",border:"1px solid rgba(16,185,129,0.25)",borderRadius:8,fontSize:12,padding:"6px 10px"}}/></div>)}
              {rooms.filter(r=>r.status==="cleaning").length===0&&<p style={{textAlign:"center",color:"rgba(120,113,108,0.6)",padding:16}}>All rooms clean ✓</p>}
            </Card>
          </div>}
        </div>
      </div>
    </main>
    <Modal open={mCI} close={()=>setMCI(false)} title={"Check In — Room "+(sRL?.id)} wide><CIForm room={sRL} onOk={d=>{checkIn(d);setMCI(false);}} onCx={()=>setMCI(false)}/></Modal>
    <Modal open={mS} close={()=>setMS(false)} title={"Add Service — "+(sGL?.name)}>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>{SV.map(s=><button key={s.id} onClick={()=>{if(sGL)addSvc(sGL.id,s);}} style={{display:"flex",alignItems:"center",gap:10,background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:10,padding:10,cursor:"pointer"}}><span style={{fontSize:24}}>{s.e}</span><div><p style={{margin:0,fontSize:13,fontWeight:600,color:"#fef3c7"}}>{s.n}</p><p style={{margin:0,fontSize:11,color:"rgba(245,158,11,0.5)",fontFamily:"monospace"}}>{inr(s.p)}</p></div></button>)}</div>
      <div style={{marginTop:12}}><Btn label="Done" onClick={()=>setMS(false)} style={{background:"rgba(255,255,255,0.08)",color:"white",border:"1px solid rgba(255,255,255,0.12)",borderRadius:10,width:"100%"}}/></div>
    </Modal>
    <Modal open={mP} close={()=>setMP(false)} title={"Checkout — "+(sGL?.name)}>{sGL&&<BillView guest={sGL} room={sRL||rooms.find(r=>r.id===sGL?.rm)} onPay={(bill,mode)=>{checkOut(sGL.id,bill,mode);setMP(false);}}/>}</Modal>
  </div>;
}

export default function App(){
  return(
    <Provider>
      <div style={{fontFamily:"system-ui,sans-serif",background:"#0d0a05",minHeight:"100vh"}}>
        <style>{`*{box-sizing:border-box}body{margin:0}::-webkit-scrollbar{width:4px}::-webkit-scrollbar-thumb{background:rgba(180,140,80,.2);border-radius:4px}button{cursor:pointer}input[type=number]::-webkit-inner-spin-button{-webkit-appearance:none}select option{background:#12100a}`}</style>
        <Toast/>
        <Gate/>
      </div>
    </Provider>
  );
}
function Gate(){
  const{sc}=useA();
  if(TrialEngine.isExpired()&&sc!=="login")return <ExpiredScreen/>;
  return sc==="admin"?<Admin/>:sc==="op"?<Operator/>:<Login/>;
}
