import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-on-secondary-fixed text-on-secondary py-xl border-t border-outline-variant mt-xxl">
      <div className="flex flex-col md:flex-row justify-between items-start px-margin-desktop w-full max-max-width mx-auto gap-xl">
        <div className="max-w-[20rem]">
          <h2 className="font-headline-sm text-headline-sm text-primary-container mb-md">Rizq</h2>
          <p className="font-body-sm text-body-sm text-secondary-fixed-dim">
            El ecosistema de comercio electrónico profesional líder, diseñado para escala, velocidad y confianza. Empoderando a compradores y vendedores a nivel mundial.
          </p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-xxl">
          <div>
            <h3 className="font-label-lg text-label-lg font-bold mb-md uppercase tracking-wider text-white">Compañía</h3>
            <ul className="space-y-sm">
              <li><a className="font-body-sm text-body-sm text-secondary-fixed-dim hover:text-white transition-colors" href="#">Política de Privacidad</a></li>
              <li><a className="font-body-sm text-body-sm text-secondary-fixed-dim hover:text-white transition-colors" href="#">Términos de Servicio</a></li>
              <li><a className="font-body-sm text-body-sm text-secondary-fixed-dim hover:text-white transition-colors" href="#">Insignias de Confianza</a></li>
            </ul>
          </div>
          <div>
            <h3 className="font-label-lg text-label-lg font-bold mb-md uppercase tracking-wider text-white">Soporte</h3>
            <ul className="space-y-sm">
              <li><a className="font-body-sm text-body-sm text-secondary-fixed-dim hover:text-white transition-colors" href="#">Contáctanos</a></li>
              <li><a className="font-body-sm text-body-sm text-secondary-fixed-dim hover:text-white transition-colors" href="#">Información de Envío</a></li>
              <li><a className="font-body-sm text-body-sm text-secondary-fixed-dim hover:text-white transition-colors" href="#">Devoluciones</a></li>
            </ul>
          </div>
          <div className="hidden md:block">
            <h3 className="font-label-lg text-label-lg font-bold mb-md uppercase tracking-wider text-white">Cuenta</h3>
            <ul className="space-y-sm">
              <li><a className="font-body-sm text-body-sm text-secondary-fixed-dim hover:text-white transition-colors" href="#">Portal de Vendedores</a></li>
              <li><a className="font-body-sm text-body-sm text-secondary-fixed-dim hover:text-white transition-colors" href="#">Historial de Compras</a></li>
              <li><a className="font-body-sm text-body-sm text-secondary-fixed-dim hover:text-white transition-colors" href="#">Lista de Deseos</a></li>
            </ul>
          </div>
        </div>
      </div>
      <div className="px-margin-desktop w-full max-max-width mx-auto mt-xl pt-lg border-t border-white/10 flex flex-col md:flex-row justify-between items-center opacity-80">
        <p className="font-body-sm text-body-sm text-secondary-fixed-dim">© 2024 Rizq E-commerce Profesional. Todos los derechos reservados.</p>
        <div className="flex items-center space-x-md mt-md md:mt-0">
          <span className="material-symbols-outlined text-secondary-fixed-dim cursor-pointer hover:text-white">language</span>
          <span className="material-symbols-outlined text-secondary-fixed-dim cursor-pointer hover:text-white">face_nod</span>
          <span className="material-symbols-outlined text-secondary-fixed-dim cursor-pointer hover:text-white">share</span>
          <Link
            to="/admin/login"
            title="Acceso administrativo"
            className="flex items-center gap-1 text-secondary-fixed-dim hover:text-white transition-colors border-l border-white/10 pl-md ml-1"
          >
            <span className="material-symbols-outlined text-[18px]">lock</span>
            <span className="font-label-sm text-label-sm">Admin</span>
          </Link>
        </div>
      </div>
    </footer>
  );
}
