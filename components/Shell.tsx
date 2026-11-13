'use client';
import Link from'next/link';
import{usePathname,useRouter}from'next/navigation';
import{LayoutDashboard,ArrowLeftRight,Wallet,ChartNoAxesCombined,Settings,Plus,MessageCircle,Sparkles,ChevronLeft,ChevronRight,Search,CalendarDays}from'lucide-react';
import{useStore}from'./Store';
import{FormEvent,useState}from'react';
import{label,shiftMonth}from'@/domain/finance';
import TxDialog from'./TxDialog';

const nav=[['/','Dashboard',LayoutDashboard],['/transactions','Transactions',ArrowLeftRight],['/categories','Categories',Wallet],['/analytics','Analytics',ChartNoAxesCombined]] as const;
export default function Shell({children}:{children:React.ReactNode}){
 const pathname=usePathname(),router=useRouter(),{m,M,d,user,ready,storageError}=useStore();
 const[add,setAdd]=useState(false),[search,setSearch]=useState(''),[chat,setChat]=useState(false);
 const metadata=user?.user_metadata||{};
 const name=(typeof metadata.full_name==='string'&&metadata.full_name.trim())||(typeof metadata.name==='string'&&metadata.name.trim())||user?.email?.split('@')[0]||d.name?.trim()||'Your account';
 const avatar=typeof metadata.avatar_url==='string'?metadata.avatar_url:typeof metadata.picture==='string'?metadata.picture:'';
 function searchTransactions(event:FormEvent<HTMLFormElement>){event.preventDefault();let query=search.trim();if(query)router.push(`/transactions?search=${encodeURIComponent(query)}`)}
 function shift(amount:number){M(shiftMonth(m,amount))}
 if(pathname==='/login'||pathname==='/reset-password')return <>{children}</>;
 if(!ready)return <main className="account-loading"><p>Loading your account…</p>{storageError&&<p role="alert">{storageError}</p>}</main>;
 return <div className="app-shell">
  <aside className="sidebar">
  <div className="sidebar-main">
   <Link className="brand" href="/"><span className="brand-mark"><ChartNoAxesCombined size={17}/></span><span>MONTHLY<span className="brand-dot">.</span></span></Link>
   <span className="sidebar-label">YOUR SPACE</span>
   <nav className="sidebar-nav">{nav.map(([url,title,Icon])=><Link className={`side-link ${pathname===url?'is-active':''}`} href={url} key={url}><Icon size={18}/><span>{title}</span></Link>)}</nav>
  </div>
   <div className="sidebar-bottom"><div className="sidebar-settings"><Link className={`side-link ${pathname==='/settings'?'is-active':''}`} href="/settings"><Settings size={18}/><span>Settings</span></Link></div><button className="sidebar-monty" onClick={()=>setChat(value=>!value)} aria-label="Ask Monty"><span className="sidebar-monty-icon"><Sparkles size={16}/></span><span className="sidebar-monty-copy"><b>Meet Monty</b><small>Your money companion</small></span><ChevronRight size={14}/></button><div className="profile-chip"><span className="avatar">{avatar?<img src={avatar} alt=""/>:name.slice(0,1).toUpperCase()}</span><span><b>{name}</b><small>{user?.email||'Personal account'}</small></span><ChevronRight className="profile-chevron" size={14} aria-hidden="true"/></div></div>
  </aside>
  <main className="workspace">
   <header className="topbar"><form className="global-search" onSubmit={searchTransactions}><Search size={17}/><input aria-label="Search transactions" placeholder="Search transactions" value={search} onChange={event=>setSearch(event.target.value)}/><button type="submit" aria-label="Search"><span>Enter</span></button></form><button className="top-monty-button" onClick={()=>setChat(value=>!value)} aria-label="Ask Monty"><MessageCircle size={17}/></button><Link className="top-profile" href="/settings" aria-label={`Settings for ${name}`}><span className="avatar">{avatar?<img src={avatar} alt=""/>:name.slice(0,1).toUpperCase()}</span></Link></header>
   <nav className="monthbar" aria-label="Select month">
    <div className="month-control">
     <button className="month-arrow" aria-label="Previous month" onClick={()=>shift(-1)}><ChevronLeft size={15}/></button>
     <div className="month-list">{Array.from({length:12},(_,index)=>{let year=Number(m.slice(0,4)),key=`${year}-${String(index+1).padStart(2,'0')}`;return <button className={`month-option ${m===key?'selected':''}`} onClick={()=>M(key)} key={key}>{new Date(year,index,1).toLocaleDateString('en-IN',{month:'short'})}</button>})}</div>
     <button className="month-arrow" aria-label="Next month" onClick={()=>shift(1)}><ChevronRight size={15}/></button>
    </div>
    <span className="month-current"><CalendarDays size={13}/>{label(m)}</span>
   </nav>
   <div className="page-content">{storageError&&<p className="storage-error" role="alert">{storageError}</p>}{children}</div>
  </main>
  <nav className="mobile-nav" aria-label="Primary navigation">{nav.map(([url,title,Icon])=><Link className={pathname===url?'is-active':''} href={url} key={url}><Icon size={18}/><small>{title}</small></Link>)}<button onClick={()=>setAdd(true)} aria-label="Add transaction"><Plus size={19}/></button></nav>
  {add&&<TxDialog close={()=>setAdd(false)}/>}
  {chat&&<div className="chat-panel"><button className="chat-close" onClick={()=>setChat(false)}>Close</button><span className="eyebrow">MONTY · PREVIEW</span><h3>Your money, made clearer.</h3><p>Monty is not connected in this preview. Your financial data is private to your account.</p></div>}
 </div>
}
