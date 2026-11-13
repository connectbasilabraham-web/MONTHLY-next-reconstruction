'use client';
import{useEffect,useState}from'react';
import{createPortal}from'react-dom';
import{useStore}from'./Store';
import{validateAmount}from'@/domain/finance';
export default function TxDialog({close,edit}:{close:()=>void;edit?:any}){
 let{d,S,m}=useStore(),[type,T]=useState(edit?.type||'expense'),[amount,A]=useState(edit?String(edit.amount):''),[date,Dt]=useState(edit?.date||m+'-01'),[category,C]=useState(edit?.categoryId||''),[desc,Q]=useState(edit?.description||''),[method,H]=useState(edit?.method||'UPI'),[account,B]=useState(edit?.account||'others'),[notes,N]=useState(edit?.notes||''),[err,E]=useState('');
 const[mounted,setMounted]=useState(false);
 useEffect(()=>{setMounted(true)},[]);
 useEffect(()=>{
  if(!mounted)return;
  const previousOverflow=document.body.style.overflow;
  const onKeyDown=(event:KeyboardEvent)=>{if(event.key==='Escape')close()};
  document.body.style.overflow='hidden';
  window.addEventListener('keydown',onKeyDown);
  return()=>{document.body.style.overflow=previousOverflow;window.removeEventListener('keydown',onKeyDown)}
 },[close,mounted]);
 let cats=d.categories.filter((c:any)=>c.kind===type&&(!c.disabled||c.id===category));
 function save(){let n=Number(amount),amountError=validateAmount(n);if(amountError)return E(amountError);if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||new Date(date+'T00:00:00').getDate()!==+date.slice(8))return E('Enter a valid date');if(!cats.some((c:any)=>c.id===category))return E('Choose a category');if(!desc.trim())return E('Add a short description');let tx={id:edit?.id||crypto.randomUUID(),type,amount:n,date,categoryId:category,description:desc.trim().slice(0,80),method,account,notes:notes.trim().slice(0,300)||undefined};S((x:any)=>({...x,transactions:edit?x.transactions.map((t:any)=>t.id===edit.id?tx:t):[...x.transactions,tx]}));close()}
 if(!mounted)return null;
 return createPortal(<div className="veil" onMouseDown={event=>{if(event.target===event.currentTarget)close()}}>
  <section className="dialog" role="dialog" aria-modal="true" aria-labelledby="tx-dialog-title">
   <header className="dialog-header"><h2 id="tx-dialog-title">{edit?'Edit transaction':'Add transaction'}</h2><button type="button" className="close" onClick={close} aria-label="Close dialog">×</button></header>
   <div className="toggle"><button onClick={()=>{T('expense');C('')}} className={type==='expense'?'on':''}>Expense</button><button onClick={()=>{T('income');C('')}} className={type==='income'?'on':''}>Income</button></div>
   <label>Amount ₹<input type="number" value={amount} onChange={e=>A(e.target.value)}/></label>
   <label>Date<input type="date" value={date} onChange={e=>Dt(e.target.value)}/></label>
   <label>Payment method<select value={method} onChange={e=>H(e.target.value)}>{['UPI','Cash','Credit Card','Debit Card','Bank Transfer','Other'].map(x=><option key={x}>{x}</option>)}</select></label>
   <label>Account<select value={account} onChange={e=>B(e.target.value)}><option value="others">Others</option><option value="food">Food</option></select></label>
   <label>Category<select value={category} onChange={e=>C(e.target.value)}><option value="">Choose category</option>{cats.map((c:any)=><option value={c.id} key={c.id}>{c.name}</option>)}</select></label>
   <label>Description<input value={desc} maxLength={80} onChange={e=>Q(e.target.value)}/></label>
   <label>Notes<input value={notes} maxLength={300} onChange={e=>N(e.target.value)}/></label>
   {err&&<p className="error">{err}</p>}
   <button className="primary" onClick={save}>Save transaction</button>
  </section>
 </div>,document.body)
}
