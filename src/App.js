import { useState, useContext, createContext, useCallback, useEffect } from "react";

/* ══════════════════════════════════════════════════════════════
   STYLES
══════════════════════════════════════════════════════════════ */
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=JetBrains+Mono:wght@400;700&display=swap');
  *,*::before,*::after{box-sizing:border-box;}
  html,body{margin:0;padding:0;font-family:'Syne',sans-serif;-webkit-tap-highlight-color:transparent;}
  ::-webkit-scrollbar{width:3px;height:3px;}
  ::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.1);border-radius:4px;}
  .fade{animation:fi .2s ease;}
  @keyframes fi{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
  .pop{animation:pop .15s ease;}
  @keyframes pop{0%{transform:scale(0.95)}100%{transform:scale(1)}}
  input[type=number]::-webkit-inner-spin-button{-webkit-appearance:none;}
  select option{background:#1a1f2e;}
  button{cursor:pointer;border:none;background:none;}
`;

/* ══════════════════════════════════════════════════════════════
   MOCK USERS
══════════════════════════════════════════════════════════════ */
const MOCK_USERS = [
  {id:1,email:"admin@spicegarden.com",password:"demo",businessName:"Spice Garden",      businessType:"RESTAURANT",plan:"Pro",  gst:"27AAACR5055K1ZS",phone:"9876543210"},
  {id:2,email:"admin@grandazure.com", password:"demo",businessName:"Grand Azure Hotel", businessType:"HOTEL",     plan:"Elite",gst:"27AAACR5055K2ZS",phone:"9876543211"},
  {id:3,email:"admin@quickmart.com",  password:"demo",businessName:"QuickMart Retail",  businessType:"RETAIL",    plan:"Pro",  gst:"27AAACR5055K3ZS",phone:"9876543212"},
  {id:4,email:"admin@shantilodge.com",password:"demo",businessName:"Shanti Lodge",      businessType:"LODGE",     plan:"Pro",  gst:"27AAACR5055K4ZS",phone:"9876543213"},
];

/* ══════════════════════════════════════════════════════════════
   BILLING ENGINE
══════════════════════════════════════════════════════════════ */
const BE = {
  calc(items, disc=0, extra=0){
    const sub  = items.reduce((s,i)=>s+i.price*i.qty, 0);
    const da   = sub*(disc/100);
    const base = sub - da + extra;
    const cgst = base*0.09, sgst = base*0.09;
    return {sub, da, base, cgst, sgst, total:base+cgst+sgst};
  },
  inr(n){ return new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:2}).format(n||0); },
  id()  { return "ZB-"+Date.now().toString().slice(-8); },
  now() { return new Date().toLocaleString("en-IN",{day:"2-digit",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"}); },
};

/* ══════════════════════════════════════════════════════════════
   APP CONTEXT
══════════════════════════════════════════════════════════════ */
const Ctx = createContext(null);
const useApp = ()=>useContext(Ctx);

function Provider({children}){
  const [user,   setUser  ] = useState(null);
  const [cart,   setCart  ] = useState([]);
  const [orders, setOrders] = useState([]);
  const [toast,  setToast ] = useState(null);

  const login  = u => setUser(u);
  const logout = () => { setUser(null); setCart([]); };

  const addToCart = item => setCart(p=>{
    const ex = p.find(c=>c.id===item.id);
    return ex ? p.map(c=>c.id===item.id?{...c,qty:c.qty+1}:c) : [...p,{...item,qty:1}];
  });
  const setQty   = (id,qty)=>setCart(p=>qty<=0?p.filter(c=>c.id!==id):p.map(c=>c.id===id?{...c,qty}:c));
  const delItem  = id => setCart(p=>p.filter(c=>c.id!==id));
  const clearCart= ()  => setCart([]);

  const placeOrder = (payMode,disc,extra=0,meta={}) => {
    const bill = BE.calc(cart,disc,extra);
    const o = {id:BE.id(),items:[...cart],bill,payMode,disc,meta,time:BE.now(),biz:user?.businessName,gst:user?.gst};
    setOrders(p=>[o,...p]);
    setCart([]);
    return o;
  };

  const notify = useCallback((msg,type="success")=>{
    setToast({msg,type,key:Date.now()});
    setTimeout(()=>setToast(null),3000);
  },[]);

  return(
    <Ctx.Provider value={{user,cart,orders,toast,login,logout,addToCart,setQty,delItem,clearCart,placeOrder,notify}}>
      {children}
    </Ctx.Provider>
  );
}

/* ══════════════════════════════════════════════════════════════
   TINY UI COMPONENTS
══════════════════════════════════════════════════════════════ */
const clx=(...a)=>a.filter(Boolean).join(" ");

const Badge=({c="violet",dot,children})=>{
  const m={violet:"bg-violet-500/15 text-violet-300 border-violet-500/25",emerald:"bg-emerald-500/15 text-emerald-300 border-emerald-500/25",amber:"bg-amber-500/15 text-amber-300 border-amber-500/25",rose:"bg-rose-500/15 text-rose-300 border-rose-500/25",blue:"bg-blue-500/15 text-blue-300 border-blue-500/25",slate:"bg-slate-700/40 text-slate-400 border-slate-600/30",cyan:"bg-cyan-500/15 text-cyan-300 border-cyan-500/25"};
  return <span className={clx("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border",m[c]||m.slate)}>{dot&&<span className="w-1.5 h-1.5 rounded-full bg-current"/>}{children}</span>;
};

const Btn=({children,onClick,v="pri",sz="md",disabled,full,icon,className=""})=>{
  const vs={
    pri :"bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-lg shadow-violet-500/20",
    sec :"bg-white/8 hover:bg-white/14 text-white border border-white/12",
    dng :"bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/25",
    suc :"bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/25",
    wrn :"bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/25",
    ghost:"hover:bg-white/8 text-slate-400 hover:text-white",
    pay :"bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-500/20 text-base font-black",
  };
  const ss={xs:"px-2.5 py-1 text-xs",sm:"px-3 py-2 text-xs",md:"px-4 py-2.5 text-sm",lg:"px-5 py-3 text-sm",xl:"px-6 py-3.5 text-base"};
  return(
    <button onClick={onClick} disabled={disabled}
      className={clx("inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed select-none min-h-[40px]",vs[v]||vs.pri,ss[sz]||ss.md,full&&"w-full",className)}>
      {icon&&<span className="text-base leading-none">{icon}</span>}{children}
    </button>
  );
};

const Inp=({label,value,onChange,type="text",placeholder,icon,onKeyDown,hint,className=""})=>(
  <div className={clx("flex flex-col gap-1.5",className)}>
    {label&&<label className="text-xs font-semibold text-slate-500 uppercase tracking-widest">{label}</label>}
    <div className="relative">
      {icon&&<span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm pointer-events-none">{icon}</span>}
      <input type={type} value={value} onChange={onChange} onKeyDown={onKeyDown} placeholder={placeholder}
        className={clx("w-full bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-700 focus:outline-none focus:border-violet-500/60 focus:bg-white/7 transition-all text-sm py-2.5",icon?"pl-9 pr-4":"px-4")}/>
    </div>
    {hint&&<p className="text-xs text-slate-600">{hint}</p>}
  </div>
);

const PwdInp=({label,value,onChange,onKeyDown,placeholder})=>{
  const [show,setShow]=useState(false);
  return(
    <div className="flex flex-col gap-1.5">
      {label&&<label className="text-xs font-semibold text-slate-500 uppercase tracking-widest">{label}</label>}
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm pointer-events-none">🔒</span>
        <input type={show?"text":"password"} value={value} onChange={onChange} onKeyDown={onKeyDown} placeholder={placeholder}
          className="w-full bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-700 focus:outline-none focus:border-violet-500/60 transition-all text-sm pl-9 pr-14 py-2.5"
          style={{letterSpacing:show?"normal":value?"0.12em":"normal"}}
          autoComplete="current-password"/>
        <button type="button" onClick={()=>setShow(s=>!s)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500 hover:text-violet-300 transition-colors px-1">
          {show?"HIDE":"SHOW"}
        </button>
      </div>
      {value&&!show&&<p className="text-xs text-slate-600 flex items-center gap-1"><span>🔐</span>Password hidden — tap SHOW to reveal</p>}
    </div>
  );
};

const Sel=({label,value,onChange,options,className=""})=>(
  <div className={clx("flex flex-col gap-1.5",className)}>
    {label&&<label className="text-xs font-semibold text-slate-500 uppercase tracking-widest">{label}</label>}
    <select value={value} onChange={onChange} className="w-full bg-slate-800 border border-white/10 rounded-xl text-white px-4 py-2.5 text-sm focus:outline-none focus:border-violet-500/60 cursor-pointer">
      {options.map(o=><option key={o.v||o} value={o.v||o}>{o.l||o}</option>)}
    </select>
  </div>
);

const Card=({children,className=""})=>(
  <div className={clx("bg-white/[0.04] border border-white/8 rounded-2xl",className)}>{children}</div>
);

const Modal=({open,onClose,title,children,wide})=>{
  if(!open)return null;
  return(
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose}/>
      <div className={clx("relative bg-[#141928] border border-white/10 rounded-t-3xl sm:rounded-2xl shadow-2xl w-full fade",wide?"sm:max-w-2xl":"sm:max-w-md","max-h-[90vh] flex flex-col")}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/8 shrink-0">
          <h3 className="font-bold text-white text-base">{title}</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-xl bg-white/8 hover:bg-white/15 text-slate-400 hover:text-white transition-all flex items-center justify-center text-sm">✕</button>
        </div>
        <div className="overflow-y-auto p-5 flex-1">{children}</div>
      </div>
    </div>
  );
};

const StatCard=({label,value,icon,color="violet"})=>{
  const bg={violet:"from-violet-500/10 to-indigo-500/10 border-violet-500/20",emerald:"from-emerald-500/10 to-teal-500/10 border-emerald-500/20",amber:"from-amber-500/10 to-orange-500/10 border-amber-500/20",rose:"from-rose-500/10 to-pink-500/10 border-rose-500/20",blue:"from-blue-500/10 to-cyan-500/10 border-blue-500/20"};
  const ic={violet:"bg-violet-500/20 text-violet-300",emerald:"bg-emerald-500/20 text-emerald-300",amber:"bg-amber-500/20 text-amber-300",rose:"bg-rose-500/20 text-rose-300",blue:"bg-blue-500/20 text-blue-300"};
  return(
    <div className={clx("bg-gradient-to-br border rounded-2xl p-4",bg[color]||bg.violet)}>
      <div className={clx("w-9 h-9 rounded-xl flex items-center justify-center text-lg mb-3",ic[color]||ic.violet)}>{icon}</div>
      <div className="font-mono text-xl font-bold text-white leading-tight">{value}</div>
      <div className="text-xs text-slate-400 mt-1">{label}</div>
    </div>
  );
};

const Toast=()=>{
  const {toast}=useApp();
  if(!toast)return null;
  const C={success:"border-emerald-500/40 bg-emerald-500/10 text-emerald-200",error:"border-rose-500/40 bg-rose-500/10 text-rose-200",warning:"border-amber-500/40 bg-amber-500/10 text-amber-200"};
  return(
    <div key={toast.key} className={clx("fixed top-4 left-1/2 -translate-x-1/2 z-[200] flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium shadow-2xl fade whitespace-nowrap max-w-[90vw]",C[toast.type]||C.success)}>
      {toast.type==="success"?"✓":toast.type==="error"?"✕":"⚠"} {toast.msg}
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════
   PAYMENT MODAL — select payment, preview bill, then PAY
══════════════════════════════════════════════════════════════ */
const PAY_MODES=["Cash","UPI","Card","Credit"];

function PaymentModal({open,onClose,extraCharges=0,extraLabel="",onSuccess}){
  const {cart,placeOrder,notify}=useApp();
  const [disc,  setDisc ] = useState(0);
  const [mode,  setMode ] = useState("Cash");
  const bill = BE.calc(cart,disc,extraCharges);

  const handlePay=()=>{
    if(!cart.length)return notify("Cart is empty","error");
    const o = placeOrder(mode,disc,extraCharges);
    notify("✓ Payment successful! Report saved.");
    onSuccess(o);
    onClose();
  };

  if(!open)return null;
  return(
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/85 backdrop-blur-sm" onClick={onClose}/>
      <div className="relative bg-[#141928] border border-white/10 rounded-t-3xl sm:rounded-2xl shadow-2xl w-full sm:max-w-md max-h-[92vh] flex flex-col fade">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/8 shrink-0">
          <div>
            <h3 className="font-bold text-white text-base">💳 Select Payment & Pay</h3>
            <p className="text-xs text-slate-500 mt-0.5">{cart.length} items in cart</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl bg-white/8 hover:bg-white/15 text-slate-400 hover:text-white flex items-center justify-center text-sm">✕</button>
        </div>

        <div className="overflow-y-auto p-5 flex-1 space-y-5">
          {/* Cart summary */}
          <div className="space-y-1.5">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Order Summary</p>
            {cart.map(i=>(
              <div key={i.id} className="flex justify-between text-sm bg-white/3 rounded-xl px-3 py-2">
                <span className="text-slate-300">{i.emoji||""} {i.name} <span className="text-slate-500">× {i.qty}</span></span>
                <span className="font-mono font-bold text-white">{BE.inr(i.price*i.qty)}</span>
              </div>
            ))}
          </div>

          {/* Discount */}
          <Inp label="Discount %" type="number" value={disc} onChange={e=>setDisc(Math.min(100,Math.max(0,+e.target.value)))} placeholder="0" icon="🏷️"/>

          {/* Payment mode */}
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Payment Mode</p>
            <div className="grid grid-cols-4 gap-2">
              {PAY_MODES.map(m=>(
                <button key={m} onClick={()=>setMode(m)}
                  className={clx("rounded-xl py-2.5 text-xs font-bold transition-all border",mode===m?"bg-violet-600 text-white border-violet-500 shadow-lg shadow-violet-500/25":"bg-white/5 text-slate-400 border-white/10 hover:border-violet-500/40 hover:text-white")}>
                  {m==="Cash"?"💵":m==="UPI"?"📱":m==="Card"?"💳":"🏦"}<br/>{m}
                </button>
              ))}
            </div>
          </div>

          {/* Bill breakdown */}
          <div className="bg-white/3 rounded-2xl p-4 space-y-2 font-mono text-sm">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 font-sans">Bill Breakdown</p>
            <div className="flex justify-between text-slate-400"><span>Subtotal</span><span>{BE.inr(bill.sub)}</span></div>
            {bill.da>0&&<div className="flex justify-between text-emerald-400"><span>Discount ({disc}%)</span><span>−{BE.inr(bill.da)}</span></div>}
            {extraCharges>0&&<div className="flex justify-between text-slate-400"><span>{extraLabel||"Extra"}</span><span>{BE.inr(extraCharges)}</span></div>}
            <div className="flex justify-between text-slate-400"><span>CGST 9%</span><span>{BE.inr(bill.cgst)}</span></div>
            <div className="flex justify-between text-slate-400"><span>SGST 9%</span><span>{BE.inr(bill.sgst)}</span></div>
            <div className="flex justify-between text-white font-black text-lg border-t border-white/10 pt-3 mt-1">
              <span>TOTAL</span><span className="text-emerald-400">{BE.inr(bill.total)}</span>
            </div>
          </div>
        </div>

        {/* Pay button */}
        <div className="p-5 border-t border-white/8 shrink-0">
          <Btn v="pay" sz="xl" full onClick={handlePay} icon={mode==="Cash"?"💵":mode==="UPI"?"📱":mode==="Card"?"💳":"🏦"}>
            Pay {BE.inr(bill.total)} via {mode}
          </Btn>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   RECEIPT MODAL
══════════════════════════════════════════════════════════════ */
function ReceiptModal({open,onClose,order}){
  if(!open||!order)return null;
  return(
    <Modal open={open} onClose={onClose} title="🧾 Tax Invoice">
      <div className="bg-white/3 rounded-xl p-5 text-xs font-mono space-y-3 text-slate-300">
        <div className="text-center border-b border-white/10 pb-4">
          <div className="text-white font-black text-lg">{order.biz}</div>
          <div className="text-slate-500 mt-0.5">GSTIN: {order.gst}</div>
          <div className="text-slate-500">Invoice: {order.id}</div>
          <div className="text-slate-500">{order.time}</div>
          {order.meta?.table&&<div className="text-violet-300 font-bold mt-1">Table: {order.meta.table}</div>}
          {order.meta?.room&&<div className="text-violet-300 font-bold mt-1">Room: {order.meta.room}</div>}
        </div>
        <div className="space-y-1.5">
          {order.items.map((i,idx)=>(
            <div key={idx} className="flex justify-between">
              <span className="text-slate-400 flex-1 truncate">{i.name} × {i.qty}</span>
              <span className="text-white ml-3">{BE.inr(i.price*i.qty)}</span>
            </div>
          ))}
        </div>
        <div className="border-t border-white/10 pt-3 space-y-1.5">
          {order.bill.da>0&&<div className="flex justify-between text-emerald-400"><span>Discount ({order.disc}%)</span><span>−{BE.inr(order.bill.da)}</span></div>}
          {order.bill.extra>0&&<div className="flex justify-between text-slate-400"><span>Room/Extra</span><span>{BE.inr(order.bill.extra)}</span></div>}
          <div className="flex justify-between text-slate-400"><span>CGST 9%</span><span>{BE.inr(order.bill.cgst)}</span></div>
          <div className="flex justify-between text-slate-400"><span>SGST 9%</span><span>{BE.inr(order.bill.sgst)}</span></div>
          <div className="flex justify-between text-white font-black text-base border-t border-white/10 pt-2 mt-1">
            <span>TOTAL</span><span className="text-emerald-400">{BE.inr(order.bill.total)}</span>
          </div>
        </div>
        <div className="text-center text-slate-600 pt-2 border-t border-white/10">
          Paid via {order.payMode} · Thank you! 🙏
        </div>
      </div>
      <div className="flex gap-2 mt-4">
        <Btn v="sec" full onClick={onClose}>Close</Btn>
        <Btn v="pri" full icon="🖨">Print Receipt</Btn>
      </div>
    </Modal>
  );
}

/* ══════════════════════════════════════════════════════════════
   CART SIDEBAR — shown on right, always visible on desktop
══════════════════════════════════════════════════════════════ */
function CartPanel({title="Bill",extraCharges=0,extraLabel="",meta={}}){
  const {cart,setQty,delItem,clearCart,notify}=useApp();
  const [payOpen,  setPayOpen  ]=useState(false);
  const [rcptOpen, setRcptOpen ]=useState(false);
  const [lastOrder,setLastOrder]=useState(null);
  const total=BE.calc(cart,0,extraCharges).total;

  return(
    <>
      <Card className="flex flex-col h-full">
        {/* Header */}
        <div className="px-4 py-3 border-b border-white/8 flex items-center justify-between shrink-0">
          <span className="font-bold text-white text-sm">{title}</span>
          <Badge c="amber">{cart.length} items</Badge>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0">
          {!cart.length?(
            <div className="flex flex-col items-center justify-center h-full py-8 text-slate-700">
              <div className="text-4xl mb-2">🛒</div>
              <p className="text-xs text-center text-slate-600">Tap any item<br/>to add it here</p>
            </div>
          ):cart.map(item=>(
            <div key={item.id} className="bg-white/[0.04] border border-white/8 rounded-xl px-3 py-2.5 fade pop">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-white leading-tight">{item.emoji||""} {item.name}</p>
                  <p className="font-mono text-xs text-slate-500 mt-0.5">{BE.inr(item.price)} each</p>
                </div>
                <button onClick={()=>delItem(item.id)} className="text-slate-600 hover:text-rose-400 text-xs transition-colors mt-0.5 shrink-0">✕</button>
              </div>
              {/* Qty controls inline */}
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-2 bg-white/5 rounded-xl p-1">
                  <button onClick={()=>setQty(item.id,item.qty-1)}
                    className="w-7 h-7 rounded-lg bg-white/8 hover:bg-rose-500/20 hover:text-rose-300 text-white text-base flex items-center justify-center transition-all font-bold">−</button>
                  <span className="font-mono font-bold text-white text-sm w-6 text-center">{item.qty}</span>
                  <button onClick={()=>setQty(item.id,item.qty+1)}
                    className="w-7 h-7 rounded-lg bg-white/8 hover:bg-emerald-500/20 hover:text-emerald-300 text-white text-base flex items-center justify-center transition-all font-bold">+</button>
                </div>
                <span className="font-mono text-sm font-black text-violet-300">{BE.inr(item.price*item.qty)}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        {cart.length>0&&(
          <div className="p-3 border-t border-white/8 space-y-3 shrink-0">
            {extraCharges>0&&(
              <div className="flex justify-between text-xs font-mono text-slate-500 bg-white/3 rounded-xl px-3 py-2">
                <span>{extraLabel}</span><span>{BE.inr(extraCharges)}</span>
              </div>
            )}
            <div className="flex justify-between items-center">
              <span className="text-slate-400 text-sm">Subtotal (before tax)</span>
              <span className="font-mono font-bold text-white">{BE.inr(BE.calc(cart,0,extraCharges).sub)}</span>
            </div>
            <div className="flex gap-2">
              <Btn v="dng" sz="sm" onClick={clearCart} icon="🗑" className="shrink-0">Clear</Btn>
              <Btn v="pay" sz="md" full onClick={()=>setPayOpen(true)} icon="💳">
                Select Payment & Pay
              </Btn>
            </div>
          </div>
        )}
      </Card>

      <PaymentModal
        open={payOpen}
        onClose={()=>setPayOpen(false)}
        extraCharges={extraCharges}
        extraLabel={extraLabel}
        onSuccess={o=>{setLastOrder(o);setRcptOpen(true);}}
      />
      <ReceiptModal open={rcptOpen} onClose={()=>setRcptOpen(false)} order={lastOrder}/>
    </>
  );
}

/* ══════════════════════════════════════════════════════════════
   DATA
══════════════════════════════════════════════════════════════ */
const RMENU=[
  {id:"r1",name:"Butter Chicken",price:320,cat:"Main",emoji:"🍛",veg:false},
  {id:"r2",name:"Paneer Tikka",price:240,cat:"Starter",emoji:"🧀",veg:true},
  {id:"r3",name:"Dal Makhani",price:180,cat:"Main",emoji:"🫘",veg:true},
  {id:"r4",name:"Garlic Naan",price:40,cat:"Bread",emoji:"🫓",veg:true},
  {id:"r5",name:"Gulab Jamun",price:80,cat:"Dessert",emoji:"🍮",veg:true},
  {id:"r6",name:"Mango Lassi",price:80,cat:"Drinks",emoji:"🥛",veg:true},
  {id:"r7",name:"Chicken Biryani",price:280,cat:"Main",emoji:"🍚",veg:false},
  {id:"r8",name:"Samosa",price:40,cat:"Starter",emoji:"🥟",veg:true},
  {id:"r9",name:"Tandoori Chicken",price:340,cat:"Starter",emoji:"🍗",veg:false},
  {id:"r10",name:"Veg Pulao",price:160,cat:"Main",emoji:"🍲",veg:true},
  {id:"r11",name:"Cold Coffee",price:120,cat:"Drinks",emoji:"☕",veg:true},
  {id:"r12",name:"Mutton Rogan Josh",price:380,cat:"Main",emoji:"🍖",veg:false},
];
const RTABLES=Array.from({length:16},(_,i)=>({
  id:i+1,
  status:["available","occupied","reserved","occupied","available","occupied","cleaning","available"][i%8],
}));
const HROOMS=Array.from({length:24},(_,i)=>({
  id:100+i+1,
  type:["Standard","Deluxe","Suite","Presidential"][Math.floor(i/6)],
  price:[1500,2500,5000,12000][Math.floor(i/6)],
  floor:Math.floor(i/6)+1,
  status:["available","occupied","cleaning","reserved","occupied","available"][i%6],
  guest:i%3===1?{name:`Guest ${i+1}`,phone:"98765"+String(i).padStart(5,"0"),nights:Math.ceil(Math.random()*4)+1,checkIn:"2026-03-10"}:null,
}));
const HSERVICES=[
  {id:"hs1",name:"Room Service",price:350,emoji:"🍽️",cat:"Food"},
  {id:"hs2",name:"Breakfast",price:450,emoji:"🥞",cat:"Food"},
  {id:"hs3",name:"Laundry/kg",price:80,emoji:"👕",cat:"Service"},
  {id:"hs4",name:"Spa Session",price:1200,emoji:"💆",cat:"Wellness"},
  {id:"hs5",name:"Airport Drop",price:800,emoji:"🚗",cat:"Transport"},
  {id:"hs6",name:"Mini Bar",price:500,emoji:"🍷",cat:"Food"},
  {id:"hs7",name:"Extra Bed",price:600,emoji:"🛏️",cat:"Service"},
  {id:"hs8",name:"Gym",price:200,emoji:"💪",cat:"Wellness"},
];
const RPRODS=[
  {id:"p1",name:"Basmati Rice 5kg",price:320,sku:"GROC001",stock:45,cat:"Grocery",emoji:"🌾"},
  {id:"p2",name:"Sunflower Oil 1L",price:140,sku:"GROC002",stock:32,cat:"Grocery",emoji:"🫙"},
  {id:"p3",name:"Toor Dal 1kg",price:120,sku:"GROC003",stock:28,cat:"Grocery",emoji:"🫘"},
  {id:"p4",name:"Detergent 1kg",price:180,sku:"HOME001",stock:22,cat:"Home",emoji:"🧺"},
  {id:"p5",name:"Shampoo 200ml",price:220,sku:"PCARE001",stock:19,cat:"Personal",emoji:"🧴"},
  {id:"p6",name:"Toothpaste 100g",price:60,sku:"PCARE002",stock:55,cat:"Personal",emoji:"🪥"},
  {id:"p7",name:"Biscuits 400g",price:50,sku:"SNACK001",stock:100,cat:"Snacks",emoji:"🍪"},
  {id:"p8",name:"Chips Large",price:50,sku:"SNACK002",stock:80,cat:"Snacks",emoji:"🥔"},
  {id:"p9",name:"Soft Drink 2L",price:80,sku:"BEV001",stock:60,cat:"Beverages",emoji:"🥤"},
  {id:"p10",name:"Milk 1L",price:65,sku:"DAIRY001",stock:40,cat:"Dairy",emoji:"🥛"},
  {id:"p11",name:"Cheese 200g",price:180,sku:"DAIRY002",stock:15,cat:"Dairy",emoji:"🧀"},
  {id:"p12",name:"Butter 100g",price:55,sku:"DAIRY003",stock:30,cat:"Dairy",emoji:"🧈"},
];

/* ══════════════════════════════════════════════════════════════
   RESTAURANT POS
══════════════════════════════════════════════════════════════ */
function RestaurantPOS(){
  const {addToCart,notify,cart,setQty}=useApp();
  const [activeTable,setActiveTable]=useState(null);
  const [cat,setCat]=useState("All");
  const [search,setSearch]=useState("");
  const [kots,setKots]=useState([]);
  const [menu,setMenu]=useState(RMENU);
  const [tab,setTab]=useState("tables"); // mobile: tables|menu|bill
  const cats=["All",...new Set(menu.map(m=>m.cat))];
  const filtered=menu.filter(m=>(cat==="All"||m.cat===cat)&&(!search||m.name.toLowerCase().includes(search.toLowerCase())));

  const stC={available:"border-emerald-500/30 bg-emerald-500/8 text-emerald-300",occupied:"border-rose-500/30 bg-rose-500/8 text-rose-300",reserved:"border-amber-500/30 bg-amber-500/8 text-amber-300",cleaning:"border-blue-500/30 bg-blue-500/8 text-blue-300"};

  const fireKOT=()=>{
    if(!activeTable)return notify("Select a table first!","error");
    if(!cart.length)return notify("Cart is empty!","error");
    setKots(p=>[{table:activeTable,count:cart.length,time:new Date().toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"})},...p.slice(0,4)]);
    notify(`🔥 KOT fired for Table ${activeTable}!`);
  };

  const TableGrid=()=>(
    <div className="grid grid-cols-4 gap-2">
      {RTABLES.map(t=>(
        <button key={t.id} onClick={()=>{setActiveTable(t.id);setTab("menu");}}
          className={clx("rounded-xl border py-3 text-center transition-all",stC[t.status],activeTable===t.id&&"ring-2 ring-violet-500 ring-offset-1 ring-offset-[#0d1220]")}>
          <div className="text-sm font-black">{t.id}</div>
          <div className="text-[9px] opacity-60 capitalize mt-0.5">{t.status.slice(0,4)}</div>
        </button>
      ))}
    </div>
  );

  const MenuGrid=()=>(
    <>
      <div className="flex gap-2 mb-3">
        <Inp value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search dish..." icon="🔍" className="flex-1"/>
      </div>
      <div className="flex gap-1.5 overflow-x-auto pb-1 mb-3 shrink-0">
        {cats.map(c=><button key={c} onClick={()=>setCat(c)} className={clx("px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all",cat===c?"bg-violet-600 text-white":"bg-white/5 text-slate-400 hover:bg-white/8")}>{c}</button>)}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 overflow-y-auto flex-1 content-start">
        {filtered.map(item=>{
          const inCart=cart.find(c=>c.id===item.id);
          return(
            <div key={item.id} className={clx("bg-white/[0.04] border rounded-2xl p-3.5 transition-all",inCart?"border-violet-500/40 bg-violet-500/5":"border-white/8 hover:border-violet-400/30 hover:bg-white/6")}>
              <div className="flex items-start justify-between mb-1.5">
                <span className="text-2xl">{item.emoji}</span>
                <span className={clx("text-[9px] px-1.5 py-0.5 rounded-full font-bold",item.veg?"bg-emerald-500/20 text-emerald-300":"bg-rose-500/20 text-rose-300")}>{item.veg?"V":"NV"}</span>
              </div>
              <p className="text-xs font-bold text-white leading-tight">{item.name}</p>
              <p className="font-mono text-sm font-bold text-violet-400 mt-1">{BE.inr(item.price)}</p>
              {/* Inline qty or add button */}
              {inCart?(
                <div className="flex items-center gap-1 mt-2 bg-white/5 rounded-xl p-1">
                  <button onClick={()=>{if(!activeTable)return notify("Select a table first!","error");setQty(item.id,inCart.qty-1);}} className="w-7 h-7 rounded-lg bg-white/8 hover:bg-rose-500/20 hover:text-rose-300 text-white flex items-center justify-center font-bold text-base transition-all">−</button>
                  <span className="font-mono font-bold text-white text-sm flex-1 text-center">{inCart.qty}</span>
                  <button onClick={()=>{if(!activeTable)return notify("Select a table first!","error");addToCart(item);}} className="w-7 h-7 rounded-lg bg-white/8 hover:bg-emerald-500/20 hover:text-emerald-300 text-white flex items-center justify-center font-bold text-base transition-all">+</button>
                </div>
              ):(
                <button onClick={()=>{if(!activeTable)return notify("Select a table first!","error");addToCart(item);notify(`${item.emoji} ${item.name} added`);}}
                  className="mt-2 w-full bg-violet-600/20 hover:bg-violet-600/40 border border-violet-500/30 text-violet-300 text-xs font-bold py-1.5 rounded-xl transition-all">
                  + Add
                </button>
              )}
            </div>
          );
        })}
      </div>
    </>
  );

  return(
    <>
      {/* ── MOBILE ── */}
      <div className="flex flex-col h-full md:hidden">
        {/* Tab bar */}
        <div className="flex border-b border-white/8 shrink-0 bg-black/20">
          {[["tables","🪑 Tables"],["menu","🍽️ Menu"],["bill","🧾 Bill"]].map(([v,l])=>(
            <button key={v} onClick={()=>setTab(v)} className={clx("flex-1 py-3 text-xs font-bold transition-all",tab===v?"text-violet-300 border-b-2 border-violet-500":"text-slate-600")}>{l}</button>
          ))}
        </div>
        <div className="flex-1 overflow-hidden p-3">
          {tab==="tables"&&(
            <div className="overflow-y-auto h-full space-y-3">
              <TableGrid/>
              {activeTable&&<div className="bg-violet-500/10 border border-violet-500/30 rounded-xl px-3 py-2.5 text-xs text-violet-300 font-bold flex justify-between items-center">
                <span>🪑 Table {activeTable} active</span>
                <button onClick={fireKOT} className="bg-amber-500/20 text-amber-300 px-2.5 py-1 rounded-lg font-bold">🔥 KOT</button>
              </div>}
              {kots.length>0&&kots.map((k,i)=><div key={i} className="bg-amber-500/8 border border-amber-500/20 rounded-xl p-2.5 flex justify-between text-xs"><span className="text-amber-300 font-bold">T{k.table} · {k.count} items</span><span className="text-slate-600">{k.time}</span></div>)}
            </div>
          )}
          {tab==="menu"&&<div className="flex flex-col h-full">{activeTable&&<div className="bg-violet-500/10 border border-violet-500/30 rounded-xl px-3 py-2 text-xs text-violet-300 font-bold mb-2 shrink-0">🪑 Table {activeTable}</div>}<MenuGrid/></div>}
          {tab==="bill"&&<CartPanel title={activeTable?`Bill — Table ${activeTable}`:"Bill"}/>}
        </div>
      </div>

      {/* ── DESKTOP ── */}
      <div className="hidden md:grid grid-cols-12 gap-4 h-full overflow-hidden">
        {/* Tables + KOT */}
        <div className="col-span-3 flex flex-col gap-3 overflow-hidden">
          <Card className="p-3 shrink-0">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Floor Plan</p>
            <TableGrid/>
          </Card>
          {activeTable&&(
            <div className="bg-violet-500/10 border border-violet-500/30 rounded-xl px-3 py-2.5 text-sm text-violet-300 font-bold flex justify-between items-center shrink-0">
              <span>🪑 Table {activeTable}</span>
              <button onClick={fireKOT} className="bg-amber-500/20 text-amber-300 px-2.5 py-1.5 rounded-xl text-xs font-bold border border-amber-500/30 hover:bg-amber-500/30 transition-all">🔥 Fire KOT</button>
            </div>
          )}
          <Card className="p-3 flex-1 overflow-hidden flex flex-col">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">KOT Queue</p>
            <div className="space-y-2 overflow-y-auto flex-1">
              {kots.length===0&&<p className="text-xs text-slate-700 text-center py-4">No pending KOTs</p>}
              {kots.map((k,i)=><div key={i} className="bg-amber-500/8 border border-amber-500/20 rounded-xl p-2.5 flex justify-between text-xs"><span className="text-amber-300 font-bold">T{k.table} · {k.count} items</span><span className="text-slate-600 font-mono">{k.time}</span></div>)}
            </div>
          </Card>
        </div>

        {/* Menu */}
        <div className="col-span-6 flex flex-col overflow-hidden"><MenuGrid/></div>

        {/* Bill */}
        <div className="col-span-3 overflow-hidden">
          <CartPanel title={activeTable?`Bill — Table ${activeTable}`:"Select a table"}/>
        </div>
      </div>
    </>
  );
}

/* ══════════════════════════════════════════════════════════════
   HOTEL MANAGER
══════════════════════════════════════════════════════════════ */
function HotelManager(){
  const {addToCart,notify,cart,setQty}=useApp();
  const [rooms,setRooms]=useState(HROOMS);
  const [sel,setSel]=useState(null);
  const [ciModal,setCiModal]=useState(false);
  const [guest,setGuest]=useState({name:"",phone:"",nights:1,idno:""});
  const [sCat,setSCat]=useState("All");
  const [tab,setTab]=useState("rooms");

  const stC={available:"border-emerald-500/30 bg-emerald-500/8",occupied:"border-rose-500/30 bg-rose-500/8",cleaning:"border-amber-500/30 bg-amber-500/8",reserved:"border-blue-500/30 bg-blue-500/8"};
  const stT={available:"text-emerald-300",occupied:"text-rose-300",cleaning:"text-amber-300",reserved:"text-blue-300"};
  const sCats=["All",...new Set(HSERVICES.map(s=>s.cat))];
  const fSvc=sCat==="All"?HSERVICES:HSERVICES.filter(s=>s.cat===sCat);
  const selRoom=sel?rooms.find(r=>r.id===sel.id)||sel:null;

  const doCI=()=>{
    if(!guest.name)return notify("Enter guest name","error");
    const u={...selRoom,status:"occupied",guest:{...guest,checkIn:new Date().toISOString().split("T")[0]}};
    setRooms(p=>p.map(r=>r.id===selRoom.id?u:r));setSel(u);
    notify(`✓ ${guest.name} checked into Room ${selRoom.id}!`);setCiModal(false);setGuest({name:"",phone:"",nights:1,idno:""});
  };
  const doCO=room=>{
    const u={...room,status:"cleaning",guest:null};
    setRooms(p=>p.map(r=>r.id===room.id?u:r));if(sel?.id===room.id)setSel(u);
    notify(`Room ${room.id} checked out.`);
  };
  const markReady=room=>{
    const u={...room,status:"available"};
    setRooms(p=>p.map(r=>r.id===room.id?u:r));if(sel?.id===room.id)setSel(u);
    notify(`Room ${room.id} is ready!`);
  };

  const RoomGrid=()=>(
    <div className="grid grid-cols-4 gap-1.5 overflow-y-auto content-start h-full">
      {rooms.map(r=>(
        <button key={r.id} onClick={()=>{setSel(r);setTab("detail");}}
          className={clx("rounded-xl border py-2.5 text-center transition-all",stC[r.status],sel?.id===r.id&&"ring-2 ring-violet-500 ring-offset-1 ring-offset-[#0d1220]")}>
          <div className={clx("text-xs font-black",stT[r.status])}>{r.id}</div>
          <div className="text-[9px] text-slate-600">{r.type.slice(0,3)}</div>
          {r.guest&&<div className="text-[9px] text-slate-500 px-1 truncate">{r.guest.name.split(" ")[0]}</div>}
        </button>
      ))}
    </div>
  );

  const RoomDetail=()=>(
    <div className="space-y-3 overflow-y-auto h-full">
      {selRoom?(
        <>
          <Card className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div><h3 className="font-black text-white text-lg">Room {selRoom.id}</h3><p className="text-sm text-slate-500">{selRoom.type} · Floor {selRoom.floor}</p></div>
              <Badge c={selRoom.status==="available"?"emerald":selRoom.status==="occupied"?"rose":selRoom.status==="cleaning"?"amber":"blue"} dot>{selRoom.status}</Badge>
            </div>
            <div className="font-mono text-xl font-black text-violet-300 mb-3">{BE.inr(selRoom.price)}<span className="text-xs text-slate-600 font-normal">/night</span></div>
            {selRoom.guest&&(
              <div className="bg-white/4 rounded-xl p-3 mb-3">
                <p className="text-white font-bold text-sm">{selRoom.guest.name}</p>
                <p className="text-xs text-slate-500 mt-1">📞 {selRoom.guest.phone} · {selRoom.guest.nights} nights</p>
                <p className="text-xs text-violet-400 font-mono mt-1 font-bold">Room: {BE.inr(selRoom.price*selRoom.guest.nights)}</p>
              </div>
            )}
            <div className="flex gap-2">
              {selRoom.status==="available"&&<Btn v="suc" full onClick={()=>setCiModal(true)} icon="✅">Check In</Btn>}
              {selRoom.status==="occupied"  &&<Btn v="dng" full onClick={()=>doCO(selRoom)} icon="🚪">Check Out</Btn>}
              {selRoom.status==="cleaning"  &&<Btn v="wrn" full onClick={()=>markReady(selRoom)} icon="✅">Mark Ready</Btn>}
            </div>
          </Card>
          <Card className="p-4">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Add Services to Folio</p>
            <div className="flex gap-1 flex-wrap mb-2">
              {sCats.map(c=><button key={c} onClick={()=>setSCat(c)} className={clx("px-2.5 py-1 rounded-lg text-xs font-semibold transition-all",sCat===c?"bg-violet-600 text-white":"bg-white/5 text-slate-500 hover:bg-white/8")}>{c}</button>)}
            </div>
            <div className="grid grid-cols-2 gap-2">
              {fSvc.map(s=>{
                const inCart=cart.find(c=>c.id===s.id);
                return(
                  <div key={s.id} className={clx("border rounded-xl p-2.5 transition-all",inCart?"border-violet-500/40 bg-violet-500/5":"border-white/8 bg-white/3 hover:border-violet-400/30")}>
                    <span className="text-lg">{s.emoji}</span>
                    <p className="text-xs font-bold text-white mt-1">{s.name}</p>
                    <p className="font-mono text-xs text-violet-400">{BE.inr(s.price)}</p>
                    {inCart?(
                      <div className="flex items-center gap-1 mt-1.5 bg-white/5 rounded-lg p-0.5">
                        <button onClick={()=>setQty(s.id,inCart.qty-1)} className="w-6 h-6 rounded-md bg-white/8 hover:bg-rose-500/20 text-white flex items-center justify-center font-bold text-sm">−</button>
                        <span className="font-mono font-bold text-white text-xs flex-1 text-center">{inCart.qty}</span>
                        <button onClick={()=>addToCart(s)} className="w-6 h-6 rounded-md bg-white/8 hover:bg-emerald-500/20 text-white flex items-center justify-center font-bold text-sm">+</button>
                      </div>
                    ):(
                      <button onClick={()=>{if(selRoom.status!=="occupied")return notify("Check in a guest first","error");addToCart(s);notify(`${s.emoji} ${s.name} added`);}}
                        className="mt-1.5 w-full bg-violet-600/20 hover:bg-violet-600/40 border border-violet-500/30 text-violet-300 text-[10px] font-bold py-1 rounded-lg transition-all">
                        + Add
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
        </>
      ):(
        <Card className="h-40 flex items-center justify-center">
          <div className="text-center"><div className="text-4xl mb-2">🏨</div><p className="text-sm text-slate-600">Select a room</p></div>
        </Card>
      )}
    </div>
  );

  return(
    <>
      {/* Mobile */}
      <div className="flex flex-col h-full md:hidden">
        <div className="flex border-b border-white/8 shrink-0 bg-black/20">
          {[["rooms","🛏️ Rooms"],["detail","🏨 Detail"],["bill","🧾 Folio"]].map(([v,l])=>(
            <button key={v} onClick={()=>setTab(v)} className={clx("flex-1 py-3 text-xs font-bold transition-all",tab===v?"text-violet-300 border-b-2 border-violet-500":"text-slate-600")}>{l}</button>
          ))}
        </div>
        <div className="flex-1 overflow-hidden p-3">
          {tab==="rooms"&&<RoomGrid/>}
          {tab==="detail"&&<RoomDetail/>}
          {tab==="bill"&&<CartPanel title={selRoom?`Folio — ${selRoom.id}`:"Folio"} extraCharges={selRoom?.guest?selRoom.price*selRoom.guest.nights:0} extraLabel="Room Charges"/>}
        </div>
      </div>

      {/* Desktop */}
      <div className="hidden md:grid grid-cols-12 gap-4 h-full overflow-hidden">
        <div className="col-span-4 flex flex-col gap-3 overflow-hidden">
          <div className="flex items-center justify-between shrink-0">
            <span className="font-mono text-xs text-slate-500">{rooms.filter(r=>r.status==="occupied").length}/{rooms.length} occupied</span>
            <div className="flex flex-wrap gap-1">{[["available","emerald"],["occupied","rose"],["cleaning","amber"],["reserved","blue"]].map(([s,c])=><Badge key={s} c={c} dot>{s}</Badge>)}</div>
          </div>
          <div className="flex-1 overflow-hidden"><RoomGrid/></div>
        </div>
        <div className="col-span-4 overflow-hidden"><RoomDetail/></div>
        <div className="col-span-4 overflow-hidden">
          <CartPanel title={selRoom?`Folio — ${selRoom.id}`:"Folio"} extraCharges={selRoom?.guest?selRoom.price*selRoom.guest.nights:0} extraLabel="Room Charges"/>
        </div>
      </div>

      <Modal open={ciModal} onClose={()=>setCiModal(false)} title={`Check In — Room ${selRoom?.id}`}>
        <div className="space-y-3">
          <Inp label="Guest Name" value={guest.name} onChange={e=>setGuest({...guest,name:e.target.value})} placeholder="Full name" icon="👤"/>
          <Inp label="Phone" value={guest.phone} onChange={e=>setGuest({...guest,phone:e.target.value})} placeholder="Mobile" icon="📞"/>
          <Inp label="ID Proof" value={guest.idno} onChange={e=>setGuest({...guest,idno:e.target.value})} placeholder="Aadhaar / Passport" icon="🪪"/>
          <Inp label="Nights" type="number" value={guest.nights} onChange={e=>setGuest({...guest,nights:Math.max(1,+e.target.value)})} icon="🌙"/>
          {selRoom&&<div className="bg-violet-500/10 border border-violet-500/20 rounded-xl p-3 font-mono text-sm text-violet-300 font-bold">
            Total room: {BE.inr(selRoom.price*guest.nights)} ({guest.nights}N × {BE.inr(selRoom.price)})
          </div>}
          <div className="flex gap-2 pt-1">
            <Btn v="sec" onClick={()=>setCiModal(false)} full>Cancel</Btn>
            <Btn v="suc" onClick={doCI} full icon="✅">Confirm Check In</Btn>
          </div>
        </div>
      </Modal>
    </>
  );
}

/* ══════════════════════════════════════════════════════════════
   RETAIL POS
══════════════════════════════════════════════════════════════ */
function RetailPOS(){
  const {addToCart,notify,cart,setQty}=useApp();
  const [barcode,setBarcode]=useState("");
  const [search,setSearch]=useState("");
  const [cat,setCat]=useState("All");
  const [prods,setProds]=useState(RPRODS);
  const [addModal,setAddModal]=useState(false);
  const [newP,setNewP]=useState({name:"",price:"",sku:"",stock:""});
  const [tab,setTab]=useState("products");

  const cats=["All",...new Set(prods.map(p=>p.cat))];
  const filtered=prods.filter(p=>(cat==="All"||p.cat===cat)&&(!search||p.name.toLowerCase().includes(search.toLowerCase())||p.sku.toLowerCase().includes(search.toLowerCase())));

  const scan=e=>{
    if(e.key==="Enter"&&barcode){
      const f=prods.find(p=>p.sku.toLowerCase()===barcode.toLowerCase());
      if(f){addToCart(f);notify(`📷 ${f.name} scanned!`);setBarcode("");}
      else notify(`SKU "${barcode}" not found`,"error");
    }
  };

  const ProductGrid=()=>(
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 overflow-y-auto content-start h-full">
      {filtered.map(item=>{
        const inCart=cart.find(c=>c.id===item.id);
        return(
          <div key={item.id} className={clx("border rounded-2xl p-3.5 transition-all",inCart?"border-violet-500/40 bg-violet-500/5":"border-white/8 bg-white/[0.04] hover:border-violet-400/30 hover:bg-white/6")}>
            <div className="relative mb-1">
              <span className="text-2xl">{item.emoji}</span>
              {item.stock<20&&<span className="absolute top-0 right-0 text-[9px] bg-rose-500/25 text-rose-300 px-1.5 py-0.5 rounded-full font-bold">LOW</span>}
            </div>
            <p className="font-mono text-[10px] text-slate-600">{item.sku}</p>
            <p className="text-xs font-bold text-white leading-tight mt-0.5">{item.name}</p>
            <div className="flex items-center justify-between mt-1 mb-2">
              <p className="font-mono text-sm font-black text-violet-400">{BE.inr(item.price)}</p>
              <span className="text-xs text-slate-600">×{item.stock}</span>
            </div>
            {inCart?(
              <div className="flex items-center gap-1 bg-white/5 rounded-xl p-1">
                <button onClick={()=>setQty(item.id,inCart.qty-1)} className="w-7 h-7 rounded-lg bg-white/8 hover:bg-rose-500/20 hover:text-rose-300 text-white flex items-center justify-center font-bold text-base transition-all">−</button>
                <span className="font-mono font-bold text-white text-sm flex-1 text-center">{inCart.qty}</span>
                <button onClick={()=>addToCart(item)} className="w-7 h-7 rounded-lg bg-white/8 hover:bg-emerald-500/20 hover:text-emerald-300 text-white flex items-center justify-center font-bold text-base transition-all">+</button>
              </div>
            ):(
              <button onClick={()=>{addToCart(item);notify(`${item.emoji} ${item.name} added`);}}
                className="w-full bg-violet-600/20 hover:bg-violet-600/40 border border-violet-500/30 text-violet-300 text-xs font-bold py-1.5 rounded-xl transition-all">
                + Add
              </button>
            )}
          </div>
        );
      })}
    </div>
  );

  return(
    <>
      {/* Mobile */}
      <div className="flex flex-col h-full md:hidden">
        <div className="flex border-b border-white/8 shrink-0 bg-black/20">
          {[["products","📦 Products"],["bill","🧾 Pay"]].map(([v,l])=>(
            <button key={v} onClick={()=>setTab(v)} className={clx("flex-1 py-3 text-xs font-bold transition-all",tab===v?"text-violet-300 border-b-2 border-violet-500":"text-slate-600")}>{l}</button>
          ))}
        </div>
        {tab==="products"&&(
          <div className="flex flex-col gap-2 p-3 flex-1 overflow-hidden">
            <div className="grid grid-cols-2 gap-2 shrink-0">
              <Inp value={barcode} onChange={e=>setBarcode(e.target.value)} onKeyDown={scan} placeholder="Scan SKU+Enter" icon="📷"/>
              <Inp value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search..." icon="🔍"/>
            </div>
            <div className="flex gap-1.5 overflow-x-auto pb-1 shrink-0">
              {cats.map(c=><button key={c} onClick={()=>setCat(c)} className={clx("px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all",cat===c?"bg-violet-600 text-white":"bg-white/5 text-slate-400")}>{c}</button>)}
            </div>
            <div className="flex-1 overflow-hidden"><ProductGrid/></div>
          </div>
        )}
        {tab==="bill"&&<div className="flex-1 p-3"><CartPanel title="Quick Pay"/></div>}
      </div>

      {/* Desktop */}
      <div className="hidden md:grid grid-cols-12 gap-4 h-full overflow-hidden">
        <div className="col-span-9 flex flex-col gap-3 overflow-hidden">
          <div className="grid grid-cols-3 gap-3 shrink-0">
            <Inp label="Barcode" value={barcode} onChange={e=>setBarcode(e.target.value)} onKeyDown={scan} placeholder="Scan SKU + Enter" icon="📷"/>
            <Inp label="Search" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Name or SKU" icon="🔍"/>
            <div className="flex items-end"><Btn v="sec" sz="md" full onClick={()=>setAddModal(true)} icon="➕">Add Product</Btn></div>
          </div>
          <div className="flex gap-1.5 flex-wrap shrink-0">
            {cats.map(c=><button key={c} onClick={()=>setCat(c)} className={clx("px-3 py-1.5 rounded-xl text-xs font-semibold transition-all",cat===c?"bg-violet-600 text-white":"bg-white/5 text-slate-400 hover:bg-white/8")}>{c}</button>)}
          </div>
          <div className="flex-1 overflow-hidden"><ProductGrid/></div>
        </div>
        <div className="col-span-3 overflow-hidden"><CartPanel title="Quick Pay"/></div>
      </div>

      <Modal open={addModal} onClose={()=>setAddModal(false)} title="Add Product">
        <div className="space-y-3">
          <Inp label="Product Name" value={newP.name} onChange={e=>setNewP({...newP,name:e.target.value})} placeholder="e.g. Milk 2L"/>
          <div className="grid grid-cols-2 gap-3">
            <Inp label="Price (₹)" type="number" value={newP.price} onChange={e=>setNewP({...newP,price:e.target.value})}/>
            <Inp label="Stock" type="number" value={newP.stock} onChange={e=>setNewP({...newP,stock:e.target.value})}/>
          </div>
          <Inp label="SKU Code" value={newP.sku} onChange={e=>setNewP({...newP,sku:e.target.value})} placeholder="e.g. DAIRY004"/>
          <Btn v="pri" full onClick={()=>{
            if(!newP.name||!newP.price)return notify("Fill required fields","error");
            setProds(p=>[...p,{id:"n"+Date.now(),name:newP.name,price:+newP.price,sku:newP.sku||"SKU"+Date.now().toString().slice(-4),stock:+newP.stock||0,cat:"Other",emoji:"📦"}]);
            notify(`✓ ${newP.name} added!`);setAddModal(false);setNewP({name:"",price:"",sku:"",stock:""});
          }}>Add Product</Btn>
        </div>
      </Modal>
    </>
  );
}

/* ══════════════════════════════════════════════════════════════
   DASHBOARD
══════════════════════════════════════════════════════════════ */
function DashboardPage(){
  const {orders,user}=useApp();
  const rev=orders.reduce((s,o)=>s+o.bill.total,0);
  const gst=orders.reduce((s,o)=>s+o.bill.cgst+o.bill.sgst,0);
  const typeStats={
    RESTAURANT:[{label:"Orders",value:orders.length||8,icon:"📋",color:"violet"},{label:"Revenue",value:BE.inr(rev||24800),icon:"₹",color:"emerald"},{label:"Active Tables",value:"6/16",icon:"🪑",color:"amber"},{label:"KOTs",value:"3",icon:"🔥",color:"rose"}],
    HOTEL:     [{label:"Occupied",value:"14/24",icon:"🛏️",color:"violet"},{label:"Revenue",value:BE.inr(rev||52000),icon:"₹",color:"emerald"},{label:"Check-ins",value:orders.length||5,icon:"✅",color:"amber"},{label:"Check-outs",value:"3",icon:"🚪",color:"blue"}],
    RETAIL:    [{label:"Transactions",value:orders.length||34,icon:"🧾",color:"violet"},{label:"Revenue",value:BE.inr(rev||18600),icon:"₹",color:"emerald"},{label:"Items Sold",value:"142",icon:"📦",color:"amber"},{label:"Low Stock",value:"4",icon:"⚠️",color:"rose"}],
  };
  const stats=typeStats[user?.businessType]||typeStats.RESTAURANT;
  const chartD=[42,68,55,80,73,90,61].map((v,i)=>({v,d:["M","T","W","T","F","S","S"][i]}));
  const maxV=Math.max(...chartD.map(c=>c.v));
  const mockO=[{id:"ZB-00000001",items:[{name:"Butter Chicken"},{name:"Naan"}],bill:{total:1240},payMode:"UPI",time:"02:45 PM"},{id:"ZB-00000002",items:[{name:"Room Service"}],bill:{total:3200},payMode:"Card",time:"01:30 PM"},{id:"ZB-00000003",items:[{name:"Rice 5kg"}],bill:{total:580},payMode:"Cash",time:"12:15 PM"}];
  const display=orders.length?orders.slice(0,6):mockO;
  return(
    <div className="space-y-4 overflow-y-auto h-full pb-4 fade">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">{stats.map((s,i)=><StatCard key={i} {...s}/>)}</div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="md:col-span-2 p-5">
          <div className="flex items-center justify-between mb-4"><div><h3 className="font-bold text-white">Weekly Revenue</h3><p className="text-xs text-slate-500">Performance</p></div><Badge c="emerald" dot>Live</Badge></div>
          <div className="flex items-end gap-1.5 h-24">
            {chartD.map((d,i)=>(
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full rounded-t-lg bg-gradient-to-t from-violet-600/60 to-violet-400/30" style={{height:`${(d.v/maxV)*100}%`,minHeight:"6px"}}/>
                <span className="text-xs text-slate-600">{d.d}</span>
              </div>
            ))}
          </div>
        </Card>
        <Card className="p-5 space-y-3">
          <h3 className="font-bold text-white">Quick Stats</h3>
          {[{l:"Avg Bill",v:BE.inr(orders.length?rev/orders.length:1450),c:"violet"},{l:"GST Collected",v:BE.inr(gst||3800),c:"blue"},{l:"Discounts",v:BE.inr(orders.reduce((s,o)=>s+(o.bill.da||0),0)||640),c:"amber"},{l:"Total Orders",v:orders.length||47,c:"emerald"}].map((s,i)=>(
            <div key={i} className="flex items-center justify-between">
              <span className="text-xs text-slate-500">{s.l}</span>
              <span className={`font-mono text-sm font-bold text-${s.c}-300`}>{s.v}</span>
            </div>
          ))}
        </Card>
      </div>
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3"><h3 className="font-bold text-white text-sm">Recent Transactions</h3><Badge c="slate">{display.length}</Badge></div>
        <div className="space-y-2">
          {display.map((o,i)=>(
            <div key={i} className="flex items-center gap-3 px-3 py-2.5 bg-white/3 rounded-xl hover:bg-white/5 transition-all">
              <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center text-sm shrink-0">🧾</div>
              <div className="flex-1 min-w-0"><p className="font-mono text-xs font-bold text-white">{o.id}</p><p className="text-xs text-slate-600 truncate">{o.items?.map(i=>i.name).join(", ")}</p></div>
              <Badge c={o.payMode==="Cash"?"amber":o.payMode==="UPI"?"emerald":"blue"}>{o.payMode}</Badge>
              <span className="font-mono text-sm font-bold text-white shrink-0">{BE.inr(o.bill.total)}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   REPORTS — auto-populated from completed orders
══════════════════════════════════════════════════════════════ */
function ReportsPage(){
  const {orders}=useApp();
  const rev=orders.reduce((s,o)=>s+o.bill.total,0);
  const gst=orders.reduce((s,o)=>s+o.bill.cgst+o.bill.sgst,0);
  const payModes=["Cash","UPI","Card","Credit"];
  const mockPay=[{mode:"Cash",count:18,total:14200,c:"amber"},{mode:"UPI",count:22,total:28400,c:"emerald"},{mode:"Card",count:5,total:9800,c:"blue"},{mode:"Credit",count:2,total:3600,c:"violet"}];
  const payD=orders.length?payModes.map(p=>({mode:p,count:orders.filter(o=>o.payMode===p).length,total:orders.filter(o=>o.payMode===p).reduce((s,o)=>s+o.bill.total,0),c:{Cash:"amber",UPI:"emerald",Card:"blue",Credit:"violet"}[p]})):mockPay;
  const totalR=payD.reduce((s,p)=>s+p.total,0)||1;
  const topItems=[{name:"Butter Chicken",qty:34,rev:10880},{name:"Biryani",qty:28,rev:7840},{name:"Paneer Tikka",qty:45,rev:10800},{name:"Naan",qty:120,rev:4800},{name:"Lassi",qty:60,rev:4800}];
  const display=orders.length?orders:[{id:"ZB-00000001",items:[{name:"Butter Chicken"}],bill:{total:1240},payMode:"UPI",time:"Today"},{id:"ZB-00000002",items:[{name:"Room Service"}],bill:{total:3200},payMode:"Card",time:"Today"},{id:"ZB-00000003",items:[{name:"Rice"}],bill:{total:580},payMode:"Cash",time:"Today"}];

  return(
    <div className="space-y-4 h-full overflow-y-auto pb-4 fade">
      {orders.length===0&&(
        <div className="bg-violet-500/8 border border-violet-500/20 rounded-2xl px-5 py-4 text-sm text-violet-300 flex items-center gap-3">
          <span className="text-2xl">💡</span>
          <span>Complete a sale in <b>POS</b> to see real-time reports here. Sample data shown below.</span>
        </div>
      )}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Revenue" value={BE.inr(rev||56000)} icon="💰" color="emerald"/>
        <StatCard label="GST" value={BE.inr(gst||9072)} icon="🏛️" color="violet"/>
        <StatCard label="Avg Bill" value={BE.inr(orders.length?rev/orders.length:1240)} icon="📊" color="blue"/>
        <StatCard label="Orders" value={orders.length||47} icon="🧾" color="amber"/>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-5">
          <h3 className="font-bold text-white mb-4">Payment Mode Breakdown</h3>
          <div className="space-y-3">
            {payD.map(p=>(
              <div key={p.mode}>
                <div className="flex justify-between text-xs mb-1.5"><div className="flex items-center gap-2"><Badge c={p.c}>{p.mode}</Badge><span className="text-slate-400">{p.count} txns</span></div><span className="font-mono font-bold text-white">{BE.inr(p.total)}</span></div>
                <div className="w-full bg-white/5 rounded-full h-1.5"><div className={`h-1.5 rounded-full bg-${p.c}-400 transition-all`} style={{width:`${(p.total/totalR)*100}%`}}/></div>
              </div>
            ))}
          </div>
        </Card>
        <Card className="p-5">
          <h3 className="font-bold text-white mb-4">Top Selling Items</h3>
          <div className="space-y-2.5">
            {topItems.map((item,i)=>(
              <div key={i} className="flex items-center gap-3">
                <span className="font-mono text-xs text-slate-600 w-4">{i+1}</span>
                <div className="flex-1"><p className="text-xs font-bold text-white">{item.name}</p><p className="text-xs text-slate-600">{item.qty} units sold</p></div>
                <span className="font-mono text-xs font-bold text-violet-400">{BE.inr(item.rev)}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3"><h3 className="font-bold text-white">GST Summary</h3><Badge c="blue">GSTR-1 Ready</Badge></div>
        <table className="w-full text-xs">
          <thead><tr className="border-b border-white/8">{["Tax Type","Taxable Amt","Amount","Rate"].map(h=><th key={h} className="pb-2.5 text-left font-bold text-slate-600 uppercase tracking-widest pr-3">{h}</th>)}</tr></thead>
          <tbody>
            {["CGST 9%","SGST 9%"].map((l,i)=>(
              <tr key={i} className="border-b border-white/4">
                <td className="py-2.5 text-white font-bold pr-3">{l}</td>
                <td className="py-2.5 font-mono text-slate-500 pr-3">{BE.inr((rev||56000)*0.82)}</td>
                <td className="py-2.5 font-mono text-violet-400 font-bold pr-3">{BE.inr((gst||9072)/2)}</td>
                <td className="py-2.5"><Badge c="blue">9%</Badge></td>
              </tr>
            ))}
            <tr className="bg-violet-500/5">
              <td className="py-2.5 text-white font-black pr-3">Total GST</td>
              <td className="py-2.5 font-mono text-white font-bold pr-3">{BE.inr((rev||56000)*0.82)}</td>
              <td className="py-2.5 font-mono text-violet-300 font-black pr-3">{BE.inr(gst||9072)}</td>
              <td className="py-2.5"><Badge c="violet">18%</Badge></td>
            </tr>
          </tbody>
        </table>
      </Card>
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3"><h3 className="font-bold text-white">All Orders</h3><Badge c="slate">{display.length}</Badge></div>
        <div className="space-y-2">
          {display.map((o,i)=>(
            <div key={i} className="flex items-center gap-3 px-3 py-2.5 bg-white/3 rounded-xl hover:bg-white/5 transition-all">
              <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center font-mono text-xs font-bold text-violet-300 shrink-0">#{i+1}</div>
              <div className="flex-1 min-w-0"><p className="font-mono text-xs font-bold text-white">{o.id}</p><p className="text-xs text-slate-600">{o.time} · {o.items?.length} items</p></div>
              <Badge c={o.payMode==="Cash"?"amber":o.payMode==="UPI"?"emerald":"blue"}>{o.payMode}</Badge>
              <span className="font-mono text-sm font-bold text-white shrink-0">{BE.inr(o.bill.total)}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   INVENTORY
══════════════════════════════════════════════════════════════ */
function InventoryPage(){
  const {user,notify}=useApp();
  const base=user?.businessType==="RETAIL"?RPRODS:RMENU.map(m=>({...m,stock:Math.floor(Math.random()*50+10),sku:"ITM"+m.id}));
  const [items,setItems]=useState(base);
  const [filter,setFilter]=useState("All");
  const [search,setSearch]=useState("");
  const [editItem,setEditItem]=useState(null);
  const cats=["All",...new Set(items.map(i=>i.cat))];
  const filtered=items.filter(i=>(filter==="All"||i.cat===filter)&&(!search||i.name.toLowerCase().includes(search.toLowerCase())));
  return(
    <div className="space-y-4 h-full overflow-y-auto pb-4 fade">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Total Items" value={items.length} icon="📦" color="violet"/>
        <StatCard label="Low Stock" value={items.filter(i=>(i.stock||0)<15).length} icon="⚠️" color="rose"/>
        <StatCard label="Categories" value={cats.length-1} icon="🏷️" color="amber"/>
        <StatCard label="Total Value" value={BE.inr(items.reduce((s,i)=>s+(i.price*(i.stock||0)),0))} icon="💰" color="emerald"/>
      </div>
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <div className="flex gap-1.5 flex-wrap">{cats.map(c=><button key={c} onClick={()=>setFilter(c)} className={clx("px-3 py-1.5 rounded-xl text-xs font-semibold transition-all",filter===c?"bg-violet-600 text-white":"bg-white/5 text-slate-500 hover:bg-white/8")}>{c}</button>)}</div>
          <Inp value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search..." icon="🔍" className="w-full sm:w-48"/>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead><tr className="border-b border-white/8">{["Item","SKU","Cat","Price","Stock","Status",""].map(h=><th key={h} className="pb-2.5 text-left font-bold text-slate-600 uppercase tracking-widest pr-3">{h}</th>)}</tr></thead>
            <tbody>{filtered.map(item=>{
              const s=item.stock||0;
              return(
                <tr key={item.id} className="border-b border-white/4 hover:bg-white/2 transition-all">
                  <td className="py-2.5 pr-3"><div className="flex items-center gap-1.5"><span>{item.emoji||"📦"}</span><span className="font-bold text-white">{item.name}</span></div></td>
                  <td className="py-2.5 pr-3 font-mono text-slate-500">{item.sku||item.id}</td>
                  <td className="py-2.5 pr-3"><Badge c="slate">{item.cat}</Badge></td>
                  <td className="py-2.5 pr-3 font-mono text-violet-400 font-bold">{BE.inr(item.price)}</td>
                  <td className="py-2.5 pr-3 font-mono text-white font-bold">{s}</td>
                  <td className="py-2.5 pr-3"><Badge c={s<5?"rose":s<15?"amber":"emerald"} dot>{s<5?"Critical":s<15?"Low":"OK"}</Badge></td>
                  <td className="py-2.5">
                    <div className="flex gap-1">
                      <Btn v="ghost" sz="xs" onClick={()=>setEditItem({...item})}>Edit</Btn>
                      <Btn v="suc" sz="xs" onClick={()=>{setItems(p=>p.map(i=>i.id===item.id?{...i,stock:(i.stock||0)+10}:i));notify(`+10 to ${item.name}`);}}>+10</Btn>
                    </div>
                  </td>
                </tr>
              );
            })}</tbody>
          </table>
        </div>
      </Card>
      <Modal open={!!editItem} onClose={()=>setEditItem(null)} title={`Edit — ${editItem?.name}`}>
        {editItem&&<div className="space-y-3">
          <Inp label="Name" value={editItem.name} onChange={e=>setEditItem({...editItem,name:e.target.value})}/>
          <div className="grid grid-cols-2 gap-3">
            <Inp label="Price" type="number" value={editItem.price} onChange={e=>setEditItem({...editItem,price:+e.target.value})}/>
            <Inp label="Stock" type="number" value={editItem.stock||0} onChange={e=>setEditItem({...editItem,stock:+e.target.value})}/>
          </div>
          <div className="flex gap-2">
            <Btn v="sec" full onClick={()=>setEditItem(null)}>Cancel</Btn>
            <Btn v="pri" full onClick={()=>{setItems(p=>p.map(i=>i.id===editItem.id?editItem:i));notify("✓ Updated!");setEditItem(null);}}>Save</Btn>
          </div>
        </div>}
      </Modal>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   CUSTOMERS
══════════════════════════════════════════════════════════════ */
function CustomersPage(){
  const {notify}=useApp();
  const [search,setSearch]=useState("");
  const [addModal,setAddModal]=useState(false);
  const [newC,setNewC]=useState({name:"",phone:"",email:"",type:"Regular"});
  const [customers,setCustomers]=useState([
    {id:1,name:"Rahul Sharma",phone:"9876543210",visits:14,total:18400,type:"VIP",last:"Today"},
    {id:2,name:"Priya Patel",phone:"9876543211",visits:8,total:9200,type:"Regular",last:"Yesterday"},
    {id:3,name:"Amit Kumar",phone:"9876543212",visits:22,total:28600,type:"VIP",last:"2 days ago"},
    {id:4,name:"Sunita Devi",phone:"9876543213",visits:5,total:4800,type:"New",last:"3 days ago"},
    {id:5,name:"Vijay Singh",phone:"9876543214",visits:17,total:21300,type:"VIP",last:"Today"},
  ]);
  const filtered=customers.filter(c=>!search||c.name.toLowerCase().includes(search.toLowerCase())||c.phone.includes(search));
  const totalRev=customers.reduce((s,c)=>s+c.total,0);
  return(
    <div className="space-y-4 h-full overflow-y-auto pb-4 fade">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Customers" value={customers.length} icon="👥" color="violet"/>
        <StatCard label="VIP" value={customers.filter(c=>c.type==="VIP").length} icon="⭐" color="amber"/>
        <StatCard label="Revenue" value={BE.inr(totalRev)} icon="💰" color="emerald"/>
        <StatCard label="Avg Spend" value={BE.inr(totalRev/customers.length)} icon="📊" color="blue"/>
      </div>
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <Inp value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search name or phone..." icon="🔍" className="w-full sm:w-64"/>
          <Btn v="pri" sz="sm" onClick={()=>setAddModal(true)} icon="➕">Add Customer</Btn>
        </div>
        <div className="space-y-2">
          {filtered.map(c=>(
            <div key={c.id} className="flex items-center gap-3 px-3 py-2.5 bg-white/3 rounded-xl hover:bg-white/5 transition-all">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600/50 to-indigo-600/50 flex items-center justify-center text-white font-bold text-sm shrink-0">{c.name[0]}</div>
              <div className="flex-1 min-w-0"><p className="text-sm font-bold text-white">{c.name}</p><p className="text-xs text-slate-500">📞 {c.phone}</p></div>
              <div className="text-right hidden sm:block"><p className="font-mono text-sm font-bold text-violet-300">{BE.inr(c.total)}</p><p className="text-xs text-slate-600">{c.last}</p></div>
              <Badge c={c.type==="VIP"?"amber":c.type==="Regular"?"emerald":"blue"} dot>{c.type}</Badge>
            </div>
          ))}
        </div>
      </Card>
      <Modal open={addModal} onClose={()=>setAddModal(false)} title="Add Customer">
        <div className="space-y-3">
          <Inp label="Full Name" value={newC.name} onChange={e=>setNewC({...newC,name:e.target.value})} icon="👤"/>
          <Inp label="Phone" value={newC.phone} onChange={e=>setNewC({...newC,phone:e.target.value})} icon="📞"/>
          <Inp label="Email" value={newC.email} onChange={e=>setNewC({...newC,email:e.target.value})} type="email" icon="✉️"/>
          <Sel label="Type" value={newC.type} onChange={e=>setNewC({...newC,type:e.target.value})} options={["New","Regular","VIP"]}/>
          <Btn v="pri" full onClick={()=>{
            if(!newC.name)return notify("Name required","error");
            setCustomers(p=>[...p,{id:Date.now(),...newC,visits:0,total:0,last:"Just now"}]);
            notify(`✓ ${newC.name} added!`);setAddModal(false);setNewC({name:"",phone:"",email:"",type:"Regular"});
          }}>Add Customer</Btn>
        </div>
      </Modal>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   SETTINGS
══════════════════════════════════════════════════════════════ */
function SettingsPage(){
  const {user,notify}=useApp();
  const [tab,setTab]=useState("profile");
  const [profile,setProfile]=useState({name:user?.businessName||"",email:user?.email||"",phone:user?.phone||"",gst:user?.gst||""});
  const [tax,setTax]=useState({cgst:"9",sgst:"9",svc:"0",roundOff:true});
  const [printer,setPrinter]=useState({width:"80mm",copies:"1",logo:true,footer:"Thank you for visiting!"});
  const [pwd,setPwd]=useState({cur:"",nw:"",cf:""});
  const tabs=[{id:"profile",l:"Business",i:"🏢"},{id:"tax",l:"Tax",i:"🧾"},{id:"printer",l:"Printer",i:"🖨️"},{id:"users",l:"Users",i:"👥"},{id:"security",l:"Security",i:"🔒"}];
  return(
    <div className="flex flex-col sm:flex-row gap-4 h-full overflow-hidden fade">
      <div className="flex sm:flex-col gap-1 overflow-x-auto sm:overflow-visible sm:w-44 shrink-0">
        {tabs.map(t=><button key={t.id} onClick={()=>setTab(t.id)} className={clx("flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap",tab===t.id?"bg-violet-600/25 text-white border border-violet-500/30":"text-slate-500 hover:text-white hover:bg-white/6")}><span>{t.i}</span><span className="hidden sm:inline">{t.l}</span></button>)}
      </div>
      <div className="flex-1 overflow-y-auto space-y-0">
        {tab==="profile"&&<Card className="p-5 space-y-4"><h3 className="font-bold text-white">Business Profile</h3><div className="flex items-center gap-3 p-3 bg-white/4 rounded-xl"><div className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-white font-black text-lg shrink-0">{profile.name?.[0]}</div><div><p className="font-bold text-white">{profile.name}</p><div className="flex gap-1 mt-0.5 flex-wrap"><Badge c={user?.businessType==="RESTAURANT"?"amber":user?.businessType==="HOTEL"?"blue":"violet"}>{user?.businessType}</Badge><Badge c="violet">{user?.plan}</Badge></div></div></div><div className="grid grid-cols-1 sm:grid-cols-2 gap-4"><Inp label="Business Name" value={profile.name} onChange={e=>setProfile({...profile,name:e.target.value})}/><Inp label="Email" value={profile.email} onChange={e=>setProfile({...profile,email:e.target.value})} type="email"/><Inp label="Phone" value={profile.phone} onChange={e=>setProfile({...profile,phone:e.target.value})}/><Inp label="GST Number" value={profile.gst} onChange={e=>setProfile({...profile,gst:e.target.value})}/></div><Btn v="pri" sz="md" onClick={()=>notify("✓ Profile saved!")} icon="💾">Save Changes</Btn></Card>}
        {tab==="tax"&&<Card className="p-5 space-y-4"><h3 className="font-bold text-white">Tax Config</h3><div className="grid grid-cols-1 sm:grid-cols-2 gap-4"><Inp label="CGST %" type="number" value={tax.cgst} onChange={e=>setTax({...tax,cgst:e.target.value})} hint="Central GST"/><Inp label="SGST %" type="number" value={tax.sgst} onChange={e=>setTax({...tax,sgst:e.target.value})} hint="State GST"/><Inp label="Service Charge %" type="number" value={tax.svc} onChange={e=>setTax({...tax,svc:e.target.value})}/></div><div className="flex items-center gap-3 p-3 bg-white/4 rounded-xl cursor-pointer" onClick={()=>setTax({...tax,roundOff:!tax.roundOff})}><div className={clx("w-10 h-5 rounded-full transition-all flex items-center px-0.5 shrink-0",tax.roundOff?"bg-violet-600":"bg-white/10")}><div className={clx("w-4 h-4 rounded-full bg-white shadow transition-all",tax.roundOff?"translate-x-5":"")}/></div><div><p className="text-sm font-bold text-white">Round Off Total</p><p className="text-xs text-slate-500">Round to nearest ₹</p></div></div><Btn v="pri" sz="md" onClick={()=>notify("✓ Saved!")} icon="💾">Save</Btn></Card>}
        {tab==="printer"&&<Card className="p-5 space-y-4"><h3 className="font-bold text-white">Printer</h3><div className="grid grid-cols-2 gap-4"><Sel label="Paper Width" value={printer.width} onChange={e=>setPrinter({...printer,width:e.target.value})} options={["58mm","80mm","A4"]}/><Sel label="Copies" value={printer.copies} onChange={e=>setPrinter({...printer,copies:e.target.value})} options={["1","2","3"]}/></div><Inp label="Footer" value={printer.footer} onChange={e=>setPrinter({...printer,footer:e.target.value})}/><div className="flex items-center gap-3 p-3 bg-white/4 rounded-xl cursor-pointer" onClick={()=>setPrinter({...printer,logo:!printer.logo})}><div className={clx("w-10 h-5 rounded-full transition-all flex items-center px-0.5 shrink-0",printer.logo?"bg-violet-600":"bg-white/10")}><div className={clx("w-4 h-4 rounded-full bg-white shadow transition-all",printer.logo?"translate-x-5":"")}/></div><p className="text-sm font-bold text-white">Print Logo</p></div><Btn v="pri" sz="md" onClick={()=>notify("✓ Saved!")} icon="💾">Save</Btn></Card>}
        {tab==="users"&&<Card className="p-5 space-y-4"><div className="flex items-center justify-between"><h3 className="font-bold text-white">Team</h3><Btn v="pri" sz="sm" icon="➕">Add User</Btn></div>{[{name:"Admin",role:"Owner",email:user?.email,s:"active"},{name:"Cashier",role:"Cashier",email:"cashier@biz.com",s:"active"},{name:"Manager",role:"Manager",email:"manager@biz.com",s:"inactive"}].map((u,i)=><div key={i} className="flex items-center gap-3 p-3 bg-white/4 rounded-xl"><div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-white font-bold shrink-0">{u.name[0]}</div><div className="flex-1 min-w-0"><p className="text-sm font-bold text-white">{u.name}</p><p className="text-xs text-slate-500 truncate">{u.email}</p></div><Badge c="slate">{u.role}</Badge><Badge c={u.s==="active"?"emerald":"slate"} dot>{u.s}</Badge></div>)}</Card>}
        {tab==="security"&&<Card className="p-5 space-y-4"><h3 className="font-bold text-white">Change Password</h3><PwdInp label="Current Password" value={pwd.cur} onChange={e=>setPwd({...pwd,cur:e.target.value})} placeholder="Current password"/><PwdInp label="New Password" value={pwd.nw} onChange={e=>setPwd({...pwd,nw:e.target.value})} placeholder="Min 8 characters"/><PwdInp label="Confirm Password" value={pwd.cf} onChange={e=>setPwd({...pwd,cf:e.target.value})} placeholder="Repeat new password"/><div className="p-3 bg-amber-500/8 border border-amber-500/20 rounded-xl"><p className="text-xs text-amber-300 font-bold">⚠ Enable 2FA for extra security</p></div><Btn v="pri" sz="md" onClick={()=>{if(pwd.nw!==pwd.cf)return notify("Passwords don't match","error");if(pwd.nw.length<8)return notify("Min 8 characters","error");notify("✓ Password updated!");setPwd({cur:"",nw:"",cf:""}); }} icon="🔒">Update Password</Btn></Card>}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   LODGE REGISTER PAGE (full check-in/out log)
══════════════════════════════════════════════════════════════ */
function LodgeRegisterPage(){
  const [entries]=useState([
    {type:"checkin",room:3,guest:"Ramesh Kumar",phone:"9876540001",idType:"Aadhaar",idNo:"XXXX-XXXX-1234",purpose:"Travel",nights:2,advance:400,time:"Today, 10:30 AM",pax:1},
    {type:"checkin",room:7,guest:"Sunita Devi",phone:"9876540002",idType:"Voter ID",idNo:"ABC1234567",purpose:"Pilgrimage",nights:1,advance:200,time:"Today, 11:15 AM",pax:2},
    {type:"checkout",room:2,guest:"Amit Singh",phone:"9876540003",idType:"DL",idNo:"DL0420110012345",purpose:"Business",nights:1,advance:350,balance:350,time:"Today, 12:00 PM",pax:1},
    {type:"checkin",room:11,guest:"Priya Sharma",phone:"9876540004",idType:"Passport",idNo:"P1234567",purpose:"Tourism",hours:6,rateType:"hourly",advance:100,time:"Today, 01:30 PM",pax:1},
  ]);
  const totalAdv=entries.filter(e=>e.type==="checkin").reduce((s,e)=>s+(e.advance||0),0);
  const totalBal=entries.filter(e=>e.type==="checkout").reduce((s,e)=>s+(e.balance||0),0);
  return(
    <div className="space-y-4 h-full overflow-y-auto pb-4 fade">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Check-ins Today" value={entries.filter(e=>e.type==="checkin").length} icon="✅" color="emerald"/>
        <StatCard label="Check-outs" value={entries.filter(e=>e.type==="checkout").length} icon="🚪" color="rose"/>
        <StatCard label="Advance Collected" value={BE.inr(totalAdv)} icon="💰" color="amber"/>
        <StatCard label="Balance Collected" value={BE.inr(totalBal)} icon="🏦" color="violet"/>
      </div>
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-white">Guest Register — Today</h3>
          <Btn v="sec" sz="sm" icon="📥">Export PDF</Btn>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-white/8">
                {["Room","Guest","Phone","ID Proof","Purpose","Stay","Advance","Status","Time"].map(h=>(
                  <th key={h} className="pb-2.5 text-left font-bold text-slate-600 uppercase tracking-wider pr-3 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {entries.map((e,i)=>(
                <tr key={i} className="border-b border-white/4 hover:bg-white/3 transition-all">
                  <td className="py-2.5 pr-3 font-mono font-black text-white">{e.room}</td>
                  <td className="py-2.5 pr-3 font-bold text-white whitespace-nowrap">{e.guest}</td>
                  <td className="py-2.5 pr-3 font-mono text-slate-400">{e.phone}</td>
                  <td className="py-2.5 pr-3">
                    <div className="text-slate-300">{e.idType}</div>
                    <div className="text-slate-600 font-mono">{e.idNo}</div>
                  </td>
                  <td className="py-2.5 pr-3"><Badge c="slate">{e.purpose}</Badge></td>
                  <td className="py-2.5 pr-3 font-mono text-slate-300 whitespace-nowrap">
                    {e.rateType==="hourly"?e.hours+"h":e.nights+"N"} · {e.pax} pax
                  </td>
                  <td className="py-2.5 pr-3 font-mono font-bold text-emerald-300">{BE.inr(e.advance)}</td>
                  <td className="py-2.5 pr-3">
                    <Badge c={e.type==="checkin"?"emerald":"rose"} dot>{e.type==="checkin"?"Checked In":"Checked Out"}</Badge>
                  </td>
                  <td className="py-2.5 text-slate-500 whitespace-nowrap">{e.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <Card className="p-4">
        <h3 className="font-bold text-white mb-3 text-sm">Police Register Summary</h3>
        <div className="bg-amber-500/8 border border-amber-500/20 rounded-xl p-3 text-xs text-amber-300">
          <p className="font-bold mb-1">⚠️ Form C Compliance</p>
          <p className="text-slate-400">All foreign nationals and guests must fill Form C within 24 hours of check-in. Aadhaar/ID proof mandatory for all guests as per local police requirements.</p>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
          <div className="bg-white/3 rounded-xl p-3">
            <p className="text-slate-500 mb-1">Total Guests Today</p>
            <p className="font-mono font-black text-white text-lg">{entries.reduce((s,e)=>s+(e.pax||1),0)}</p>
          </div>
          <div className="bg-white/3 rounded-xl p-3">
            <p className="text-slate-500 mb-1">Occupied Rooms</p>
            <p className="font-mono font-black text-white text-lg">{entries.filter(e=>e.type==="checkin").length}</p>
          </div>
        </div>
      </Card>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   LOGIN
══════════════════════════════════════════════════════════════ */
function LoginPage(){
  const {login,notify}=useApp();
  const [email,setEmail]=useState("");
  const [pass,setPass]=useState("");
  const [loading,setLoading]=useState(false);

  const doLogin=async()=>{
    if(!email)return notify("Please enter your email","error");
    if(!pass) return notify("Please enter your password","error");
    setLoading(true);
    await new Promise(r=>setTimeout(r,600));
    const u=MOCK_USERS.find(u=>u.email===email&&u.password===pass);
    if(u){login(u);notify(`Welcome, ${u.businessName}! ✓`);}
    else notify("Incorrect email or password","error");
    setLoading(false);
  };

  const demos=[
    {label:"🍽️ Restaurant",sub:"Spice Garden",     email:"admin@spicegarden.com",from:"from-orange-600/25",to:"to-red-600/25",    border:"border-orange-500/30"},
    {label:"🏨 Hotel",     sub:"Grand Azure",      email:"admin@grandazure.com", from:"from-blue-600/25",  to:"to-cyan-600/25",   border:"border-blue-500/30"},
    {label:"🛒 Retail",   sub:"QuickMart",         email:"admin@quickmart.com",  from:"from-violet-600/25",to:"to-indigo-600/25", border:"border-violet-500/30"},
    {label:"🏠 Lodge",    sub:"Shanti Lodge",      email:"admin@shantilodge.com",from:"from-teal-600/25",  to:"to-emerald-600/25",border:"border-teal-500/30"},
  ];

  return(
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden" style={{background:"#090c14"}}>
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/4 w-96 h-96 rounded-full blur-3xl" style={{background:"rgba(109,40,217,0.1)"}}/>
        <div className="absolute bottom-1/3 right-1/4 w-80 h-80 rounded-full blur-3xl" style={{background:"rgba(79,70,229,0.08)"}}/>
        {[1,2,3].map(i=><div key={i} className="absolute border border-white/[0.04] rounded-full" style={{width:`${i*220}px`,height:`${i*220}px`,top:"50%",left:"50%",transform:"translate(-50%,-50%)"}}/>)}
      </div>

      <div className="w-full max-w-sm relative fade">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4" style={{background:"linear-gradient(135deg,#7c3aed,#4338ca)",boxShadow:"0 0 40px rgba(124,58,237,0.35)"}}>
            <span className="text-3xl">⚡</span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">Zippy Bot</h1>
          <p className="text-slate-500 text-sm mt-1">Multi-Tenant Billing · GST Ready POS</p>
        </div>

        <Card className="p-6 space-y-4 mb-4">
          {/* Email — always fully visible */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Email Address</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm pointer-events-none">✉️</span>
              <input type="email" value={email} onChange={e=>setEmail(e.target.value)}
                placeholder="you@business.com" autoComplete="username"
                className="w-full bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-700 focus:outline-none focus:border-violet-500/60 transition-all text-sm pl-9 pr-4 py-3"/>
            </div>
            {email&&(
              <div className="flex items-center gap-2 px-2 py-1.5 bg-violet-500/8 border border-violet-500/15 rounded-xl">
                <span className="text-sm">👤</span>
                <span className="text-xs text-slate-400">Logging in as: </span>
                <span className="text-xs text-white font-bold truncate">{email}</span>
              </div>
            )}
          </div>

          {/* Password — hidden, with show/hide */}
          <PwdInp label="Password" value={pass} onChange={e=>setPass(e.target.value)} onKeyDown={e=>e.key==="Enter"&&doLogin()} placeholder="Enter your password"/>

          <Btn v="pri" sz="lg" full disabled={loading} onClick={doLogin}>
            {loading?"Authenticating...":"Sign In →"}
          </Btn>
        </Card>

        <p className="text-center text-xs text-slate-700 mb-3 uppercase tracking-widest">Quick Demo · password: demo</p>
        <div className="grid grid-cols-2 gap-2 mb-4">
          {demos.map(d=>(
            <button key={d.email} onClick={()=>{setEmail(d.email);setPass("demo");}}
              className={clx("bg-gradient-to-br border rounded-xl p-3 text-center transition-all active:scale-95 hover:scale-105",d.from,d.to,d.border)}>
              <p className="text-sm font-black text-white">{d.label}</p>
              <p className="text-xs text-slate-400 mt-0.5">{d.sub}</p>
            </button>
          ))}
        </div>
        <p className="text-center text-xs text-slate-700">Secured · GST Compliant · Multi-Tenant</p>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   APP SHELL
══════════════════════════════════════════════════════════════ */
/* ══════════════════════════════════════════════════════════════
   LODGE DATA
══════════════════════════════════════════════════════════════ */
const LODGE_ROOMS = Array.from({length:20},(_,i)=>({
  id: i+1,
  type: ["Single","Double","Triple","Dormitory"][Math.floor(i/5)],
  rateDaily:  [350,550,750,200][Math.floor(i/5)],
  rateHourly: [80,120,160,50][Math.floor(i/5)],
  floor: Math.floor(i/10)+1,
  ac: i%3===0,
  status: ["available","occupied","reserved","occupied","available","cleaning","available","occupied","available","available"][i%10],
  guest: i%3===1 ? {
    name:`Guest ${i+1}`, phone:"98765"+String(i).padStart(5,"0"),
    idType:["Aadhaar","Passport","DL","VoterId"][i%4],
    idNo:"ID"+String(i*1234).padStart(8,"0"),
    purpose:["Travel","Business","Pilgrimage","Tourism"][i%4],
    checkIn: new Date(Date.now()-i*3600000).toISOString(),
    rateType:"daily", nights:1, advance:200,
    pax:i%2===0?1:2,
  } : null,
}));

const LODGE_SERVICES = [
  {id:"ls1",name:"Extra Blanket",  price:50,  emoji:"🛏️"},
  {id:"ls2",name:"Laundry",        price:60,  emoji:"👕"},
  {id:"ls3",name:"Drinking Water", price:20,  emoji:"🚰"},
  {id:"ls4",name:"Iron",           price:30,  emoji:"🏷️"},
  {id:"ls5",name:"Breakfast",      price:80,  emoji:"🥞"},
  {id:"ls6",name:"Veg Meal",       price:60,  emoji:"🍱"},
  {id:"ls7",name:"Non-Veg Meal",   price:90,  emoji:"🍗"},
  {id:"ls8",name:"Tea/Coffee",     price:15,  emoji:"☕"},
];

/* ══════════════════════════════════════════════════════════════
   LODGE MANAGER
══════════════════════════════════════════════════════════════ */
function LodgeManager(){
  const {addToCart,notify,cart,setQty}=useApp();
  const [rooms,setRooms]=useState(LODGE_ROOMS);
  const [sel,setSel]=useState(null);
  const [ciModal,setCiModal]=useState(false);
  const [logModal,setLogModal]=useState(false);
  const [tab,setTab]=useState("rooms"); // mobile tabs
  const [filter,setFilter]=useState("All");
  const [checkLog,setCheckLog]=useState([]);

  const [guest,setGuest]=useState({
    name:"",phone:"",idType:"Aadhaar",idNo:"",
    purpose:"Travel",rateType:"daily",nights:1,hours:6,
    advance:0,pax:1,remarks:"",
  });

  const stC={
    available:"border-emerald-500/30 bg-emerald-500/8",
    occupied: "border-rose-500/30 bg-rose-500/8",
    reserved: "border-amber-500/30 bg-amber-500/8",
    cleaning: "border-blue-500/30 bg-blue-500/8",
  };
  const stT={available:"text-emerald-300",occupied:"text-rose-300",reserved:"text-amber-300",cleaning:"text-blue-300"};

  const selRoom = sel ? rooms.find(r=>r.id===sel.id)||sel : null;

  const roomCharge=(room,g)=>{
    if(!room||!g) return 0;
    return g.rateType==="hourly" ? room.rateHourly*(g.hours||1) : room.rateDaily*(g.nights||1);
  };

  const balance=(room,g)=>roomCharge(room,g)-(g?.advance||0);

  const filteredRooms = filter==="All" ? rooms : rooms.filter(r=>r.status===filter);

  const doCheckIn=()=>{
    if(!guest.name) return notify("Enter guest name","error");
    if(!guest.phone||guest.phone.length<10) return notify("Enter valid phone","error");
    if(!guest.idNo) return notify("Enter ID proof number","error");
    const updated={...selRoom,status:"occupied",guest:{...guest,checkIn:new Date().toISOString()}};
    setRooms(p=>p.map(r=>r.id===selRoom.id?updated:r));
    setSel(updated);
    setCheckLog(p=>[{type:"checkin",room:selRoom.id,guest:guest.name,time:BE.now(),advance:guest.advance},...p]);
    notify(`✓ ${guest.name} checked into Room ${selRoom.id}!`);
    setCiModal(false);
    setGuest({name:"",phone:"",idType:"Aadhaar",idNo:"",purpose:"Travel",rateType:"daily",nights:1,hours:6,advance:0,pax:1,remarks:""});
  };

  const doCheckOut=(room)=>{
    const bal=balance(room,room.guest);
    const updated={...room,status:"cleaning",guest:null};
    setRooms(p=>p.map(r=>r.id===room.id?updated:r));
    if(sel?.id===room.id) setSel(updated);
    setCheckLog(p=>[{type:"checkout",room:room.id,guest:room.guest?.name,time:BE.now(),balance:bal},...p]);
    notify(`Room ${room.id} checked out. Balance: ${BE.inr(bal)}`);
  };

  const markReady=(room)=>{
    const updated={...room,status:"available"};
    setRooms(p=>p.map(r=>r.id===room.id?updated:r));
    if(sel?.id===room.id) setSel(updated);
    notify(`Room ${room.id} marked ready!`);
  };

  const occupied=rooms.filter(r=>r.status==="occupied").length;
  const available=rooms.filter(r=>r.status==="available").length;

  /* ── Room Grid ── */
  const RoomGrid=()=>(
    <div className="space-y-3 h-full overflow-y-auto">
      {/* Stats row */}
      <div className="grid grid-cols-4 gap-2">
        {[{l:"Total",v:rooms.length,c:"slate"},{l:"Occupied",v:occupied,c:"rose"},{l:"Available",v:available,c:"emerald"},{l:"Cleaning",v:rooms.filter(r=>r.status==="cleaning").length,c:"amber"}].map((s,i)=>(
          <div key={i} className={`bg-${s.c==="slate"?"white/4":s.c+"-500/10"} border border-${s.c==="slate"?"white/8":s.c+"-500/20"} rounded-xl p-2.5 text-center`}>
            <div className="font-mono text-lg font-black text-white">{s.v}</div>
            <div className="text-xs text-slate-500">{s.l}</div>
          </div>
        ))}
      </div>
      {/* Filter */}
      <div className="flex gap-1.5 flex-wrap">
        {["All","available","occupied","reserved","cleaning"].map(f=>(
          <button key={f} onClick={()=>setFilter(f)}
            className={clx("px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all",filter===f?"bg-violet-600 text-white":"bg-white/5 text-slate-400 hover:bg-white/8")}>{f}</button>
        ))}
      </div>
      {/* Grid */}
      <div className="grid grid-cols-4 sm:grid-cols-5 gap-1.5">
        {filteredRooms.map(r=>(
          <button key={r.id} onClick={()=>{setSel(r);setTab("detail");}}
            className={clx("rounded-xl border py-2.5 text-center transition-all",stC[r.status],sel?.id===r.id&&"ring-2 ring-violet-500 ring-offset-1 ring-offset-[#0d1220]")}>
            <div className={clx("text-sm font-black",stT[r.status])}>{r.id}</div>
            <div className="text-[9px] text-slate-600">{r.type.slice(0,3)}{r.ac?"❄":"  "}</div>
            {r.guest&&<div className="text-[9px] text-slate-500 px-0.5 truncate">{r.guest.name.split(" ")[0]}</div>}
          </button>
        ))}
      </div>
    </div>
  );

  /* ── Room Detail ── */
  const RoomDetail=()=>(
    <div className="space-y-3 overflow-y-auto h-full">
      {selRoom?(
        <>
          {/* Room info card */}
          <Card className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-black text-white text-xl">Room {selRoom.id}</h3>
                <p className="text-sm text-slate-500">{selRoom.type} · Floor {selRoom.floor} {selRoom.ac&&"· ❄️ AC"}</p>
              </div>
              <Badge c={selRoom.status==="available"?"emerald":selRoom.status==="occupied"?"rose":selRoom.status==="cleaning"?"blue":"amber"} dot>{selRoom.status}</Badge>
            </div>

            {/* Rate info */}
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div className="bg-emerald-500/8 border border-emerald-500/20 rounded-xl p-2.5 text-center">
                <div className="font-mono text-base font-black text-emerald-300">{BE.inr(selRoom.rateDaily)}</div>
                <div className="text-xs text-slate-500">Per Day</div>
              </div>
              <div className="bg-blue-500/8 border border-blue-500/20 rounded-xl p-2.5 text-center">
                <div className="font-mono text-base font-black text-blue-300">{BE.inr(selRoom.rateHourly)}</div>
                <div className="text-xs text-slate-500">Per Hour</div>
              </div>
            </div>

            {/* Guest info if occupied */}
            {selRoom.guest&&(
              <div className="bg-white/4 rounded-xl p-3 mb-3 space-y-1.5">
                <div className="flex items-center justify-between">
                  <p className="text-white font-black text-sm">{selRoom.guest.name}</p>
                  <Badge c="violet">{selRoom.guest.pax} pax</Badge>
                </div>
                <p className="text-xs text-slate-400">📞 {selRoom.guest.phone}</p>
                <p className="text-xs text-slate-400">🪪 {selRoom.guest.idType}: {selRoom.guest.idNo}</p>
                <p className="text-xs text-slate-400">🎯 Purpose: {selRoom.guest.purpose}</p>
                <p className="text-xs text-slate-400">🕐 Check-in: {new Date(selRoom.guest.checkIn).toLocaleString("en-IN",{day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit"})}</p>
                <div className="border-t border-white/8 pt-2 grid grid-cols-3 gap-2 text-center">
                  <div>
                    <div className="font-mono text-sm font-black text-white">{selRoom.guest.rateType==="hourly"?selRoom.guest.hours+"h":selRoom.guest.nights+"N"}</div>
                    <div className="text-xs text-slate-600">Stay</div>
                  </div>
                  <div>
                    <div className="font-mono text-sm font-black text-emerald-300">{BE.inr(selRoom.guest.advance)}</div>
                    <div className="text-xs text-slate-600">Advance</div>
                  </div>
                  <div>
                    <div className="font-mono text-sm font-black text-amber-300">{BE.inr(balance(selRoom,selRoom.guest))}</div>
                    <div className="text-xs text-slate-600">Balance</div>
                  </div>
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-2">
              {selRoom.status==="available"&&<Btn v="suc" full onClick={()=>setCiModal(true)} icon="✅">Walk-in / Check In</Btn>}
              {selRoom.status==="reserved" &&<Btn v="suc" full onClick={()=>setCiModal(true)} icon="✅">Check In Guest</Btn>}
              {selRoom.status==="occupied" &&<Btn v="dng" full onClick={()=>doCheckOut(selRoom)} icon="🚪">Check Out & Collect</Btn>}
              {selRoom.status==="cleaning" &&<Btn v="wrn" full onClick={()=>markReady(selRoom)} icon="✅">Mark Room Ready</Btn>}
            </div>
          </Card>

          {/* Add-on services */}
          <Card className="p-4">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Add Services / Extras</p>
            <div className="grid grid-cols-2 gap-2">
              {LODGE_SERVICES.map(s=>{
                const inCart=cart.find(c=>c.id===s.id);
                return(
                  <div key={s.id} className={clx("border rounded-xl p-2.5 transition-all",inCart?"border-violet-500/40 bg-violet-500/5":"border-white/8 bg-white/3 hover:border-violet-400/30")}>
                    <div className="flex items-center justify-between">
                      <span className="text-base">{s.emoji}</span>
                      <span className="font-mono text-xs font-black text-violet-400">{BE.inr(s.price)}</span>
                    </div>
                    <p className="text-xs font-bold text-white mt-1">{s.name}</p>
                    {inCart?(
                      <div className="flex items-center gap-1 mt-1.5 bg-white/5 rounded-lg p-0.5">
                        <button onClick={()=>setQty(s.id,inCart.qty-1)} className="w-6 h-6 rounded-md bg-white/8 hover:bg-rose-500/20 text-white flex items-center justify-center font-bold text-sm">−</button>
                        <span className="font-mono font-bold text-white text-xs flex-1 text-center">{inCart.qty}</span>
                        <button onClick={()=>addToCart(s)} className="w-6 h-6 rounded-md bg-white/8 hover:bg-emerald-500/20 text-white flex items-center justify-center font-bold text-sm">+</button>
                      </div>
                    ):(
                      <button onClick={()=>{
                        if(selRoom.status!=="occupied") return notify("Check in a guest first","error");
                        addToCart(s); notify(`${s.emoji} ${s.name} added`);
                      }} className="mt-1.5 w-full bg-violet-600/20 hover:bg-violet-600/40 border border-violet-500/30 text-violet-300 text-[10px] font-bold py-1 rounded-lg transition-all">+ Add</button>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
        </>
      ):(
        <Card className="h-48 flex items-center justify-center">
          <div className="text-center"><div className="text-4xl mb-2">🏠</div><p className="text-sm text-slate-600">Select a room</p></div>
        </Card>
      )}
    </div>
  );

  /* ── Check-in Log ── */
  const CheckLog=()=>(
    <div className="space-y-3 overflow-y-auto h-full">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-white text-sm">Today's Register</h3>
        <Badge c="slate">{checkLog.length} entries</Badge>
      </div>
      {checkLog.length===0?(
        <Card className="p-8 text-center">
          <div className="text-4xl mb-2">📋</div>
          <p className="text-slate-600 text-sm">No check-ins today</p>
        </Card>
      ):checkLog.map((entry,i)=>(
        <div key={i} className={clx("flex items-center gap-3 px-4 py-3 rounded-xl border",entry.type==="checkin"?"bg-emerald-500/5 border-emerald-500/20":"bg-rose-500/5 border-rose-500/20")}>
          <div className={clx("w-8 h-8 rounded-lg flex items-center justify-center text-lg shrink-0",entry.type==="checkin"?"bg-emerald-500/20":"bg-rose-500/20")}>
            {entry.type==="checkin"?"✅":"🚪"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-white">{entry.guest}</p>
            <p className="text-xs text-slate-500">Room {entry.room} · {entry.time}</p>
          </div>
          <div className="text-right">
            {entry.type==="checkin"&&entry.advance>0&&<p className="font-mono text-xs text-emerald-300 font-bold">Adv: {BE.inr(entry.advance)}</p>}
            {entry.type==="checkout"&&<p className="font-mono text-xs text-amber-300 font-bold">Bal: {BE.inr(entry.balance)}</p>}
            <Badge c={entry.type==="checkin"?"emerald":"rose"}>{entry.type==="checkin"?"IN":"OUT"}</Badge>
          </div>
        </div>
      ))}
    </div>
  );

  return(
    <>
      {/* ── MOBILE ── */}
      <div className="flex flex-col h-full md:hidden">
        <div className="flex border-b border-white/8 shrink-0 bg-black/20">
          {[["rooms","🏠 Rooms"],["detail","🛏️ Detail"],["bill","🧾 Bill"],["log","📋 Log"]].map(([v,l])=>(
            <button key={v} onClick={()=>setTab(v)} className={clx("flex-1 py-3 text-[10px] font-bold transition-all",tab===v?"text-violet-300 border-b-2 border-violet-500":"text-slate-600")}>{l}</button>
          ))}
        </div>
        <div className="flex-1 overflow-hidden p-3">
          {tab==="rooms"  && <RoomGrid/>}
          {tab==="detail" && <RoomDetail/>}
          {tab==="bill"   && <CartPanel title={selRoom?`Bill — Rm ${selRoom.id}`:"Lodge Bill"} extraCharges={selRoom?.guest?roomCharge(selRoom,selRoom.guest):0} extraLabel="Room Charges"/>}
          {tab==="log"    && <CheckLog/>}
        </div>
      </div>

      {/* ── DESKTOP ── */}
      <div className="hidden md:grid grid-cols-12 gap-4 h-full overflow-hidden">
        {/* Left: room grid */}
        <div className="col-span-4 flex flex-col gap-3 overflow-hidden">
          <RoomGrid/>
        </div>

        {/* Middle: detail + log */}
        <div className="col-span-4 flex flex-col gap-3 overflow-hidden">
          <div className="flex-1 overflow-hidden"><RoomDetail/></div>
          <Card className="p-3 shrink-0 max-h-48 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-2 shrink-0">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Today's Log</p>
              <Badge c="slate">{checkLog.length}</Badge>
            </div>
            <div className="overflow-y-auto space-y-1.5 flex-1">
              {checkLog.length===0?<p className="text-xs text-slate-700 text-center py-2">No activity yet</p>:
              checkLog.slice(0,5).map((e,i)=>(
                <div key={i} className="flex items-center gap-2 text-xs">
                  <span>{e.type==="checkin"?"✅":"🚪"}</span>
                  <span className="text-white font-semibold truncate flex-1">{e.guest}</span>
                  <span className="text-slate-600">R{e.room}</span>
                  <Badge c={e.type==="checkin"?"emerald":"rose"}>{e.type==="checkin"?"IN":"OUT"}</Badge>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Right: bill */}
        <div className="col-span-4 overflow-hidden">
          <CartPanel
            title={selRoom?`Bill — Room ${selRoom.id}`:"Lodge Bill"}
            extraCharges={selRoom?.guest?roomCharge(selRoom,selRoom.guest):0}
            extraLabel={selRoom?.guest?`Room (${selRoom.guest.rateType==="hourly"?selRoom.guest.hours+"h":selRoom.guest.nights+"N"})`:"Room Charges"}
          />
        </div>
      </div>

      {/* ── CHECK-IN MODAL ── */}
      <Modal open={ciModal} onClose={()=>setCiModal(false)} title={`Walk-in Check In — Room ${selRoom?.id}`} wide>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Guest info */}
          <div className="sm:col-span-2">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Guest Details</p>
          </div>
          <Inp label="Full Name *" value={guest.name} onChange={e=>setGuest({...guest,name:e.target.value})} placeholder="As per ID" icon="👤"/>
          <Inp label="Mobile No. *" value={guest.phone} onChange={e=>setGuest({...guest,phone:e.target.value})} placeholder="10-digit" icon="📞" type="tel"/>

          {/* ID Proof */}
          <div className="sm:col-span-2">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 mt-2">ID Proof (Mandatory)</p>
          </div>
          <Sel label="ID Type *" value={guest.idType} onChange={e=>setGuest({...guest,idType:e.target.value})} options={["Aadhaar","Passport","Driving Licence","Voter ID","PAN Card"]}/>
          <Inp label="ID Number *" value={guest.idNo} onChange={e=>setGuest({...guest,idNo:e.target.value})} placeholder="Enter ID number" icon="🪪"/>

          {/* Stay details */}
          <div className="sm:col-span-2">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 mt-2">Stay Details</p>
          </div>
          <Sel label="Rate Type" value={guest.rateType} onChange={e=>setGuest({...guest,rateType:e.target.value})} options={[{v:"daily",l:"Daily Rate"},{v:"hourly",l:"Hourly Rate"}]}/>
          {guest.rateType==="daily"
            ?<Inp label="No. of Nights" type="number" value={guest.nights} onChange={e=>setGuest({...guest,nights:Math.max(1,+e.target.value)})} icon="🌙"/>
            :<Inp label="No. of Hours" type="number" value={guest.hours} onChange={e=>setGuest({...guest,hours:Math.max(1,+e.target.value)})} icon="⏰"/>
          }
          <Sel label="Purpose of Visit" value={guest.purpose} onChange={e=>setGuest({...guest,purpose:e.target.value})} options={["Travel","Business","Pilgrimage","Tourism","Medical","Other"]}/>
          <Inp label="No. of Guests (Pax)" type="number" value={guest.pax} onChange={e=>setGuest({...guest,pax:Math.max(1,+e.target.value)})} icon="👥"/>

          {/* Payment */}
          <div className="sm:col-span-2">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 mt-2">Advance Payment</p>
          </div>
          <Inp label="Advance Collected (₹)" type="number" value={guest.advance} onChange={e=>setGuest({...guest,advance:Math.max(0,+e.target.value)})} placeholder="0" icon="💰"/>
          <Inp label="Remarks" value={guest.remarks} onChange={e=>setGuest({...guest,remarks:e.target.value})} placeholder="Any special note" icon="📝"/>

          {/* Charge summary */}
          {selRoom&&(
            <div className="sm:col-span-2 bg-white/4 border border-white/8 rounded-xl p-3">
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <div className="font-mono text-sm font-black text-white">{BE.inr(guest.rateType==="hourly"?selRoom.rateHourly*(guest.hours||1):selRoom.rateDaily*(guest.nights||1))}</div>
                  <div className="text-xs text-slate-500">Room Charge</div>
                </div>
                <div>
                  <div className="font-mono text-sm font-black text-emerald-300">{BE.inr(guest.advance||0)}</div>
                  <div className="text-xs text-slate-500">Advance</div>
                </div>
                <div>
                  <div className="font-mono text-sm font-black text-amber-300">{BE.inr(Math.max(0,(guest.rateType==="hourly"?selRoom.rateHourly*(guest.hours||1):selRoom.rateDaily*(guest.nights||1))-(guest.advance||0)))}</div>
                  <div className="text-xs text-slate-500">Balance Due</div>
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="flex gap-2 mt-4">
          <Btn v="sec" onClick={()=>setCiModal(false)} full>Cancel</Btn>
          <Btn v="suc" onClick={doCheckIn} full icon="✅">Confirm Check In</Btn>
        </div>
      </Modal>
    </>
  );
}

const NAV={
  RESTAURANT:[{id:"dashboard",l:"Dashboard",i:"⚡"},{id:"pos",l:"POS",i:"🍽️"},{id:"inventory",l:"Menu",i:"📋"},{id:"customers",l:"Customers",i:"👥"},{id:"reports",l:"Reports",i:"📊"},{id:"settings",l:"Settings",i:"⚙️"}],
  HOTEL:     [{id:"dashboard",l:"Dashboard",i:"⚡"},{id:"pos",l:"Rooms",i:"🏨"},{id:"inventory",l:"Services",i:"🛎️"},{id:"customers",l:"Guests",i:"👥"},{id:"reports",l:"Reports",i:"📊"},{id:"settings",l:"Settings",i:"⚙️"}],
  RETAIL:    [{id:"dashboard",l:"Dashboard",i:"⚡"},{id:"pos",l:"POS",i:"🖥️"},{id:"inventory",l:"Inventory",i:"📦"},{id:"customers",l:"Customers",i:"👥"},{id:"reports",l:"Reports",i:"📊"},{id:"settings",l:"Settings",i:"⚙️"}],
  LODGE:     [{id:"dashboard",l:"Dashboard",i:"⚡"},{id:"pos",l:"Rooms",i:"🏠"},{id:"log",l:"Register",i:"📋"},{id:"customers",l:"Guests",i:"👥"},{id:"reports",l:"Reports",i:"📊"},{id:"settings",l:"Settings",i:"⚙️"}],
};

function AppShell(){
  const {user,logout,orders}=useApp();
  const [page,setPage]=useState("dashboard");
  const nav=NAV[user?.businessType]||NAV.RETAIL;
  const grad={RESTAURANT:"from-orange-500 to-rose-500",HOTEL:"from-blue-500 to-cyan-400",RETAIL:"from-violet-500 to-indigo-500",LODGE:"from-teal-500 to-emerald-500"};
  const posLabel={RESTAURANT:"POS / Tables",HOTEL:"Rooms & Check-in",RETAIL:"Point of Sale",LODGE:"Lodge Room Manager"};
  const pageTitle={dashboard:"Overview",pos:posLabel[user?.businessType],inventory:"Inventory",log:"Check-in Register",customers:"Guests / Customers",reports:"Reports & Analytics",settings:"Settings"};

  const MODULES={
    dashboard:<DashboardPage/>,
    pos:      user?.businessType==="RESTAURANT"?<RestaurantPOS/>:user?.businessType==="HOTEL"?<HotelManager/>:user?.businessType==="LODGE"?<LodgeManager/>:<RetailPOS/>,
    log:      <LodgeRegisterPage/>,
    inventory:<InventoryPage/>,
    customers:<CustomersPage/>,
    reports:  <ReportsPage/>,
    settings: <SettingsPage/>,
  };

  return(
    <div className="flex h-screen overflow-hidden" style={{background:"#090c14"}}>
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -left-32 w-80 h-80 rounded-full blur-3xl" style={{background:"rgba(109,40,217,0.07)"}}/>
        <div className="absolute -bottom-32 -right-32 w-80 h-80 rounded-full blur-3xl" style={{background:"rgba(79,70,229,0.07)"}}/>
      </div>

      {/* Sidebar desktop */}
      <div className="hidden md:flex w-52 shrink-0 flex-col border-r border-white/8" style={{background:"rgba(0,0,0,0.5)",backdropFilter:"blur(20px)"}}>
        <div className="px-5 py-5 border-b border-white/8">
          <div className={clx("font-black text-xl bg-gradient-to-r bg-clip-text text-transparent",grad[user?.businessType]||grad.RETAIL)}>⚡ Zippy Bot</div>
          <div className="text-xs text-slate-600 truncate mt-0.5">{user?.businessName}</div>
          <div className="mt-1.5"><Badge c={user?.businessType==="RESTAURANT"?"amber":user?.businessType==="HOTEL"?"blue":user?.businessType==="LODGE"?"emerald":"violet"}>{user?.businessType}</Badge></div>
        </div>
        <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
          {nav.map(item=>(
            <button key={item.id} onClick={()=>setPage(item.id)}
              className={clx("w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all",page===item.id?"bg-violet-600/25 text-white border border-violet-500/30":"text-slate-500 hover:text-slate-200 hover:bg-white/6")}>
              <span className="w-5 text-base shrink-0">{item.i}</span>
              <span>{item.l}</span>
              {item.id==="reports"&&orders.length>0&&<span className="ml-auto bg-violet-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-mono">{Math.min(orders.length,9)}</span>}
            </button>
          ))}
        </nav>
        <div className="px-3 py-3 border-t border-white/8">
          <div className="flex items-center gap-2.5 px-3 py-2 mb-1.5 rounded-xl bg-white/4">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shrink-0">{user?.businessName?.[0]}</div>
            <div className="min-w-0"><p className="text-xs font-bold text-white truncate">{user?.businessName}</p><p className="text-xs text-slate-600">{user?.plan} Plan</p></div>
          </div>
          <Btn v="ghost" sz="sm" full onClick={logout} icon="🚪">Sign Out</Btn>
        </div>
      </div>

      {/* Main */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* Topbar */}
        <div className="h-14 border-b border-white/8 flex items-center justify-between px-4 shrink-0" style={{background:"rgba(0,0,0,0.3)",backdropFilter:"blur(10px)"}}>
          <div className="flex items-center gap-3">
            <span className="md:hidden font-black text-base bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">⚡</span>
            <h1 className="font-black text-white text-sm sm:text-base">{pageTitle[page]}</h1>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-2 bg-white/5 border border-white/8 rounded-xl px-3 py-1.5">
              <div className="w-5 h-5 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-white text-xs font-bold">{user?.businessName?.[0]}</div>
              <span className="text-xs text-slate-300 font-bold max-w-[100px] truncate">{user?.businessName}</span>
              <Badge c={user?.businessType==="RESTAURANT"?"amber":user?.businessType==="HOTEL"?"blue":user?.businessType==="LODGE"?"emerald":"violet"}>{user?.businessType?.slice(0,3)}</Badge>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-2.5 py-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block"/>
              <span className="hidden sm:inline">Live</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-3 sm:p-5 overflow-hidden" key={page}>
          <div className="h-full fade">{MODULES[page]}</div>
        </div>

        {/* Mobile bottom nav */}
        <div className="flex md:hidden border-t border-white/8 shrink-0" style={{background:"rgba(0,0,0,0.8)",backdropFilter:"blur(15px)"}}>
          {nav.map(item=>(
            <button key={item.id} onClick={()=>setPage(item.id)}
              className={clx("flex-1 flex flex-col items-center gap-0.5 py-2.5 transition-all relative",page===item.id?"text-violet-300":"text-slate-600 hover:text-slate-400")}>
              <span className="text-xl leading-none">{item.i}</span>
              <span className="text-[9px] font-bold">{item.l}</span>
              {page===item.id&&<span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-violet-500 rounded-full"/>}
              {item.id==="reports"&&orders.length>0&&<span className="absolute top-1 right-1 bg-violet-600 text-white text-[8px] rounded-full w-3.5 h-3.5 flex items-center justify-center font-mono">{Math.min(orders.length,9)}</span>}
            </button>
          ))}
        </div>
      </main>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   ROOT
══════════════════════════════════════════════════════════════ */
export default function App(){
  return(
    <Provider>
      <style>{STYLES}</style>
      <Toast/>
      <Gate/>
    </Provider>
  );
}
function Gate(){
  const {user}=useApp();
  return user?<AppShell/>:<LoginPage/>;
}
