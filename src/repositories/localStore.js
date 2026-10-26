const dataKey=id=>`lifeos_data_v1_${id}`;
const read=(key,fallback)=>{try{return JSON.parse(localStorage.getItem(key))??fallback}catch{return fallback}};
const write=(key,value)=>localStorage.setItem(key,JSON.stringify(value));
const uid=()=>crypto.randomUUID?.()??`${Date.now()}-${Math.random().toString(36).slice(2)}`;
export const readData=id=>read(dataKey(id),{tasks:[],goals:[],habits:[],completions:[],events:[],expenses:[]});
export const saveData=(id,data)=>write(dataKey(id),data);
export const id=uid;
