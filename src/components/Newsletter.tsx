import React from 'react';

export default function Newsletter() {
  return (
    <section className="mt-xxl px-margin-desktop grid grid-cols-1 md:grid-cols-3 gap-lg">
      <div className="md:col-span-2 bg-on-tertiary-fixed rounded-xl p-xxl text-white flex flex-col justify-center">
        <h2 className="font-headline-lg text-headline-lg mb-md">Únete a la Red Rizq Pro</h2>
        <p className="font-body-lg text-body-lg text-white/70 mb-lg">
          Obtén acceso exclusivo a ofertas mayoristas, alertas de stock y herramientas profesionales para tu negocio.
        </p>
        <div className="flex max-w-[28rem] bg-white rounded-lg p-1 overflow-hidden">
          <input className="flex-grow border-none focus:outline-none text-on-background px-md" placeholder="Ingresa tu correo empresarial" type="email" />
          <button className="bg-primary-container text-on-primary-fixed px-xl py-sm rounded-md font-bold hover:brightness-90 transition-all">
            Unirse Ahora
          </button>
        </div>
      </div>
      
      <div className="bg-primary-container rounded-xl p-xl flex flex-col justify-between border border-primary">
        <div className="space-y-lg">
          <div className="flex items-start gap-md">
            <span className="material-symbols-outlined text-3xl text-on-primary-fixed">verified</span>
            <div>
              <h4 className="font-label-lg text-label-lg font-bold text-on-primary-fixed">Calidad Verificada</h4>
              <p className="font-body-sm text-body-sm text-on-primary-fixed/80">Cada vendedor es evaluado por su confiabilidad.</p>
            </div>
          </div>
          <div className="flex items-start gap-md">
            <span className="material-symbols-outlined text-3xl text-on-primary-fixed">local_shipping</span>
            <div>
              <h4 className="font-label-lg text-label-lg font-bold text-on-primary-fixed">Logística Exprés</h4>
              <p className="font-body-sm text-body-sm text-on-primary-fixed/80">Envío global en menos de 5 días.</p>
            </div>
          </div>
          <div className="flex items-start gap-md">
            <span className="material-symbols-outlined text-3xl text-on-primary-fixed">shield_with_heart</span>
            <div>
              <h4 className="font-label-lg text-label-lg font-bold text-on-primary-fixed">Pago Seguro</h4>
              <p className="font-body-sm text-body-sm text-on-primary-fixed/80">Tu pago está seguro hasta la entrega.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
