
import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import Swal from 'sweetalert2';

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
    const [statuses, setStatuses] = useState<Status[]>([]);
    const [outcomes, setOutcomes] = useState<Outcome[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'statuses' | 'outcomes'>('statuses');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const { data: statusData, error: statusError } = await supabase.from('member_statuses').select('*').order('created_at');
            if (statusError) throw statusError;
            setStatuses(statusData || []);

            const { data: outcomeData, error: outcomeError } = await supabase.from('visit_outcomes').select('*').order('created_at');
            if (outcomeError) throw outcomeError;
            setOutcomes(outcomeData || []);
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
        <div className="flex-1 px-6 md:px-12 py-8 w-full max-w-[1440px] mx-auto overflow-y-auto bg-background-light dark:bg-background-dark">
            <div className="mb-8">
                <h1 className="text-4xl font-black tracking-tight mb-2">Mantenimiento</h1>
                <p className="text-gray-500 text-lg">Gestiona las opciones de configuración del sistema.</p>
            </div>

            <div className="flex space-x-4 border-b border-gray-200 dark:border-gray-700 mb-6">
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
                                <button onClick={handleAddStatus} className="flex items-center gap-2 bg-primary hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors">
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
                                <button onClick={handleAddOutcome} className="flex items-center gap-2 bg-primary hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors">
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
                </>
            )}
        </div>
    );
};

export default Maintenance;
