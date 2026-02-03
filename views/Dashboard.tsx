
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../services/supabase';


const Dashboard: React.FC = () => {
  const [stats, setStats] = useState({
    visitsThisMonth: 0,
    urgentMembers: 0,
    totalMembers: 0,
    visitedPercentage: 0,
    visitedCount: 0
  });
  const [recentVisits, setRecentVisits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

      // 1. Total Members
      const { count: totalMembersCount, error: totalError } = await supabase
        .from('members')
        .select('*', { count: 'exact', head: true });

      if (totalError) throw totalError;

      // 2. Urgent Members
      const { count: urgentCount, error: urgentError } = await supabase
        .from('members')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'Urgent');

      if (urgentError) throw urgentError;

      // 3. Visits this month (count)
      const { count: visitsCount, error: visitsError } = await supabase
        .from('visits')
        .select('*', { count: 'exact', head: true })
        .gte('visit_date', firstDayOfMonth);

      if (visitsError) throw visitsError;

      // 4. Unique Members Visited (for progress bar)
      // Count unique members from visit_members associated with visits this month
      // First get visit IDs for this month
      const { data: monthVisits, error: monthVisitsError } = await supabase
        .from('visits')
        .select('id')
        .gte('visit_date', firstDayOfMonth);

      if (monthVisitsError) throw monthVisitsError;

      let visitedCount = 0;
      if (monthVisits && monthVisits.length > 0) {
        const visitIds = monthVisits.map(v => v.id);
        const { count: uniqueMemberCount, error: uniqueMemberError } = await supabase
          .from('visit_members')
          .select('member_id', { count: 'exact', head: true }) // distinct count is hard with simple select, need to pull data
          .in('visit_id', visitIds);

        // Actually, to get true unique count of members we need to fetch data and Set it
        const { data: memberVisitsData, error: memberVisitsError } = await supabase
          .from('visit_members')
          .select('member_id')
          .in('visit_id', visitIds);

        if (memberVisitsError) throw memberVisitsError;

        const uniqueMemberIds = new Set(memberVisitsData?.map(v => v.member_id));
        visitedCount = uniqueMemberIds.size;
      }

      const percentage = totalMembersCount ? Math.round((visitedCount / totalMembersCount) * 100) : 0;

      // 5. Recent Activity
      // Fetch visits with their associated members via visit_members
      const { data: visitsData, error: recentError } = await supabase
        .from('visits')
        .select(`
          id,
          visit_date,
          outcome,
          notes,
          visit_members (
            member:members (
              first_name,
              last_name,
              avatar_url
            )
          )
        `)
        .order('visit_date', { ascending: false })
        .limit(5);

      if (recentError) throw recentError;

      // Transform data to flatten members
      const formattedRecentVisits = visitsData?.map((visit: any) => ({
        ...visit,
        members: visit.visit_members?.map((vm: any) => vm.member) || []
      })) || [];

      setRecentVisits(formattedRecentVisits);

      setStats({
        visitsThisMonth: visitsCount || 0,
        urgentMembers: urgentCount || 0,
        totalMembers: totalMembersCount || 0,
        visitedPercentage: percentage,
        visitedCount: visitedCount
      });

    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const today = new Date().toLocaleDateString('es-ES', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto bg-background-light dark:bg-background-dark">
      <div className="w-full max-w-[1200px] mx-auto p-4 md:p-10 flex flex-col gap-6 md:gap-8">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl md:text-4xl font-black tracking-tight">Bienvenido</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm md:text-base flex items-center gap-2">
              <span className="material-symbols-outlined text-lg">today</span>
              Hoy es {today}
            </p>
          </div>
          <Link to="/reports" className="hidden md:flex items-center justify-center gap-2 rounded-lg h-12 px-6 bg-primary hover:bg-blue-700 text-white shadow-lg shadow-primary/30 transition-all active:scale-95">
            <span className="material-symbols-outlined">add</span>
            <span className="text-sm font-bold tracking-wide">Registrar Visita</span>
          </Link>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Members Card */}
          <div className="bg-white dark:bg-[#151c2b] p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm relative overflow-hidden group">
            <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <span className="material-symbols-outlined text-8xl text-primary">groups</span>
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-sm font-bold uppercase tracking-wider mb-2">Total Miembros</p>
            <h3 className="text-4xl font-black text-gray-900 dark:text-white mb-1">{loading ? '-' : stats.totalMembers}</h3>
            <p className="text-sm text-green-500 font-medium flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">check_circle</span>
              Activos
            </p>
          </div>

          {/* Visits This Month */}
          <div className="bg-white dark:bg-[#151c2b] p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm relative overflow-hidden group">
            <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <span className="material-symbols-outlined text-8xl text-blue-500">event_note</span>
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-sm font-bold uppercase tracking-wider mb-2">Visitas (Mes)</p>
            <h3 className="text-4xl font-black text-gray-900 dark:text-white mb-1">{loading ? '-' : stats.visitsThisMonth}</h3>
            <p className="text-sm text-blue-500 font-medium flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">trending_up</span>
              Registradas
            </p>
          </div>

          {/* Urgent Members */}
          <div className="bg-white dark:bg-[#151c2b] p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm relative overflow-hidden group border-l-4 border-l-amber-500">
            <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <span className="material-symbols-outlined text-8xl text-amber-500">warning</span>
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-sm font-bold uppercase tracking-wider mb-2">Requieren Atención</p>
            <h3 className="text-4xl font-black text-gray-900 dark:text-white mb-1">{loading ? '-' : stats.urgentMembers}</h3>
            <p className="text-sm text-amber-600 font-medium flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">priority_high</span>
              Prioridad
            </p>
          </div>

          {/* Progress Card */}
          <div className="bg-gradient-to-br from-primary to-blue-600 p-6 rounded-2xl shadow-lg shadow-blue-500/20 text-white relative overflow-hidden">
            <div className="absolute right-0 top-0 p-4 opacity-20">
              <span className="material-symbols-outlined text-8xl">donut_large</span>
            </div>
            <p className="text-blue-100 text-sm font-bold uppercase tracking-wider mb-2">Progreso de Visitas</p>
            <div className="flex items-end gap-2 mb-2">
              <h3 className="text-4xl font-black">{loading ? '-' : stats.visitedPercentage}%</h3>
              <span className="text-blue-100 mb-1">Completado</span>
            </div>
            {/* Progress Bar */}
            <div className="w-full bg-black/20 rounded-full h-2 mb-2 overflow-hidden">
              <div
                className="bg-white h-full rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${stats.visitedPercentage}%` }}
              ></div>
            </div>
            <p className="text-xs text-blue-100 opacity-80">
              {stats.visitedCount} de {stats.totalMembers} miembros visitados
            </p>
          </div>
        </div>

        {/* Graphs Section - Placeholder for more detailed stats if needed, or just layout spacing */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Activity Table */}
          <div className="lg:col-span-3 bg-white dark:bg-[#151c2b] rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/20">
              <h2 className="text-lg font-bold flex items-center gap-2 text-gray-900 dark:text-white">
                <span className="material-symbols-outlined text-primary">history</span>
                Actividad Reciente
              </h2>
              <Link to="/members" className="text-sm font-bold text-primary hover:text-blue-600 transition-colors">
                Ver Todo
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800 text-xs uppercase text-gray-500 font-semibold tracking-wider">
                    <th className="px-6 py-4">Miembro(s)</th>
                    <th className="px-6 py-4">Fecha</th>
                    <th className="px-6 py-4">Motivo</th>
                    <th className="px-6 py-4">Notas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {loading ? (
                    [...Array(3)].map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td className="px-6 py-4"><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32"></div></td>
                        <td className="px-6 py-4"><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div></td>
                        <td className="px-6 py-4"><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20"></div></td>
                        <td className="px-6 py-4"><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-48"></div></td>
                      </tr>
                    ))
                  ) : recentVisits.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <span className="material-symbols-outlined text-4xl text-gray-300">event_busy</span>
                          <p>No hay visitas recientes registradas.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    recentVisits.map((visit) => (
                      <tr key={visit.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            {/* Display multiple avatars or names */}
                            <div className="flex -space-x-3">
                              {visit.members.slice(0, 3).map((member: any, idx: number) => (
                                <img
                                  key={idx}
                                  src={member.avatar_url || `https://ui-avatars.com/api/?name=${member.first_name}&background=random`}
                                  alt=""
                                  className="w-10 h-10 rounded-full object-cover border-2 border-white dark:border-gray-800 shadow-sm"
                                  title={`${member.first_name} ${member.last_name}`}
                                />
                              ))}
                              {visit.members.length > 3 && (
                                <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 border-2 border-white dark:border-gray-800 flex items-center justify-center text-xs font-bold text-gray-500">
                                  +{visit.members.length - 3}
                                </div>
                              )}
                            </div>
                            <div className="flex flex-col">
                              {visit.members && visit.members.length > 0 ? (
                                <>
                                  <p className="font-bold text-gray-900 dark:text-white text-sm">
                                    {visit.members[0].first_name} {visit.members[0].last_name}
                                  </p>
                                  {visit.members.length > 1 && (
                                    <p className="text-xs text-gray-500">
                                      y {visit.members.length - 1} más
                                    </p>
                                  )}
                                </>
                              ) : (
                                <p className="font-bold text-gray-900 dark:text-white text-sm">Sin miembros</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-gray-600 dark:text-gray-300 font-medium">
                            {new Date(visit.visit_date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-100 dark:border-blue-800">
                            {visit.outcome}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-gray-500 max-w-xs truncate" title={visit.notes}>
                            {visit.notes}
                          </p>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
