
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import AddMemberModal from '../components/AddMemberModal';
import BulkImportModal from '../components/BulkImportModal';

interface Member {
  id: string;
  first_name: string;
  last_name: string;
  role: string;
  status: string;
  avatar_url: string;
  last_visit?: string;
}

const MemberDirectory: React.FC = () => {
  const [members, setMembers] = useState<Member[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showNeverVisited, setShowNeverVisited] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [statuses, setStatuses] = useState<{ id: string, name: string, color_class: string }[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchMembers();
    fetchStatuses();
  }, []);

  const fetchStatuses = async () => {
    const { data } = await supabase.from('member_statuses').select('*').order('name');
    if (data) setStatuses(data);
  };

  const fetchMembers = async () => {
    try {
      setLoading(true);

      // Fetch members
      const { data: membersData, error: membersError } = await supabase
        .from('members')
        .select('*')
        .order('last_name');

      if (membersError) throw membersError;

      // Fetch visit history via junction table
      const { data: visitsData, error: visitsError } = await supabase
        .from('visit_members')
        .select(`
          member_id,
          visits (
            visit_date
          )
        `);

      if (visitsError) throw visitsError;

      // Map members to find their latest visit
      const membersWithVisits = membersData?.map(member => {
        // Filter visits for this member
        const memberVisits = visitsData
          ?.filter((v: any) => v.member_id === member.id && v.visits)
          .map((v: any) => v.visits.visit_date);

        let lastVisitDate = null;
        if (memberVisits && memberVisits.length > 0) {
          // Sort descending
          memberVisits.sort((a: string, b: string) => new Date(b).getTime() - new Date(a).getTime());
          lastVisitDate = memberVisits[0];
        }

        return {
          ...member,
          last_visit: lastVisitDate ? new Date(lastVisitDate).toLocaleDateString('es-ES') : 'Nunca'
        };
      });

      setMembers(membersWithVisits || []);
    } catch (error) {
      console.error('Error fetching members:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredMembers = members.filter(m => {
    const fullName = `${m.first_name} ${m.last_name}`.toLowerCase();
    const matchesSearch = fullName.includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || m.status === statusFilter;
    const matchesNeverVisited = showNeverVisited ? m.last_visit === 'Nunca' : true;

    return matchesSearch && matchesStatus && matchesNeverVisited;
  });

  const getStatusStyle = (statusName: string) => {
    const status = statuses.find(s => s.name === statusName);
    const color = status?.color_class || 'gray';

    switch (color) {
      case 'rose': return 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300';
      case 'orange': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300';
      case 'emerald': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300';
      case 'blue': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  const getStatusDot = (statusName: string) => {
    const status = statuses.find(s => s.name === statusName);
    const color = status?.color_class || 'gray';

    switch (color) {
      case 'rose': return 'bg-rose-500 animate-pulse';
      case 'orange': return 'bg-orange-500';
      case 'emerald': return 'bg-emerald-500';
      case 'blue': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="flex-1 px-6 md:px-12 py-8 w-full max-w-[1440px] mx-auto overflow-y-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
        <div>
          <h1 className="text-4xl font-black tracking-tight mb-2">Directorio de Miembros</h1>
          <p className="text-gray-500 text-lg">Administre las visitas y el estado de su congregación.</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 px-6 py-4 rounded-xl shadow-sm transition-all transform hover:scale-[1.02]"
          >
            <span className="material-symbols-outlined">upload_file</span>
            <span className="text-lg font-bold">Importar</span>
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 bg-primary hover:bg-blue-700 text-white px-6 py-4 rounded-xl shadow-lg shadow-primary/30 transition-all transform hover:scale-[1.02]"
          >
            <span className="material-symbols-outlined">add</span>
            <span className="text-lg font-bold">Agregar Miembro</span>
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-[#151c2b] p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 mb-8">
        <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center">
          <div className="flex-1 relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <span className="material-symbols-outlined text-gray-400 text-2xl group-focus-within:text-primary transition-colors">search</span>
            </div>
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-12 pr-4 py-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-lg placeholder:text-gray-400 focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none"
              placeholder="Buscar por nombre..."
              type="text"
            />
          </div>

          <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-4 md:h-[60px] cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800/80 transition-colors" onClick={() => setShowNeverVisited(!showNeverVisited)}>
            <div className={`size-5 rounded border flex items-center justify-center transition-colors ${showNeverVisited ? 'bg-primary border-primary' : 'border-gray-400 bg-white dark:bg-transparent'}`}>
              {showNeverVisited && <span className="material-symbols-outlined text-white text-sm font-bold">check</span>}
            </div>
            <span className="text-gray-700 dark:text-gray-300 font-bold select-none whitespace-nowrap">
              Nunca Visitados
            </span>
          </div>

          <div className="w-full md:w-64 relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <span className="material-symbols-outlined text-gray-400">filter_list</span>
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="block w-full pl-12 pr-10 py-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-lg focus:ring-2 focus:ring-primary appearance-none cursor-pointer"
            >
              <option value="all">Todos los Estados</option>
              {statuses.map(status => (
                <option key={status.id} value={status.name}>{status.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-[#151c2b] rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-800">
                <th className="px-6 py-5 text-sm font-bold uppercase tracking-wider text-gray-400 w-1/3">Nombre</th>
                <th className="px-6 py-5 text-sm font-bold uppercase tracking-wider text-gray-400">Última Visita</th>
                <th className="px-6 py-5 text-sm font-bold uppercase tracking-wider text-gray-400">Estado</th>
                <th className="px-6 py-5 text-sm font-bold uppercase tracking-wider text-gray-400 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center">
                    <div className="flex justify-center">
                      <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
                    </div>
                  </td>
                </tr>
              ) : filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                    No se encontraron miembros. ¡Agregue el primero!
                  </td>
                </tr>
              ) : (
                filteredMembers.map((member) => (
                  <tr key={member.id} className="group hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors cursor-pointer" onClick={() => navigate(`/members/${member.id}`)}>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-4">
                        <img src={member.avatar_url || 'https://picsum.photos/200'} className="size-12 rounded-full object-cover" alt="" />
                        <div>
                          <p className="text-xl font-bold group-hover:text-primary transition-colors">{member.first_name} {member.last_name}</p>
                          <p className="text-sm text-gray-500">{member.role}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2 text-gray-500">
                        <span className="material-symbols-outlined text-lg">calendar_today</span>
                        <span className="text-lg font-medium">{member.last_visit}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold ${getStatusStyle(member.status)}`}>
                        <span className={`size-2 rounded-full ${getStatusDot(member.status)}`}></span>
                        {member.status}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/members/${member.id}`);
                        }}
                        className="text-primary font-bold text-sm inline-flex items-center gap-1 p-2 rounded-lg hover:bg-primary/10 transition-colors"
                      >
                        Ver Perfil
                        <span className="material-symbols-outlined text-lg">arrow_forward</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {!loading && filteredMembers.length > 0 && (
          <div className="flex items-center justify-between px-6 py-4 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-800">
            <span className="text-sm text-gray-500">
              Mostrando <span className="font-bold text-gray-900 dark:text-white">{filteredMembers.length}</span> miembros
            </span>
          </div>
        )}
      </div>

      <AddMemberModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={fetchMembers}
      />
      <BulkImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={fetchMembers}
      />
    </div>
  );
};

export default MemberDirectory;
