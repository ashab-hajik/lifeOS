import React,{createContext,useContext,useEffect,useState} from 'react';
import {readData,saveData} from '../repositories/localStore.js';
import {currentUser,logout} from '../services/authApi.js';

const LifeContext=createContext(null);
export const useLife=()=>useContext(LifeContext);

export function LifeProvider({children}){
 const [user,setUser]=useState(null);
 const [data,setData]=useState(null);
 const [checking,setChecking]=useState(true);
 const [toast,setToast]=useState('');
 const [authError,setAuthError]=useState('');
 useEffect(()=>{currentUser().then(u=>{if(u){setUser(u);setData(readData(u.id))}}).catch(error=>setAuthError(error.message)).finally(()=>setChecking(false))},[]);
 const commit=next=>{setData(next);if(user)saveData(user.id,next)};
 const notify=message=>{setToast(message);setTimeout(()=>setToast(''),2800)};
 const initializeUser=u=>{setAuthError('');setUser(u);setData(readData(u.id))};
 const signOut=async()=>{await logout();setUser(null);setData(null);setAuthError('')};
 return <LifeContext.Provider value={{user,setUser,data,commit,notify,initializeUser,signOut,checking,toast,authError}}>{children}</LifeContext.Provider>
}
