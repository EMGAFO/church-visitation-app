
import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { Visit } from '../types';

const CalendarView: React.FC = () => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [visits, setVisits] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchVisits();
    }, [currentDate]);

    const fetchVisits = async () => {
        setLoading(true);
        const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString();
        const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).toISOString();

        const { data, error } = await supabase
            .from('visits')
            .select('*, members(first_name, last_name, avatar_url)')
            .gte('visit_date', startOfMonth)
            .lte('visit_date', endOfMonth);

        if (!error && data) {
            setVisits(data);
        }
        setLoading(false);
    };

    const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

    const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

    const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

    const calendarDays = [];
    // Add empty slots for days before the first day of the month
    for (let i = 0; i < firstDayOfMonth; i++) {
        calendarDays.push(null);
    }
    // Add days of the month
    for (let i = 1; i <= daysInMonth; i++) {
        calendarDays.push(i);
    }

    return (
        <div className="flex-1 px-4 md:px-12 py-6 md:py-8 w-full max-w-[1440px] mx-auto overflow-y-auto">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-2">Calendario Pastoral</h1>
                    <p className="text-gray-500 text-lg">Organiza tus visitas y actividades.</p>
                </div>
                <div className="flex items-center gap-4 bg-white dark:bg-[#151c2b] p-2 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm">
                    <button onClick={prevMonth} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
                        <span className="material-symbols-outlined">chevron_left</span>
                    </button>
                    <h2 className="text-lg font-bold min-w-[150px] text-center">
                        {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                    </h2>
                    <button onClick={nextMonth} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
                        <span className="material-symbols-outlined">chevron_right</span>
                    </button>
                </div>
            </div>

            <div className="bg-white dark:bg-[#151c2b] rounded-3xl shadow-xl shadow-primary/5 border border-gray-100 dark:border-gray-800 overflow-hidden">
                <div className="grid grid-cols-7 border-b border-gray-100 dark:border-gray-800">
                    {['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'].map(day => (
                        <div key={day} className="py-4 text-center text-xs font-bold uppercase tracking-widest text-gray-400">
                            {day}
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-7 auto-rows-[120px] md:auto-rows-[160px]">
                    {calendarDays.map((day, idx) => {
                        const dayVisits = visits.filter(v => {
                            const vDate = new Date(v.visit_date);
                            return day !== null && vDate.getDate() === day && vDate.getMonth() === currentDate.getMonth() && vDate.getFullYear() === currentDate.getFullYear();
                        });

                        return (
                            <div key={idx} className={`p-2 border-r border-b border-gray-50 dark:border-gray-800/50 ${day === null ? 'bg-gray-50/50 dark:bg-gray-900/20' : ''}`}>
                                {day !== null && (
                                    <>
                                        <span className={`text-sm font-bold ${new Date().getDate() === day && new Date().getMonth() === currentDate.getMonth() ? 'bg-primary text-white size-7 flex items-center justify-center rounded-full' : 'text-gray-400'}`}>
                                            {day}
                                        </span>
                                        <div className="mt-2 space-y-1 overflow-y-auto max-h-[80%]">
                                            {dayVisits.map(v => (
                                                <div key={v.id} className="text-[10px] p-1.5 rounded bg-primary/10 text-primary font-bold truncate flex items-center gap-1">
                                                    <span className="size-1.5 rounded-full bg-primary flex-shrink-0"></span>
                                                    {v.members?.first_name} {v.members?.last_name}
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default CalendarView;
