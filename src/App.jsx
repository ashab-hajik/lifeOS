import React,{useState} from 'react';
import {Routes,Route,Navigate} from 'react-router-dom';
import {AnimatePresence,motion} from 'framer-motion';
import {Command,CheckCircle2} from 'lucide-react';
import {LifeProvider,useLife} from './context/LifeContext.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import {ApplicationLayout} from './components/layout/ApplicationLayout.jsx';
import {Dashboard} from './pages/Dashboard.jsx';
import {Tasks} from './pages/Tasks.jsx';
import {Goals} from './pages/Goals.jsx';
import {Habits} from './pages/Habits.jsx';
import {Planner} from './pages/Planner.jsx';
import {Expenses} from './pages/Expenses.jsx';
import {Analytics} from './pages/Analytics.jsx';
import {SettingsPage} from './pages/Settings.jsx';

function AppRoutes(){
 const {checking,user,toast}=useLife();
 const [mobile,setMobile]=useState(false);
 if(checking)return <div className="boot-screen"><div className="brand-icon"><Command size={18}/></div><span>life<span className="accent">os</span></span></div>;
 return <><Routes>
  <Route path="/login" element={user?<Navigate to="/" replace/>:<Login/>}/>
  <Route path="/register" element={user?<Navigate to="/" replace/>:<Register/>}/>
  <Route path="/" element={user?<ApplicationLayout mobile={mobile} setMobile={setMobile}/>:<Navigate to="/login" replace/>}>
   <Route index element={<Dashboard/>}/><Route path="tasks" element={<Tasks/>}/><Route path="goals" element={<Goals/>}/>
   <Route path="habits" element={<Habits/>}/><Route path="planner" element={<Planner/>}/><Route path="expenses" element={<Expenses/>}/>
   <Route path="analytics" element={<Analytics/>}/><Route path="settings" element={<SettingsPage/>}/>
  </Route><Route path="*" element={<Navigate to={user?'/':'/login'} replace/>}/>
 </Routes><AnimatePresence>{toast&&<motion.div initial={{y:18,opacity:0}} animate={{y:0,opacity:1}} exit={{opacity:0}} className="toast"><CheckCircle2 size={17}/>{toast}</motion.div>}</AnimatePresence></>;
}

export default function App(){return <LifeProvider><AppRoutes/></LifeProvider>}
