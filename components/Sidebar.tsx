
import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Sidebar: React.FC = () => {
  const { signOut, profile } = useAuth();
  return (
    <aside className="hidden lg:flex w-72 h-screen flex-col bg-white dark:bg-[#151c2b] border-r border-gray-200 dark:border-gray-800 flex-shrink-0 z-20">
      <div className="p-6 flex flex-col h-full justify-between">
        <div className="flex flex-col gap-8">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 size-12 rounded-lg flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-3xl">church</span>
            </div>
            <div className="flex flex-col">
              <h1 className="text-lg font-bold leading-tight">Cuidado Pastoral</h1>
              <p className="text-gray-500 dark:text-gray-400 text-sm">Adventista Central</p>
            </div>
          </div>

          <nav className="flex flex-col gap-2">
            <NavLink
              to="/"
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive ? 'bg-primary text-white shadow-md' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`
              }
            >
              <span className="material-symbols-outlined">dashboard</span>
              <span className="text-sm font-semibold tracking-wide uppercase">Inicio</span>
            </NavLink>
            <NavLink
              to="/members"
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive ? 'bg-primary text-white shadow-md' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`
              }
            >
              <span className="material-symbols-outlined">group</span>
              <span className="text-sm font-semibold tracking-wide uppercase">Miembros</span>
            </NavLink>
            <NavLink
              to="/reports"
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive ? 'bg-primary text-white shadow-md' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`
              }
            >
              <span className="material-symbols-outlined">description</span>
              <span className="text-sm font-semibold tracking-wide uppercase">Registrar Visita</span>
            </NavLink>
            <NavLink
              to="/routines"
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive ? 'bg-primary text-white shadow-md' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`
              }
            >
              <span className="material-symbols-outlined">event_note</span>
              <span className="text-sm font-semibold tracking-wide uppercase">Rutinas</span>
            </NavLink>
            <NavLink
              to="/maintenance"
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive ? 'bg-primary text-white shadow-md' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`
              }
            >
              <span className="material-symbols-outlined">settings</span>
              <span className="text-sm font-semibold tracking-wide uppercase">Mantenimiento</span>
            </NavLink>
          </nav>
        </div>

        <div className="flex flex-col gap-4 border-t border-gray-100 dark:border-gray-800 pt-6">
          <div className="flex items-center gap-3">
            <img
              src={profile?.avatar_url || "https://picsum.photos/id/1012/100/100"}
              alt={profile?.full_name || "Usuario"}
              className="w-10 h-10 rounded-full object-cover ring-2 ring-gray-100 dark:ring-gray-800"
            />
            <div className="flex flex-col overflow-hidden">
              <span className="text-sm font-bold text-gray-900 dark:text-white truncate">
                {(profile?.full_name && !profile.full_name.includes('@')) ? profile.full_name : (profile?.full_name?.split('@')[0] || "Cargando...")}
              </span>
              <span className="text-xs text-gray-500 truncate">
                {profile?.role || "Usuario"}
              </span>
            </div>
          </div>
          <button
            onClick={() => signOut()}
            className="flex w-full items-center justify-center rounded-lg h-10 px-4 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 text-sm font-bold transition-all"
          >
            Cerrar Sesión
          </button>

          <div className="flex items-center justify-center gap-1 opacity-50">
            <span className="material-symbols-outlined text-[10px]">lock</span>
            <p className="text-[10px] uppercase tracking-widest">Datos Encriptados</p>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
