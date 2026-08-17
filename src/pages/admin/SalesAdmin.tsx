import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useToast } from '../../context/ToastContext';

const money=(v:number)=>new Intl.NumberFormat('es-AR',{style:'currency',currency:'ARS',maximumFractionDigits:0}).format(Number(v)||0);
const date=(v:string)=>new Intl.DateTimeFormat('es-AR',{dateStyle:'short',timeStyle:'short'}).format(new Date(v));

export default function SalesAdmin(){
  const [sales,setSales]=useState<any[]>([]); const [loading,setLoading]=useState(true); const [filter,setFilter]=useState<'all'|'pending'|'paid'>('all'); const {showToast}=useToast();
  const load=async()=>{setLoading(true);const {data,error}=await supabase.from('sales').select('*, sale_items(*)').order('created_at',{ascending:false}); if(error) showToast(error.message,'error'); setSales(data||[]);setLoading(false)};
  useEffect(()=>{load()},[]);
  const markPaid=async(id:string)=>{if(!confirm('¿Confirmás que recibiste el pago en efectivo?'))return; const {error}=await supabase.rpc('mark_sale_paid',{p_sale_id:id}); if(error)showToast(error.message,'error');else{showToast('Venta marcada como cobrada.','success');load()}};
  const fulfillment=async(id:string,status:string)=>{const {error}=await supabase.rpc('update_sale_fulfillment',{p_sale_id:id,p_status:status});if(error)showToast(error.message,'error');else load()};
  const visible=sales.filter(s=>filter==='all'||s.payment_status===filter);
  const paidTotal=sales.filter(s=>s.payment_status==='paid').reduce((a,s)=>a+Number(s.total),0); const pendingTotal=sales.filter(s=>s.payment_status==='pending').reduce((a,s)=>a+Number(s.total),0);
  return <div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6"><div className="bg-white border rounded-xl p-5"><div className="text-sm text-gray-500">Ingresos cobrados</div><div className="text-2xl font-bold mt-1">{money(paidTotal)}</div></div><div className="bg-white border rounded-xl p-5"><div className="text-sm text-gray-500">Pendiente de cobro</div><div className="text-2xl font-bold mt-1">{money(pendingTotal)}</div></div><div className="bg-white border rounded-xl p-5"><div className="text-sm text-gray-500">Operaciones</div><div className="text-2xl font-bold mt-1">{sales.length}</div></div></div>
    <div className="flex gap-2 mb-4">{[['all','Todas'],['pending','Pendientes'],['paid','Cobradas']].map(([k,l])=><button key={k} onClick={()=>setFilter(k as any)} className={`px-4 py-2 rounded-lg text-sm font-bold ${filter===k?'bg-primary-container text-on-primary-fixed':'bg-white border'}`}>{l}</button>)}</div>
    <div className="space-y-4">{loading?<div className="p-8 text-center">Cargando ventas...</div>:visible.length===0?<div className="bg-white border rounded-xl p-8 text-center text-gray-500">No hay ventas en este estado.</div>:visible.map(s=><article key={s.id} className="bg-white border rounded-xl p-5 shadow-sm"><div className="flex flex-col md:flex-row md:justify-between gap-3"><div><div className="font-bold text-lg">RZQ-{String(s.sale_number).padStart(6,'0')}</div><div className="text-sm text-gray-500">{date(s.created_at)} · {s.customer_first_name} {s.customer_last_name}</div><div className="text-sm text-gray-500">{s.customer_phone} · {s.customer_email}</div></div><div className="md:text-right"><div className="text-xl font-bold">{money(s.total)}</div><span className={`inline-block mt-1 text-xs font-bold px-2 py-1 rounded-full ${s.payment_status==='paid'?'bg-green-100 text-green-800':'bg-amber-100 text-amber-800'}`}>{s.payment_status==='paid'?'COBRADA':'PENDIENTE'}</span></div></div>
      <div className="border-t mt-4 pt-4 text-sm">{(s.sale_items||[]).map((i:any)=><div key={i.id} className="flex justify-between py-1"><span>{i.quantity} × {i.product_name}</span><b>{money(i.line_total)}</b></div>)}</div>
      <div className="border-t mt-4 pt-4 flex flex-wrap gap-3 items-center"><span className="text-sm"><b>Entrega:</b> retiro en local</span><select value={s.fulfillment_status} onChange={e=>fulfillment(s.id,e.target.value)} className="border rounded-lg p-2 text-sm"><option value="pending">Pendiente</option><option value="preparing">Preparando</option><option value="ready">Listo para retirar</option><option value="delivered">Entregado</option><option value="cancelled">Cancelado</option></select>{s.payment_status==='pending'&&<button onClick={()=>markPaid(s.id)} className="ml-auto bg-green-600 text-white px-4 py-2 rounded-lg font-bold text-sm">Marcar como cobrada</button>}</div>
    </article>)}</div>
  </div>
}
