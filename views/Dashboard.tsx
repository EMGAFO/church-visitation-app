
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { findNearbyServices } from '../services/gemini';

const Dashboard: React.FC = () => {
  const [nearbyServices, setNearbyServices] = useState<{ text: string, grounding: any[] } | null>(null);
  const [isSearchingNearby, setIsSearchingNearby] = useState(false);
  const [stats, setStats] = useState({
    visitsThisMonth: 0,
    urgentMembers: 0,
    totalMembers: 0,
    visitedPercentage: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

      // Get splits
      const { count: visitsCount, error: visitsError } = await supabase
        .from('visits')
        .select('*', { count: 'exact', head: true })
        .gte('visit_date', firstDayOfMonth);

      if (visitsError) throw visitsError;

      const { count: urgentCount, error: urgentError } = await supabase
        .from('members')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'Urgent');

      if (urgentError) throw urgentError;

      const { count: totalMembersCount, error: totalError } = await supabase
        .from('members')
        .select('*', { count: 'exact', head: true });

      if (totalError) throw totalError;

      // Calculate members visited this year (or some relevant period for percentage)
      // Let's assume unique members visited this month for now as a KPI
      const { data: uniqueVisits, error: uniqueError } = await supabase.rpc('get_unique_visited_members_count', { start_date: firstDayOfMonth });
      // Note: custom RPC might be needed if complex, but lets stick to simple queries first. 
      // Actually, let's just count total visits vs total members for a "Visit Activity Level" metric or similar.

      // For "Percentage of goal reached": user said "miembros o familias y los que no se han citado".
      // Let's try to get distinct members visited this month.
      const { data: visitedMembers, error: visitedError } = await supabase
        .from('visits')
        .select('member_id')
        .gte('visit_date', firstDayOfMonth);

      if (visitedError) throw visitedError;

      const uniqueVisitedIds = new Set(visitedMembers?.map(v => v.member_id));
      const percentage = totalMembersCount ? Math.round((uniqueVisitedIds.size / totalMembersCount) * 100) : 0;

      setStats({
        visitsThisMonth: visitsCount || 0,
        urgentMembers: urgentCount || 0,
        totalMembers: totalMembersCount || 0,
        visitedPercentage: percentage
      });

    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNearbySearch = async () => {
    setIsSearchingNearby(true);
    try {
      navigator.geolocation.getCurrentPosition(async (pos) => {
        const result = await findNearbyServices(pos.coords.latitude, pos.coords.longitude, "hospitals or care homes");
        setNearbyServices(result);
        setIsSearchingNearby(false);
      }, async () => {
        const result = await findNearbyServices(-33.4489, -70.6693, "hospitals"); // Fallback Santiago (or user location)
        setNearbyServices(result);
        setIsSearchingNearby(false);
      });
    } catch (e) {
      console.error(e);
      setIsSearchingNearby(false);
    }
  };

  const today = new Date().toLocaleDateString('es-ES', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto bg-background-light dark:bg-background-dark">
      <div className="w-full max-w-[1200px] mx-auto p-6 md:p-10 flex flex-col gap-8">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl md:text-4xl font-black tracking-tight">Bienvenido, Pastor</h1>
            <p className="text-gray-500 dark:text-gray-400 text-base flex items-center gap-2">
              <span className="material-symbols-outlined text-lg">today</span>
              Hoy es {today}
            </p>
          </div>
          <Link to="/reports" className="flex items-center justify-center gap-2 rounded-lg h-12 px-6 bg-primary hover:bg-blue-700 text-white shadow-lg shadow-primary/30 transition-all active:scale-95">
            <span className="material-symbols-outlined">add</span>
            <span className="text-sm font-bold tracking-wide">Registrar Visita</span>
          </Link>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-[#151c2b] rounded-xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col justify-between h-40">
            <div className="flex justify-between items-start">
              <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">Visitas este Mes</p>
              <span className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
                <span className="material-symbols-outlined text-xs">trending_up</span>Actual
              </span>
            </div>
            <div>
              <p className="text-5xl font-black mt-2">{loading ? '-' : stats.visitsThisMonth}</p>
              <p className="text-sm text-gray-400 mt-1">Interacciones totales</p>
            </div>
          </div>

          <div className="bg-white dark:bg-[#151c2b] rounded-xl p-6 border-l-4 border-l-amber-500 border-y border-r border-gray-200 dark:border-gray-800 shadow-sm flex flex-col justify-between h-40">
            <div className="flex justify-between items-start">
              <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">Miembros Urgentes</p>
              <span className="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
                <span className="material-symbols-outlined text-xs">priority_high</span>Acción
              </span>
            </div>
            <div>
              <p className="text-5xl font-black mt-2">{loading ? '-' : stats.urgentMembers}</p>
              <p className="text-sm text-gray-400 mt-1">Requieren atención</p>
            </div>
          </div>

          <div className="bg-white dark:bg-[#151c2b] rounded-xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col justify-between h-40">
            <div className="flex justify-between items-start">
              <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">Cobertura</p>
              <div className="size-8 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-primary">
                <span className="material-symbols-outlined text-lg">pie_chart</span>
              </div>
            </div>
            <div>
              <p className="text-5xl font-black mt-2">{loading ? '-' : stats.visitedPercentage}%</p>
              <p className="text-sm text-gray-400 mt-1">De miembros visitados este mes</p>
            </div>
          </div>
        </section>

        {/* Nearby Services Maps Grounding Tool */}
        <section className="bg-white dark:bg-[#151c2b] rounded-2xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-4">
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2">
                <span className="material-symbols-outlined text-red-500 material-symbols-fill">location_on</span>
                Buscar Recursos Locales
              </h2>
              <p className="text-gray-500 text-sm">Use IA para localizar hospitales, centros de cuidado o ubicaciones cercanas.</p>
            </div>
            <button
              onClick={handleNearbySearch}
              disabled={isSearchingNearby}
              className="w-full sm:w-auto px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg font-bold text-sm transition-colors flex items-center justify-center gap-2"
            >
              {isSearchingNearby ? (
                <div className="size-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
              ) : <span className="material-symbols-outlined text-lg">search</span>}
              Buscar Hospitales Cercanos
            </button>
          </div>

          {nearbyServices && (
            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-800 animate-in fade-in duration-300">
              <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line leading-relaxed mb-4">
                {nearbyServices.text}
              </p>
              <div className="flex flex-wrap gap-2">
                {nearbyServices.grounding.map((chunk: any, i: number) => (
                  chunk.maps && (
                    <a
                      key={i}
                      href={chunk.maps.uri}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full text-xs font-semibold text-primary hover:bg-primary hover:text-white transition-all shadow-sm"
                    >
                      <span className="material-symbols-outlined text-sm">link</span>
                      {chunk.maps.title}
                    </a>
                  )
                ))}
              </div>
            </div>
          )}
        </section>

        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between pb-2">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">schedule</span>
              Actividad Reciente
            </h2>
            <Link to="/members" className="text-sm font-bold text-primary hover:underline">Ver Directorio Completo</Link>
          </div>

          <div className="bg-white dark:bg-[#151c2b] p-8 rounded-xl border border-gray-200 dark:border-gray-800 text-center text-gray-400">
            <p>Revise el Directorio de Miembros para registrar nuevas visitas.</p>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Dashboard;
