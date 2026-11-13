'use client';
import{useEffect,useMemo,useState}from'react';
import{ArrowDownRight,ArrowUpRight,Plus,Search,Trash2}from'lucide-react';
import{useStore}from'@/components/Store';
import{label,money,rows,summary,Tx}from'@/domain/finance';
import TxDialog from'@/components/TxDialog';

type EditState=Tx|{new:true}|null;
export default function Page(){
 const{d,S,m}=useStore(),[query,setQuery]=useState(''),[type,setType]=useState<'all'|'income'|'expense'>('all'),[edit,setEdit]=useState<EditState>(null);
 useEffect(()=>{setQuery(new URLSearchParams(window.location.search).get('search')||'')},[]);
 const monthRows=rows(d,m),totals=summary(d,m);
 const filtered=useMemo(()=>monthRows.filter(tx=>(type==='all'||tx.type===type)&&(!query||(tx.description+' '+(tx.notes||'')).toLowerCase().includes(query.toLowerCase()))).slice().sort((a,b)=>b.date.localeCompare(a.date)||b.id.localeCompare(a.id)),[monthRows,type,query]);
 function remove(id:string){if(confirm('Delete this transaction? This cannot be undone.'))S(current=>({...current,transactions:current.transactions.filter(tx=>tx.id!==id)}))}
 return <>
  <header className="page-header"><div><span className="eyebrow">YOUR MONEY, ORGANIZED</span><h1>Transactions</h1><p>Review every credit and debit for {label(m)}.</p></div><button className="button button-purple" onClick={()=>setEdit({new:true})}><Plus size={16}/>Add transaction</button></header>
  <section className="page-summary-row" aria-label="Monthly transaction totals"><article className="summary-chip"><span>INCOME</span><strong className="positive-amount">{money(totals.income)}</strong></article><article className="summary-chip"><span>EXPENSES</span><strong>{money(totals.expenses)}</strong></article><article className="summary-chip"><span>TRANSACTIONS</span><strong>{totals.count}</strong></article></section>
  <section className="page-card"><div className="page-card-heading"><div><span className="eyebrow">ACTIVITY</span><h2>{filtered.length} {filtered.length===1?'transaction':'transactions'}</h2></div></div>
   <div className="filters"><label className="search-control"><Search size={16}/><input aria-label="Search transactions" placeholder="Search descriptions or notes" value={query} onChange={event=>setQuery(event.target.value)}/></label><select className="control" aria-label="Filter transaction type" value={type} onChange={event=>setType(event.target.value as typeof type)}><option value="all">All activity</option><option value="income">Income only</option><option value="expense">Expenses only</option></select></div>
   {filtered.length?<div className="table-wrap"><table className="finance-table"><thead><tr><th>Transaction</th><th>Date & account</th><th>Type</th><th>Amount</th><th aria-label="Actions"/></tr></thead><tbody>{filtered.map(tx=>{let category=d.categories.find(item=>item.id===tx.categoryId);return <tr key={tx.id} onDoubleClick={()=>setEdit(tx)}><td><span className="table-primary">{tx.description}</span><small className="table-muted">{category?.name||'Uncategorized'}{tx.notes?` · ${tx.notes}`:''}</small></td><td>{new Date(`${tx.date}T00:00:00`).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}<small className="table-muted">{tx.account==='food'?'Food account':'Others account'} · {tx.method}</small></td><td><span className={`type-pill ${tx.type==='income'?'type-income':'type-expense'}`}>{tx.type==='income'?<ArrowDownRight size={12}/>:<ArrowUpRight size={12}/>} {tx.type}</span></td><td className={tx.type==='income'?'positive-amount':'table-primary'}>{tx.type==='income'?'+':'−'}{money(tx.amount)}</td><td><div className="table-actions"><button className="icon-button" aria-label={`Edit ${tx.description}`} onClick={()=>setEdit(tx)}><span>✎</span></button><button className="icon-button danger" aria-label={`Delete ${tx.description}`} onClick={()=>remove(tx.id)}><Trash2 size={15}/></button></div></td></tr>})}</tbody></table></div>:<div className="empty-state"><ArrowUpRight size={25}/><div><h3>{query?'No matching transactions':'Nothing recorded this month'}</h3><p>{query?'Try a different search or filter.':'Add your first transaction to start building your monthly picture.'}</p>{!query&&<button className="button button-purple" onClick={()=>setEdit({new:true})}><Plus size={15}/>Add transaction</button>}</div></div>}
  </section>
  {edit&&<TxDialog edit={'new'in edit?undefined:edit} close={()=>setEdit(null)}/>}
 </>
}
