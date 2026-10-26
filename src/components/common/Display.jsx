import React,{useState} from 'react';
import {useLife} from '../../context/LifeContext.jsx';
import {ArrowUpRight,Compass,Search,X} from 'lucide-react';

export function Avatar({name='User'}){return <span className="avatar">{name.split(/\s+/).map(n=>n[0]).slice(0,2).join('').toUpperCase()}</span>}

export function SearchBar({close}){const {data}=useLife();const [q,setQ]=useState('');const found=(data?.tasks||[]).filter(t=>t.title.toLowerCase().includes(q.toLowerCase())).slice(0,5);return <div className="search-pop"><Search size={17}/><input autoFocus placeholder="Search tasks" value={q} onChange={e=>setQ(e.target.value)}/><button onClick={close}><X size={16}/></button>{q&&<div className="search-results">{found.length?found.map(t=><div key={t.id}>{t.title}<small>{t.status}</small></div>):<span>No tasks found</span>}</div>}</div>}

export function PageHeading({eyebrow,title,subtitle,action}){return <div className="page-heading"><div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1>{subtitle&&<p>{subtitle}</p>}</div>{action}</div>}

export function Card({children,className=''}){return <div className={`card ${className}`}>{children}</div>}

export function Progress({value,color='purple'}){return <div className="progress-track"><i className={color} style={{width:`${Math.min(100,Math.max(0,value))}%`}}/></div>}

export function Empty({icon:Icon=Compass,title,description,action}){return <div className="empty-state"><div className="empty-icon"><Icon size={21}/></div><b>{title}</b><p>{description}</p>{action}</div>}

export function Stat({label,value,detail,icon:Icon,tone='violet',trend}){return <Card className="stat-card"><div className="stat-top"><span>{label}</span><i className={`stat-icon ${tone}`}><Icon size={18}/></i></div><div className="stat-value">{value}</div><div className="stat-detail">{trend&&<span className="stat-trend"><ArrowUpRight size={13}/>{trend}</span>}{detail}</div></Card>}
