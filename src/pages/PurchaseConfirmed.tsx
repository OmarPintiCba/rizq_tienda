import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';
export default function PurchaseConfirmed(){
  const [params]=useSearchParams(); const n=params.get('numero');
  return <main className="max-w-xl mx-auto px-4 py-20 text-center flex-grow"><div className="bg-white border border-gray-100 shadow-sm rounded-2xl p-8"><span className="material-symbols-outlined text-6xl text-green-600">check_circle</span><h1 className="text-3xl font-bold mt-3">Pedido confirmado</h1><p className="text-gray-600 mt-3">Tu operación quedó registrada para <b>pago en efectivo y retiro en local</b>.</p>{n&&<div className="mt-5 inline-block bg-gray-100 rounded-lg px-4 py-2 font-bold">RZQ-{String(n).padStart(6,'0')}</div>}<p className="text-sm text-gray-500 mt-5">La venta quedará pendiente hasta que realices el pago en el local.</p><Link to="/" className="mt-7 inline-block bg-primary-container text-on-primary-fixed px-6 py-3 rounded-lg font-bold">Volver a la tienda</Link></div></main>
}
