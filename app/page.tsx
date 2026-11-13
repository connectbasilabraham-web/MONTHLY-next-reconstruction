'use client';
import Link from'next/link';
import Image from'next/image';
import{useMemo,useState}from'react';
import{Activity,ArrowDownRight,ArrowRight,ArrowUpRight,ChevronRight,CircleAlert,Landmark,Plus,Sparkles,Utensils,WalletCards}from'lucide-react';
import{useStore}from'@/components/Store';
import{accounts,addFood,breakdown,label,money,rows,summary,Tx}from'@/domain/finance';
import TxDialog from'@/components/TxDialog';

type EditState=Tx|{new:true}|null;
export default function Home(){
 const{d,S,m}=useStore(),totals=summary(d,m),wallets=accounts(d,m),monthRows=rows(d,m),categories=breakdown(d,m),spending=categories.filter(category=>category.spent>0);
 const name=d.name.trim()||'there';
 const[edit,setEdit]=useState<EditState>(null),[funding,setFunding]=useState(false),[amount,setAmount]=useState(''),[fundingError,setFundingError]=useState('');
 const days=useMemo(()=>{
  const year=Number(m.slice(0,4)),month=Number(m.slice(5,7)),count=new Date(year,month,0).getDate();
  return Array.from({length:count},(_,index)=>{
   let date=`${m}-${String(index+1).padStart(2,'0')}`,dayRows=monthRows.filter(tx=>tx.date===date);
   return{day:index+1,income:dayRows.filter(tx=>tx.type==='income').reduce((total,tx)=>total+tx.amount,0),expenses:dayRows.filter(tx=>tx.type==='expense').reduce((total,tx)=>total+tx.amount,0)}
  })
 },[m,monthRows]);
 const maxDaily=Math.max(1,...days.map(day=>Math.max(day.income,day.expenses)));
 const point=(value:number,index:number)=>`${30+index*(580/Math.max(days.length-1,1))},${166-value/maxDaily*132}`;
 const pathFor=(key:'income'|'expenses')=>days.map((day,index)=>`${index?'L':'M'}${point(day[key],index)}`).join(' ');
 const budgetItems=categories.filter(category=>category.budget).slice(0,5),warnings=categories.filter(category=>category.budget&&category.spent>category.budget);
 const recent=monthRows.slice().sort((a,b)=>b.date.localeCompare(a.date)||b.id.localeCompare(a.id)).slice(0,5);
 const leading=spending[0];
 const insight=totals.count===0?'Add a transaction to see a useful summary of your month.':totals.closing<0?`Recorded expenses are ${money(Math.abs(totals.closing))} above income.`:leading?`${leading.name} is your highest recorded category at ${money(leading.spent)}.`:`${money(totals.closing)} remains after recorded expenses.`;
 function moveFunds(){try{S(current=>addFood(current,m,Number(amount)));setFunding(false);setAmount('');setFundingError('')}catch(error){setFundingError(error instanceof Error?error.message:'Could not move funds.')}}
 return <>
  <section className="welcome-row"><div><h1>Hi {name}, <span className="welcome-accent">Good Afternoon</span> <span className="greeting-wave" aria-hidden="true">👋</span></h1><p>Here’s a quick overview of your finances for this month.</p></div><button className="button button-purple" onClick={()=>setEdit({new:true})}><Plus size={16}/>Add transaction</button></section>
  <section className="overview-heading"><div><span className="eyebrow">MONTHLY SUMMARY</span><h2>{label(m)}</h2></div><span className="overview-count"><Activity size={15}/>{totals.count} transactions</span></section>
  <section className="metric-grid" aria-label="Monthly summary">
   <article className="metric-card balance-card"><span className="balance-grid" aria-hidden="true"/><div className="metric-top"><span>REMAINING BALANCE</span><span className="metric-icon"><WalletCards size={17}/></span></div><strong>{money(totals.closing)}</strong><small>Opening ₹0 + income − expenses</small></article>
   <article className="metric-card income-card"><div className="metric-top"><span>INCOME / CREDIT</span><span className="metric-icon"><Image src="/illustrations/income-3d.png" alt="" width={48} height={48} unoptimized/></span></div><strong>{money(totals.income)}</strong><small>Recorded income this month</small></article>
   <article className="metric-card expense-card"><div className="metric-top"><span>EXPENSES / DEBIT</span><span className="metric-icon"><Image src="/illustrations/expense-3d.png" alt="" width={48} height={48} unoptimized/></span></div><strong>{money(totals.expenses)}</strong><small>Includes {money(totals.investments)} in investments</small></article>
  </section>
  <section className="account-section">
   <div className="section-heading"><div><span className="eyebrow">ACCOUNT ALLOCATION</span><h2>Your accounts</h2></div><span className="section-note">Internal transfers don’t count as spending</span></div>
   <div className="account-grid">
    <article className="account-card food-account"><span className="account-art food-art" aria-hidden="true"/><div className="account-card-head"><span className="account-icon"><Utensils size={18}/></span><span className="account-open"><ArrowUpRight size={17}/></span></div><span className="eyebrow">FOOD ACCOUNT</span><strong>{money(wallets.foodBalance)}</strong><p>Funded {money(wallets.foodFunded)} <span>·</span> Spent {money(wallets.foodSpent)}</p><button className="text-action" onClick={()=>setFunding(true)}><Plus size={15}/>Move funds to Food</button></article>
    <article className="account-card others-account"><span className="account-art others-art" aria-hidden="true"/><div className="account-card-head"><span className="account-icon"><Landmark size={18}/></span><span className="account-open"><ArrowUpRight size={17}/></span></div><span className="eyebrow">OTHERS ACCOUNT</span><strong>{money(wallets.othersBalance)}</strong><p>Other expenses {money(wallets.othersSpent)}</p><span className="account-caption">Remaining after this month’s spending</span></article>
   </div>
  </section>
  <section className="dashboard-grid">
   <article className="surface-card cashflow-card"><div className="section-heading"><div><span className="eyebrow">CASH FLOW</span><h2>Income & expenses</h2></div><span className="chart-period">{label(m)}</span></div><div className="chart-legend"><span><i className="legend-income"/>Income</span><span><i className="legend-expense"/>Expenses</span><small>Daily recorded transactions</small></div><div className="chart-wrap"><svg className="cashflow-chart" viewBox="0 0 640 205" role="img" aria-label={`Daily income and expenses for ${label(m)}`}><path className="chart-gridline" d="M30 34H610M30 78H610M30 122H610M30 166H610"/>{monthRows.length===0&&<path className="chart-zero-line" d="M30 166H610"/>}{monthRows.length>0&&<><path className="chart-income-line" d={pathFor('income')}/><path className="chart-expense-line" d={pathFor('expenses')}/>{days.filter(day=>day.income||day.expenses).map(day=>{let index=day.day-1;return <g key={day.day}><circle className="chart-income-point" cx={30+index*(580/Math.max(days.length-1,1))} cy={166-day.income/maxDaily*132} r="3.5"><title>Day {day.day}: income {money(day.income)}</title></circle><circle className="chart-expense-point" cx={30+index*(580/Math.max(days.length-1,1))} cy={166-day.expenses/maxDaily*132} r="3.5"><title>Day {day.day}: expenses {money(day.expenses)}</title></circle></g>})}</>}</svg><div className="chart-days"><span>1</span><span>7</span><span>14</span><span>21</span><span>{days.length}</span></div></div>{monthRows.length===0&&<p className="chart-empty-note">No transactions recorded this month yet.</p>}</article>
   <article className="surface-card spending-card"><div className="section-heading"><div><span className="eyebrow">SPENDING MIX</span><h2>By category</h2></div><Link href="/analytics" className="subtle-link">Details<ChevronRight size={15}/></Link></div>{spending.length?<><div className="spending-total"><span>Total recorded expenses</span><strong>{money(totals.expenses)}</strong></div><div className="category-bars">{spending.slice(0,5).map((category,index)=><div className={`category-bar-row chart-series-${index%5}`} key={category.id}><div className="category-bar-label"><span><i/>{category.name}</span><b>{money(category.spent)}</b></div><div className="bar-track"><i style={{width:`${Math.min(100,category.share)}%`}}/></div></div>)}</div></>:<div className="mini-empty">No expenses recorded this month yet.</div>}</article>
  </section>
  <Link href="/analytics" className="insight-card" aria-label={`Analyse your month. ${insight} Open full monthly analysis.`}>
   <span className="insight-art"><Image className="insight-mascot" src="/illustrations/monty-mascot.png" alt="" width={140} height={140} priority/></span>
   <span className="insight-copy"><span className="insight-heading"><Sparkles size={16}/><h2>Analyse My Month</h2></span><span className="insight-subtitle">Your friendly, slightly sarcastic money coach — built from your recorded numbers.</span><span className="insight-message"><span className="insight-message-text">Hey {name}! {insight} Tap to see the full monthly analysis</span><ArrowRight size={14}/></span></span>
   <span className="insight-arrow"><ArrowRight size={17}/></span>
  </Link>
  <section className="dashboard-grid lower-grid">
   <article className="surface-card budget-card"><div className="section-heading"><div><span className="eyebrow">PLAN & TRACK</span><h2>Budget progress</h2></div><Link href="/categories" className="subtle-link">Manage<ChevronRight size={15}/></Link></div>{warnings.length>0&&<div className="budget-warning"><CircleAlert size={16}/><span>{warnings.length} {warnings.length===1?'category is':'categories are'} over budget</span></div>}{budgetItems.length?budgetItems.map(category=><div className="budget-row" key={category.id}><div className="budget-row-top"><span>{category.name}{category.used>100&&<em>Over budget</em>}</span><b>{money(category.spent)} <small>of {money(category.budget!)}</small></b></div><div className="bar-track"><i className={category.used>100?'over-budget':''} style={{width:`${Math.min(100,category.used)}%`}}/></div></div>):<div className="mini-empty">Set a category budget to start tracking progress.</div>}</article>
   <article className="surface-card recent-card"><div className="section-heading"><div><span className="eyebrow">LATEST ACTIVITY</span><h2>Recent transactions</h2></div><Link href="/transactions" className="subtle-link">All transactions<ChevronRight size={15}/></Link></div>{recent.length?recent.map(tx=>{let category=d.categories.find(item=>item.id===tx.categoryId),series=Math.max(d.categories.findIndex(item=>item.id===tx.categoryId),0)%5;return <button className="recent-row" key={tx.id} onClick={()=>setEdit(tx)}><span className={`transaction-icon chart-series-${series}`}>{category?.kind==='income'?<ArrowDownRight size={17}/>:<ArrowUpRight size={17}/>}</span><span className="recent-description"><b>{tx.description}</b><small>{category?.name||'Uncategorized'} · {new Date(`${tx.date}T00:00:00`).toLocaleDateString('en-IN',{day:'numeric',month:'short'})}</small></span><strong className={tx.type==='income'?'positive-amount':'negative-amount'}>{tx.type==='income'?'+':'−'}{money(tx.amount)}</strong></button>}):<div className="mini-empty">Your recent activity will show up here.</div>}</article>
  </section>
  {edit&&<TxDialog edit={'new'in edit?undefined:edit} close={()=>setEdit(null)}/>}
  {funding&&<div className="modal-backdrop" onMouseDown={event=>{if(event.target===event.currentTarget)setFunding(false)}}><section className="modal-card" role="dialog" aria-modal="true" aria-labelledby="food-transfer-title"><button className="modal-close" onClick={()=>setFunding(false)} aria-label="Close dialog">×</button><span className="eyebrow">ACCOUNT ALLOCATION</span><h2 id="food-transfer-title">Move money to Food</h2><p>This is an internal transfer from Others, not income or an expense.</p><label>Amount in INR<input type="number" min="0.01" step="0.01" value={amount} onChange={event=>setAmount(event.target.value)} placeholder="0.00"/></label>{fundingError&&<p className="inline-error" role="alert">{fundingError}</p>}<button className="button button-purple full-button" onClick={moveFunds}>Confirm transfer<ArrowRight size={16}/></button></section></div>}
 </>
}
