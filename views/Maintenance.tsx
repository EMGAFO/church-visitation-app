
import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import Swal from 'sweetalert2';
import { useAuth } from '../contexts/AuthContext';
import { UserProfile } from '../types';

interface Status {
    id: string;
    name: string;
    color_class: string;
}

interface Outcome {
    id: string;
    name: string;
}

const Maintenance: React.FC = () => {
    const { profile: currentUserProfile } = useAuth();
    const [statuses, setStatuses] = useState<Status[]>([]);
    const [outcomes, setOutcomes] = useState<Outcome[]>([]);
    const [profiles, setProfiles] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'statuses' | 'outcomes' | 'users' | 'profile'>('profile');

    const isAdmin = currentUserProfile?.role === 'Administrador';

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    const fetchData = async () => {
        try {
            setLoading(true);
            if (activeTab === 'statuses') {
                const { data: statusData, error: statusError } = await supabase.from('member_statuses').select('*').order('created_at');
                if (statusError) throw statusError;
                setStatuses(statusData || []);
            } else if (activeTab === 'outcomes') {
                const { data: outcomeData, error: outcomeError } = await supabase.from('visit_outcomes').select('*').order('created_at');
                if (outcomeError) throw outcomeError;
                setOutcomes(outcomeData || []);
            } else if (activeTab === 'users' && isAdmin) {
                const { data: profileData, error: profileError } = await supabase.from('profiles').select('*').order('full_name');
                if (profileError) throw profileError;
                setProfiles(profileData || []);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddStatus = async () => {
        const { value: formValues } = await Swal.fire({
            title: 'Nuevo Estado',
            html:
                '<input id="swal-input1" class="swal2-input" placeholder="Nombre del Estado">' +
                '<select id="swal-input2" class="swal2-input">' +
                '  <option value="gray">Gris (Neutro)</option>' +
                '  <option value="rose">Rojo (Urgente)</option>' +
                '  <option value="orange">Naranja (Seguimiento)</option>' +
                '  <option value="emerald">Verde (Buen Estado)</option>' +
                '  <option value="blue">Azul (Informativo)</option>' +
                '</select>',
            focusConfirm: false,
            preConfirm: () => {
                return [
                    (document.getElementById('swal-input1') as HTMLInputElement).value,
                    (document.getElementById('swal-input2') as HTMLSelectElement).value
                ]
            }
        });

        if (formValues) {
            const [name, color] = formValues;
            if (!name) return;

            const { error } = await supabase.from('member_statuses').insert([{ name, color_class: color }]);
            if (error) {
                Swal.fire('Error', error.message, 'error');
            } else {
                Swal.fire('Guardado', 'Estado agregado correctamente', 'success');
                fetchData();
            }
        }
    };

    const handleDeleteStatus = async (id: string) => {
        const result = await Swal.fire({
            title: '¿Estás seguro?',
            text: "No podrás revertir esto",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Sí, borrar',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            const { error } = await supabase.from('member_statuses').delete().eq('id', id);
            if (error) {
                Swal.fire('Error', error.message, 'error');
            } else {
                Swal.fire('Borrado', 'El estado ha sido eliminado.', 'success');
                fetchData();
            }
        }
    }

    const handleAddOutcome = async () => {
        const { value: name } = await Swal.fire({
            title: 'Nuevo Motivo de Visita',
            input: 'text',
            inputLabel: 'Nombre del Motivo',
            showCancelButton: true,
            inputValidator: (value) => {
                if (!value) {
                    return '¡Debes escribir algo!'
                }
            }
        });

        if (name) {
            const { error } = await supabase.from('visit_outcomes').insert([{ name }]);
            if (error) {
                Swal.fire('Error', error.message, 'error');
            } else {
                Swal.fire('Guardado', 'Motivo agregado correctamente', 'success');
                fetchData();
            }
        }
    };

    const handleDeleteOutcome = async (id: string) => {
        const result = await Swal.fire({
            title: '¿Estás seguro?',
            text: "No podrás revertir esto",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Sí, borrar',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            const { error } = await supabase.from('visit_outcomes').delete().eq('id', id);
            if (error) {
                Swal.fire('Error', error.message, 'error');
            } else {
                Swal.fire('Borrado', 'El motivo ha sido eliminado.', 'success');
                fetchData();
            }
        }
    }

    const handleUpdateUserRole = async (targetProfile: UserProfile) => {
        const { value: role } = await Swal.fire({
            title: `Actualizar rol de ${targetProfile.full_name}`,
            input: 'select',
            inputOptions: {
                'Administrador': 'Administrador',
                'Pastor': 'Pastor',
                'Anciano': 'Anciano',
                'Ayudante de Anciano': 'Ayudante de Anciano'
            },
            inputValue: targetProfile.role || 'Ayudante de Anciano',
            showCancelButton: true,
            inputValidator: (value) => {
                if (!value) {
                    return '¡Debes seleccionar un rol!'
                }
            }
        });

        if (role) {
            const { error } = await supabase
                .from('profiles')
                .update({ role })
                .eq('id', targetProfile.id);

            if (error) {
                Swal.fire('Error', error.message, 'error');
            } else {
                Swal.fire('Guardado', 'Rol actualizado correctamente', 'success');
                fetchData();
            }
        }
    };

    const getColorPreview = (color: string) => {
        switch (color) {
            case 'rose': return 'bg-rose-100 text-rose-800';
            case 'orange': return 'bg-orange-100 text-orange-800';
            case 'emerald': return 'bg-emerald-100 text-emerald-800';
            case 'blue': return 'bg-blue-100 text-blue-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    }

    return (
        <div className="flex-1 px-4 md:px-12 py-6 md:py-8 w-full max-w-[1440px] mx-auto overflow-y-auto bg-background-light dark:bg-background-dark">
            <div className="mb-6 md:mb-8">
                <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-2">Mantenimiento</h1>
                <p className="text-gray-500 text-base md:text-lg">Gestiona las opciones de configuración del sistema.</p>
            </div>

            <div className="flex space-x-4 border-b border-gray-200 dark:border-gray-700 mb-6 overflow-x-auto whitespace-nowrap pb-1">
                <button
                    className={`py-2 px-4 font-medium transition-colors border-b-2 ${activeTab === 'statuses' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                    onClick={() => setActiveTab('statuses')}
                >
                    Estados de Miembros
                </button>
                <button
                    className={`py-2 px-4 font-medium transition-colors border-b-2 ${activeTab === 'outcomes' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                    onClick={() => setActiveTab('outcomes')}
                >
                    Motivos de Visita
                </button>
                <button
                    className={`py-2 px-4 font-medium transition-colors border-b-2 ${activeTab === 'profile' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                    onClick={() => setActiveTab('profile')}
                >
                    Mi Perfil
                </button>
                {isAdmin && (
                    <button
                        className={`py-2 px-4 font-medium transition-colors border-b-2 ${activeTab === 'users' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                        onClick={() => setActiveTab('users')}
                    >
                        Gestionar Usuarios
                    </button>
                )}
            </div>

            {loading ? (
                <div className="flex justify-center p-12">
                    <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
                </div>
            ) : (
                <>
                    {activeTab === 'statuses' && (
                        <div className="bg-white dark:bg-[#151c2b] rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-bold">Estados Configurados</h2>
                                <button onClick={handleAddStatus} className="flex items-center gap-2 bg-primary hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors text-sm">
                                    <span className="material-symbols-outlined">add</span>
                                    Nuevo Estado
                                </button>
                            </div>
                            <div className="grid gap-4">
                                {statuses.map(status => (
                                    <div key={status.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-800">
                                        <div className="flex items-center gap-4">
                                            <span className={`px-3 py-1 rounded-full text-sm font-bold ${getColorPreview(status.color_class)}`}>
                                                {status.name}
                                            </span>
                                        </div>
                                        <button onClick={() => handleDeleteStatus(status.id)} className="text-gray-400 hover:text-red-500 transition-colors">
                                            <span className="material-symbols-outlined">delete</span>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'outcomes' && (
                        <div className="bg-white dark:bg-[#151c2b] rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-bold">Motivos de Visita</h2>
                                <button onClick={handleAddOutcome} className="flex items-center gap-2 bg-primary hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors text-sm">
                                    <span className="material-symbols-outlined">add</span>
                                    Nuevo Motivo
                                </button>
                            </div>
                            <div className="grid gap-4">
                                {outcomes.map(outcome => (
                                    <div key={outcome.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-800">
                                        <span className="font-medium text-gray-700 dark:text-gray-300">{outcome.name}</span>
                                        <button onClick={() => handleDeleteOutcome(outcome.id)} className="text-gray-400 hover:text-red-500 transition-colors">
                                            <span className="material-symbols-outlined">delete</span>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'users' && isAdmin && (
                        <div className="bg-white dark:bg-[#151c2b] rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-bold">Usuarios del Sistema</h2>
                                <p className="text-sm text-gray-500">Administra los roles de acceso.</p>
                            </div>
                            <div className="grid gap-4">
                                {profiles.map(p => (
                                    <div key={p.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-800">
                                        <div className="flex items-center gap-4">
                                            <img
                                                src={p.avatar_url || "https://picsum.photos/id/1012/100/100"}
                                                alt={p.full_name || ""}
                                                className="w-10 h-10 rounded-full object-cover"
                                            />
                                            <div className="flex flex-col">
                                                <span className="font-bold text-gray-900 dark:text-white">
                                                    {(p.full_name && !p.full_name.includes('@')) ? p.full_name : (p.full_name?.split('@')[0] || 'Sin nombre')}
                                                </span>
                                                <span className="text-xs text-gray-500">
                                                    {p.role || 'Sin rol'}
                                                </span>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleUpdateUserRole(p)}
                                            className="flex items-center gap-2 text-primary hover:text-blue-700 transition-colors text-sm font-bold"
                                        >
                                            <span className="material-symbols-outlined">edit</span>
                                            Editar Rol
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    {activeTab === 'profile' && currentUserProfile && (
                        <div className="bg-white dark:bg-[#151c2b] rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-6 max-w-2xl">
                            <h2 className="text-xl font-bold mb-6">Mi Perfil</h2>
                            <div className="space-y-6">
                                <div className="flex items-center gap-6 pb-6 border-b border-gray-100 dark:border-gray-800">
                                    <img
                                        src={currentUserProfile.avatar_url || "https://picsum.photos/id/1012/100/100"}
                                        alt={currentUserProfile.full_name || ""}
                                        className="w-20 h-20 rounded-full object-cover ring-4 ring-primary/10"
                                    />
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">Rol del Sistema</p>
                                        <p className="text-lg font-bold text-primary">{currentUserProfile.role || 'Usuario'}</p>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Nombre Completo</label>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                id="profile-name"
                                                defaultValue={currentUserProfile.full_name || ''}
                                                placeholder="Tu nombre real"
                                                className="flex-1 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/20 outline-none"
                                            />
                                            <button
                                                onClick={async () => {
                                                    const newName = (document.getElementById('profile-name') as HTMLInputElement).value;
                                                    if (!newName) return;
                                                    const { error } = await supabase
                                                        .from('profiles')
                                                        .update({ full_name: newName })
                                                        .eq('id', currentUserProfile.id);

                                                    if (error) {
                                                        Swal.fire('Error', error.message, 'error');
                                                    } else {
                                                        Swal.fire({
                                                            title: '¡Actualizado!',
                                                            text: 'Tu nombre ha sido actualizado.',
                                                            icon: 'success',
                                                            timer: 2000,
                                                            showConfirmButton: false
                                                        }).then(() => {
                                                            window.location.reload();
                                                        });
                                                    }
                                                }}
                                                className="bg-primary text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-600 transition-colors"
                                            >
                                                Guardar
                                            </button>
                                        </div>
                                        <p className="mt-2 text-xs text-gray-500">Este es el nombre que se mostrará en la barra lateral y en todo el sistema.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default Maintenance;
