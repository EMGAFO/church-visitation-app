
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import Swal from 'sweetalert2';

interface Member {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    address: string;
    role: string;
    status: string;
    avatar_url: string;
}

interface Visit {
    id: string;
    visit_date: string;
    notes: string;
    outcome: string;
    created_at: string;
}

import ChatBot from '../components/ChatBot';
import AddMemberModal from '../components/AddMemberModal';

const MemberProfile: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [member, setMember] = useState<Member | null>(null);
    const [visits, setVisits] = useState<Visit[]>([]);
    const [loading, setLoading] = useState(true);
    const [showVisitModal, setShowVisitModal] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [newVisit, setNewVisit] = useState({ date: new Date().toISOString().split('T')[0], notes: '', outcome: '' });
    const [outcomes, setOutcomes] = useState<{ id: string, name: string }[]>([]);

    useEffect(() => {
        if (id) {
            fetchMemberData();
        }
        fetchOutcomes();
    }, [id]);

    const fetchOutcomes = async () => {
        const { data } = await supabase.from('visit_outcomes').select('*').order('name');
        if (data) setOutcomes(data);
    };

    const fetchMemberData = async () => {
        try {
            setLoading(true);
            const { data: memberData, error: memberError } = await supabase
                .from('members')
                .select('*')
                .eq('id', id)
                .single();

            if (memberError) throw memberError;
            setMember(memberData);

            const { data: visitsData, error: visitsError } = await supabase
                .from('visits')
                .select('*')
                .eq('member_id', id)
                .order('visit_date', { ascending: false });

            if (visitsError) throw visitsError;
            setVisits(visitsData || []);

        } catch (error) {
            console.error('Error fetching member:', error);
            Swal.fire({
                title: 'Error',
                text: 'Error al cargar el perfil',
                icon: 'error',
                confirmButtonText: 'Aceptar',
                confirmButtonColor: '#DC2626'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleAddVisit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !member) return;

        try {
            const { error } = await supabase.from('visits').insert([
                {
                    member_id: member.id,
                    visitor_id: user.id,
                    visit_date: newVisit.date,
                    notes: newVisit.notes,
                    outcome: newVisit.outcome
                }
            ]);

            if (error) throw error;

            setShowVisitModal(false);
            setNewVisit({ date: new Date().toISOString().split('T')[0], notes: '', outcome: '' });
            fetchMemberData();
        } catch (error) {
            console.error('Error adding visit:', error);
            Swal.fire({
                title: 'Error',
                text: 'Error al guardar la visita',
                icon: 'error',
                confirmButtonText: 'Aceptar',
                confirmButtonColor: '#DC2626'
            });
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!member) return <div>Member not found</div>;

    return (
        <div className="flex-1 px-4 md:px-12 py-6 md:py-8 w-full max-w-[1440px] mx-auto overflow-y-auto">
            <button onClick={() => navigate('/members')} className="flex items-center gap-2 text-gray-500 hover:text-primary mb-6 transition-colors font-medium">
                <span className="material-symbols-outlined">arrow_back</span>
                Volver al Directorio
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Profile Card */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white dark:bg-[#151c2b] p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 text-center">
                        <div className="relative inline-block mb-4">
                            <img src={member.avatar_url} className="size-32 rounded-full object-cover border-4 border-white dark:border-[#151c2b] shadow-lg" alt="" />
                            <div className={`absolute bottom-2 right-2 size-6 rounded-full border-4 border-white dark:border-[#151c2b] ${member.status === 'Urgent' ? 'bg-red-500' :
                                member.status === 'Requires Follow-up' ? 'bg-orange-500' : 'bg-emerald-500'
                                }`}></div>
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{member.first_name} {member.last_name}</h1>
                        <p className="text-primary font-medium bg-primary/10 inline-block px-3 py-1 rounded-full text-sm mb-6">{member.role}</p>

                        <div className="space-y-4 text-left">
                            <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
                                <span className="material-symbols-outlined text-gray-400">mail</span>
                                <span>{member.email || 'No email'}</span>
                            </div>
                            <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
                                <span className="material-symbols-outlined text-gray-400">call</span>
                                <span>{member.phone || 'No phone'}</span>
                            </div>
                            <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
                                <span className="material-symbols-outlined text-gray-400">location_on</span>
                                <span>{member.address || 'No address'}</span>
                            </div>
                        </div>

                        <button
                            onClick={() => {
                                setIsEditModalOpen(true);
                            }}
                            className="w-full mt-8 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
                        >
                            <span className="material-symbols-outlined">edit</span>
                            Editar Perfil
                        </button>
                    </div>
                </div>

                <AddMemberModal
                    isOpen={isEditModalOpen}
                    onClose={() => setIsEditModalOpen(false)}
                    onSuccess={() => {
                        fetchMemberData();
                    }}
                    editMember={member}
                />

                {/* Visit History */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white dark:bg-[#151c2b] p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Historial de Visitas</h2>
                            <button
                                onClick={() => setShowVisitModal(true)}
                                className="bg-primary hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-bold shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2"
                            >
                                <span className="material-symbols-outlined">add_circle</span>
                                Registrar Visita
                            </button>
                        </div>

                        <div className="space-y-4">
                            {visits.length === 0 ? (
                                <div className="text-center py-12 text-gray-400">
                                    <span className="material-symbols-outlined text-4xl mb-2">history_edu</span>
                                    <p>No hay visitas registradas aún.</p>
                                </div>
                            ) : (
                                visits.map((visit) => (
                                    <div key={visit.id} className="border-l-4 border-primary/30 pl-4 py-1">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-sm font-bold text-gray-900 dark:text-white">{new Date(visit.visit_date).toLocaleDateString('es-ES')}</span>
                                            <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-500 px-2 py-1 rounded-full">{visit.outcome}</span>
                                        </div>
                                        <p className="text-gray-600 dark:text-gray-300">{visit.notes}</p>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {showVisitModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-white dark:bg-[#1a2332] rounded-2xl w-full max-w-lg shadow-2xl p-6 border border-gray-100 dark:border-gray-700">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Registrar Visita</h2>
                            <button onClick={() => setShowVisitModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        <form onSubmit={handleAddVisit} className="space-y-4">
                            <div>
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Fecha</label>
                                <input
                                    type="date"
                                    required
                                    value={newVisit.date}
                                    onChange={(e) => setNewVisit({ ...newVisit, date: e.target.value })}
                                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Motivo</label>
                                <div className="relative">
                                    <select
                                        required
                                        value={newVisit.outcome}
                                        onChange={(e) => setNewVisit({ ...newVisit, outcome: e.target.value })}
                                        className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all appearance-none cursor-pointer"
                                    >
                                        <option value="" disabled>Seleccione un motivo...</option>
                                        {outcomes.map(outcome => (
                                            <option key={outcome.id} value={outcome.name}>{outcome.name}</option>
                                        ))}
                                    </select>
                                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-500">
                                        <span className="material-symbols-outlined">expand_more</span>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Notas</label>
                                <textarea
                                    required
                                    rows={4}
                                    placeholder="Detalles sobre la visita..."
                                    value={newVisit.notes}
                                    onChange={(e) => setNewVisit({ ...newVisit, notes: e.target.value })}
                                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none"
                                />
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowVisitModal(false)}
                                    className="flex-1 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-bold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-3 rounded-xl bg-primary hover:bg-blue-600 text-white font-bold shadow-lg shadow-blue-500/20 transition-all"
                                >
                                    Guardar Visita
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MemberProfile;
