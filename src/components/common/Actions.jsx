import React,{useState} from 'react';
import {motion} from 'framer-motion';
import {Check,Trash2,X,Edit3,Calendar} from 'lucide-react';
import {cx} from '../../utils/classNames.js';
import {pretty} from '../../utils/date.js';

export function Button({children,onClick,kind='primary',icon:Icon,small=false,type}){return <button type={type||(onClick?'button':'submit')} onClick={onClick} className={cx(kind==='primary'?'primary-btn':kind==='outline'?'outline-btn':'subtle-btn',small&&'small-btn')}>{Icon&&<Icon size={16}/>} {children}</button>}

export function Dialog({title,children,onClose}){return <div className="modal-backdrop" onMouseDown={e=>e.target===e.currentTarget&&onClose()}><motion.div initial={{y:15,opacity:0,scale:.98}} animate={{y:0,opacity:1,scale:1}} className="modal"><div className="modal-header"><h3>{title}</h3><button className="icon-button" onClick={onClose}><X size={18}/></button></div>{children}</motion.div></div>}

export function confirmDelete(){return window.confirm('Delete this item? This action cannot be undone.')}

export function TaskLine({task,compact=false,onEdit,onDelete,onToggle}){return <div className={cx('task-line',task.status==='Completed'&&'task-done')}><button className="task-check" onClick={()=>onToggle?.(task)} aria-label="Toggle task">{task.status==='Completed'&&<Check size={13}/>}</button><div className="task-line-copy"><b>{task.title}</b>{!compact&&task.description&&<small>{task.description}</small>}</div><span className={`priority-pill ${task.priority.toLowerCase()}`}>{task.priority}</span>{task.dueDate&&<span className="task-date"><Calendar size={13}/>{pretty(task.dueDate)}</span>}{!compact&&<div className="row-actions"><button onClick={()=>onEdit?.(task)}><Edit3 size={15}/></button><button onClick={()=>onDelete?.(task)}><Trash2 size={15}/></button></div>}</div>}
