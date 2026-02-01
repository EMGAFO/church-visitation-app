
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
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      setLoading(true);

      // Fetch members
      const { data: membersData, error: membersError } = await supabase
        .from('members')
        .select('*')
        .order('last_name');

      if (membersError) throw membersError;

      // Ideally we would join with visits to get last visit date, or store it on the member record.
      // For now, let's fetch visits separately or just show 'N/A' if complex query is needed.
      // We'll simplisticly fetch recent visits and map them. This is not performant for huge datasets, but okay for MVP.

      const { data: visitsData, error: visitsError } = await supabase
        .from('visits')
        .select('member_id, visit_date')
        .order('visit_date', { ascending: false });

      if (visitsError) throw visitsError;

      const membersWithVisits = membersData?.map(member => {
        const lastVisit = visitsData?.find(v => v.member_id === member.id);
        return {
          ...member,
          last_visit: lastVisit ? new Date(lastVisit.visit_date).toLocaleDateString('es-ES') : 'Nunca'
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
    return matchesSearch && matchesStatus;
  });

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'Urgent': return 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300';
      case 'Requires Follow-up': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300';
      case 'Good Standing': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300';
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  const getStatusDot = (status: string) => {
    switch (status) {
      case 'Urgent': return 'bg-rose-500 animate-pulse';
      case 'Requires Follow-up': return 'bg-orange-500';
      case 'Good Standing': return 'bg-emerald-500';
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
              <option value="Urgent">Urgente</option>
              <option value="Requires Follow-up">Requiere Seguimiento</option>
              <option value="Good Standing">Buen Estado</option>
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
                        {member.status === 'Good Standing' ? 'Buen Estado' :
                          member.status === 'Urgent' ? 'Urgente' :
                            member.status === 'Requires Follow-up' ? 'Requiere Seguimiento' : member.status}
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
