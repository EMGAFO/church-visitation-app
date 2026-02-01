
import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import Swal from 'sweetalert2';
import { useAuth } from '../contexts/AuthContext';

interface Routine {
    id: string;
    name: string;
    description: string;
    created_at: string;
}

const Routines: React.FC = () => {
    const { user } = useAuth();
    const [routines, setRoutines] = useState<Routine[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [newRoutineName, setNewRoutineName] = useState('');
    const [newRoutineDesc, setNewRoutineDesc] = useState('');

    useEffect(() => {
        if (user) {
            fetchRoutines();
        }
    }, [user]);

    const fetchRoutines = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('routines')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setRoutines(data || []);
        } catch (error) {
            console.error('Error fetching routines:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateRoutine = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        try {
            const { error } = await supabase.from('routines').insert([
                {
                    user_id: user.id,
                    name: newRoutineName,
                    description: newRoutineDesc,
                    content: {}, // Default empty content
                },
            ]);

            if (error) throw error;

            setNewRoutineName('');
            setNewRoutineDesc('');
            setShowModal(false);
            fetchRoutines();
        } catch (error) {
            console.error('Error creating routine:', error);
            console.error('Error saving routine:', error);
            Swal.fire({
                title: 'Error',
                text: 'Error al guardar la rutina',
                icon: 'error',
                confirmButtonText: 'Aceptar',
                confirmButtonColor: '#DC2626'
            });
        }
    };

    const handleDeleteRoutine = async (id: string) => {
        if (!confirm('Are you sure you want to delete this routine?')) return;

        try {
            const { error } = await supabase
                .from('routines')
                .delete()
                .eq('id', id);

            if (error) throw error;
            fetchRoutines();
        } catch (error) {
            console.error('Error deleting routine:', error);
        }
    };

    return (
        <div className="flex-1 h-full overflow-y-auto bg-background-light dark:bg-background-dark p-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold mb-1 text-gray-900 dark:text-white">Pastoral Routines</h1>
                    <p className="text-gray-500 dark:text-gray-400">Manage your daily pastoral care routines and tasks.</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="flex items-center gap-2 bg-primary hover:bg-blue-600 text-white px-5 py-2.5 rounded-lg shadow-lg shadow-blue-500/20 transition-all hover:scale-105 active:scale-95"
                >
                    <span className="material-symbols-outlined">add</span>
                    New Routine
                </button>
            </div>

            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
                </div>
            ) : routines.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-center p-8 bg-white dark:bg-surface-dark rounded-2xl border border-gray-100 dark:border-gray-800 border-dashed">
                    <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-full mb-4">
                        <span className="material-symbols-outlined text-4xl text-gray-400">event_busy</span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">No routines found</h3>
                    <p className="text-gray-500 dark:text-gray-400 max-w-sm mb-6">Create your first routine to start tracking your pastoral activities.</p>
                    <button
                        onClick={() => setShowModal(true)}
                        className="text-primary font-medium hover:text-blue-600"
                    >
                        Create Routine
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {routines.map((routine) => (
                        <div
                            key={routine.id}
                            className="bg-white dark:bg-surface-dark p-6 rounded-xl border border-gray-100 dark:border-gray-800 hover:shadow-lg transition-all group relative"
                        >
                            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => handleDeleteRoutine(routine.id)}
                                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                    title="Delete Routine"
                                >
                                    <span className="material-symbols-outlined text-xl">delete</span>
                                </button>
                            </div>
                            <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-center text-primary mb-4">
                                <span className="material-symbols-outlined text-2xl">list_alt</span>
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{routine.name}</h3>
                            <p className="text-gray-500 dark:text-gray-400 text-sm line-clamp-3 mb-4">
                                {routine.description || 'No description provided.'}
                            </p>
                            <div className="flex items-center justify-between text-xs text-gray-400 border-t border-gray-100 dark:border-gray-800 pt-4">
                                <span>Created {new Date(routine.created_at).toLocaleDateString()}</span>
                                <span className="flex items-center gap-1 text-primary">
                                    View Details <span className="material-symbols-outlined text-sm">arrow_forward</span>
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-white dark:bg-surface-dark rounded-2xl w-full max-w-md shadow-2xl p-6 border border-gray-100 dark:border-gray-700">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">New Routine</h2>
                            <button
                                onClick={() => setShowModal(false)}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                            >
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        <form onSubmit={handleCreateRoutine} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
                                <input
                                    type="text"
                                    value={newRoutineName}
                                    onChange={(e) => setNewRoutineName(e.target.value)}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:bg-white dark:focus:bg-gray-800 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                                    placeholder="e.g., Morning Devotion"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                                <textarea
                                    rows={3}
                                    value={newRoutineDesc}
                                    onChange={(e) => setNewRoutineDesc(e.target.value)}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:bg-white dark:focus:bg-gray-800 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none resize-none"
                                    placeholder="Describe the routine activities..."
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 font-medium transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 rounded-lg bg-primary hover:bg-blue-600 text-white font-medium shadow-lg shadow-blue-500/20 transition-all"
                                >
                                    Create Routine
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Routines;
