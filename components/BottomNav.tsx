
import React from 'react';
import { NavLink } from 'react-router-dom';

const BottomNav: React.FC = () => {
    return (
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-white dark:bg-[#151c2b] border-t border-gray-200 dark:border-gray-800 flex items-center justify-around px-2 z-50">
            <NavLink
                to="/"
                className={({ isActive }) =>
                    `flex flex-col items-center gap-1 px-3 py-1 rounded-lg transition-all ${isActive ? 'text-primary' : 'text-gray-500'
                    }`
                }
            >
                <span className="material-symbols-outlined text-2xl">dashboard</span>
                <span className="text-[10px] font-bold uppercase tracking-tighter">Inicio</span>
            </NavLink>
            <NavLink
                to="/members"
                className={({ isActive }) =>
                    `flex flex-col items-center gap-1 px-3 py-1 rounded-lg transition-all ${isActive ? 'text-primary' : 'text-gray-500'
                    }`
                }
            >
                <span className="material-symbols-outlined text-2xl">group</span>
                <span className="text-[10px] font-bold uppercase tracking-tighter">Miembros</span>
            </NavLink>
            <NavLink
                to="/reports"
                className={({ isActive }) =>
                    `flex flex-col items-center gap-1 px-3 py-1 rounded-lg transition-all ${isActive ? 'text-primary' : 'text-gray-500'
                    }`
                }
            >
                <div className="bg-primary text-white p-2 rounded-full -mt-8 shadow-lg shadow-primary/40 ring-4 ring-white dark:ring-[#151c2b]">
                    <span className="material-symbols-outlined text-2xl">add</span>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-tighter mt-1">Visita</span>
            </NavLink>
            <NavLink
                to="/routines"
                className={({ isActive }) =>
                    `flex flex-col items-center gap-1 px-3 py-1 rounded-lg transition-all ${isActive ? 'text-primary' : 'text-gray-500'
                    }`
                }
            >
                <span className="material-symbols-outlined text-2xl">event_note</span>
                <span className="text-[10px] font-bold uppercase tracking-tighter">Rutinas</span>
            </NavLink>
            <NavLink
                to="/maintenance"
                className={({ isActive }) =>
                    `flex flex-col items-center gap-1 px-3 py-1 rounded-lg transition-all ${isActive ? 'text-primary' : 'text-gray-500'
                    }`
                }
            >
                <span className="material-symbols-outlined text-2xl">settings</span>
                <span className="text-[10px] font-bold uppercase tracking-tighter">Ajustes</span>
            </NavLink>
        </nav>
    );
};

export default BottomNav;
