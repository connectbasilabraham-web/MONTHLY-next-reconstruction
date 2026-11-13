'use client';
import React,{createContext,useContext,useEffect,useRef,useState}from'react';
import{Data,deserializeData,monthKey,seed}from'@/domain/finance';
type StoreContext={d:Data;S:React.Dispatch<React.SetStateAction<Data>>;m:string;M:React.Dispatch<React.SetStateAction<string>>;dark:boolean;D:React.Dispatch<React.SetStateAction<boolean>>;ready:boolean;storageError:string|null;restoreData:(value:unknown)=>void};
const C=createContext<StoreContext|null>(null);
export function Store({children}:{children:React.ReactNode}){
 const initialData=useRef<Data|null>(null);
 const[d,S]=useState<Data>(()=>{let value=seed();initialData.current=value;return value});
 const[m,M]=useState(()=>monthKey()),[dark,D]=useState(false),[ready,R]=useState(false);
 const[dataWritable,W]=useState(false),[themeWritable,TW]=useState(false);
 const[dataError,DE]=useState<string|null>(null),[themeError,TE]=useState<string|null>(null);
 const storageError=[dataError,themeError].filter(Boolean).join(' ')||null;
 useEffect(()=>{
  let canWriteData=false,canWriteTheme=false;
  try{
   let raw=localStorage.getItem('monthly:data:v3');
   if(raw===null)canWriteData=true;
   else{
    try{let value=deserializeData(JSON.parse(raw));S(value);initialData.current=value;canWriteData=true}
    catch(error){DE(`Saved MONTHLY data is invalid and has been left untouched. Restore a valid backup before saving changes. ${error instanceof Error?error.message:''}`.trim())}
   }
  }catch{DE('MONTHLY could not read saved data from this browser. Current data is in memory only; existing storage was not changed.')}
  try{D(localStorage.getItem('monthly:theme')==='dark');canWriteTheme=true}
  catch{TE('MONTHLY could not read the saved theme preference.')}
  W(canWriteData);TW(canWriteTheme);M(monthKey());R(true)
 },[]);
 useEffect(()=>{
  if(!ready)return;
  if(d===initialData.current){initialData.current=null;return}
  if(!dataWritable)return;
  try{localStorage.setItem('monthly:data:v3',JSON.stringify(d));DE(null)}
  catch{W(false);DE('MONTHLY could not save your data to this browser. Your current changes remain in memory only.')}
 },[d,ready,dataWritable]);
 useEffect(()=>{
  if(!ready)return;
  document.documentElement.dataset.theme=dark?'dark':'light';
  if(!themeWritable)return;
  try{localStorage.setItem('monthly:theme',dark?'dark':'light');TE(null)}
  catch{TW(false);TE('MONTHLY could not save the theme preference.')}
 },[dark,ready,themeWritable]);
 function restoreData(value:unknown){let restored=deserializeData(value);S(restored);W(true);DE(null)}
 return <C.Provider value={{d,S,m,M,dark,D,ready,storageError,restoreData}}>{children}</C.Provider>
}
export function useStore(){let value=useContext(C);if(!value)throw Error('MONTHLY store is unavailable');return value}
