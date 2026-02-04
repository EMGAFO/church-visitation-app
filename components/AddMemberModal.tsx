
import React, { useState } from 'react';
import { supabase } from '../services/supabase';
import Swal from 'sweetalert2';

interface AddMemberModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    editMember?: any;
}

const AddMemberModal: React.FC<AddMemberModalProps> = ({ isOpen, onClose, onSuccess, editMember }) => {
    const [loading, setLoading] = useState(false);
    const [families, setFamilies] = useState<{ id: string, name: string }[]>([]);
    const [memberSearch, setMemberSearch] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [selectedFamilyMember, setSelectedFamilyMember] = useState<any | null>(null);
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        address: '',
        role: 'Member',
        status: 'Good Standing',
        family_id: '',
        latitude: null as number | null,
        longitude: null as number | null
    });

    React.useEffect(() => {
        if (isOpen && editMember) {
            setFormData({
                first_name: editMember.first_name || '',
                last_name: editMember.last_name || '',
                email: editMember.email || '',
                phone: editMember.phone || '',
                address: editMember.address || '',
                role: editMember.role || 'Member',
                status: editMember.status || 'Good Standing',
                family_id: editMember.family_id || '',
                latitude: editMember.latitude || null,
                longitude: editMember.longitude || null
            });
        } else if (isOpen) {
            setFormData({
                first_name: '',
                last_name: '',
                email: '',
                phone: '',
                address: '',
                role: 'Member',
                status: 'Good Standing',
                family_id: '',
                latitude: null,
                longitude: null
            });
        }
    }, [isOpen, editMember]);

    const handleAutoLocate = async () => {
        if (!formData.address) {
            Swal.fire({
                title: 'Dirección vacía',
                text: 'Por favor, escribe una dirección primero para poder localizarla.',
                icon: 'info',
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 3000
            });
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(formData.address + ", Dominican Republic")}`);
            const data = await response.json();

            if (data && data.length > 0) {
                const { lat, lon } = data[0];
                setFormData(prev => ({
                    ...prev,
                    latitude: parseFloat(lat),
                    longitude: parseFloat(lon)
                }));
                Swal.fire({
                    title: '¡Ubicación Encontrada!',
                    text: 'Se ha vinculado el punto en el mapa basándose en la dirección.',
                    icon: 'success',
                    toast: true,
                    position: 'top-end',
                    showConfirmButton: false,
                    timer: 3000
                });
            } else {
                Swal.fire({
                    title: 'No encontrado',
                    text: 'No pudimos encontrar esa dirección exacta. Intenta que sea más general (ej: Sector, Ciudad).',
                    icon: 'warning'
                });
            }
        } catch (error) {
            Swal.fire('Error', 'Hubo un problema al conectar con el servicio de mapas.', 'error');
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => {
        if (memberSearch.length > 2) {
            searchMembers();
        } else {
            setSearchResults([]);
        }
    }, [memberSearch]);

    const searchMembers = async () => {
        const { data } = await supabase
            .from('members')
            .select('id, first_name, last_name, avatar_url, family_id, families(name)')
            .or(`first_name.ilike.%${memberSearch}%,last_name.ilike.%${memberSearch}%`)
            .limit(5);
        if (data) setSearchResults(data);
    };

    const fetchFamilies = async () => {
        const { data } = await supabase.from('families').select('id, name').order('name');
        if (data) setFamilies(data);
    };

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const submissionData = { ...formData };
            if (!submissionData.family_id) {
                // @ts-ignore
                delete submissionData.family_id;
            }

            // AUTO-GEOLOCATE: If we have an address but no coordinates, try to find them automatically
            if (submissionData.address && (!submissionData.latitude || !submissionData.longitude)) {
                try {
                    const geoRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(submissionData.address + ", Dominican Republic")}`);
                    const geoData = await geoRes.json();
                    if (geoData && geoData.length > 0) {
                        submissionData.latitude = parseFloat(geoData[0].lat);
                        submissionData.longitude = parseFloat(geoData[0].lon);
                    }
                } catch (geoErr) {
                    console.error('Quietly failed auto-geolocate on submit:', geoErr);
                }
            }

            let error;
            if (editMember) {
                const { error: updateError } = await supabase
                    .from('members')
                    .update(submissionData)
                    .eq('id', editMember.id);
                error = updateError;
            } else {
                const { error: insertError } = await supabase
                    .from('members')
                    .insert([submissionData]);
                error = insertError;
            }

            if (error) throw error;

            await Swal.fire({
                title: editMember ? '¡Miembro Actualizado!' : '¡Miembro Agregado!',
                text: editMember ? 'Los datos han sido actualizados correctamente.' : 'El miembro ha sido registrado exitosamente.',
                icon: 'success',
                confirmButtonText: 'Aceptar',
                confirmButtonColor: '#2563EB'
            });

            onSuccess();
            onClose();
            // Reset form
            setFormData({
                first_name: '',
                last_name: '',
                email: '',
                phone: '',
                address: '',
                role: 'Member',
                status: 'Good Standing',
                family_id: '',
                latitude: null,
                longitude: null
            });
        } catch (error) {
            console.error('Error adding member:', error);
            Swal.fire({
                title: 'Error',
                text: 'No se pudo crear el miembro.',
                icon: 'error',
                confirmButtonText: 'Aceptar',
                confirmButtonColor: '#DC2626'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white dark:bg-[#1a2332] rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-700">
                <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                        {editMember ? 'Editar Datos del Miembro' : 'Agregar Nuevo Miembro'}
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Nombre</label>
                            <input
                                name="first_name"
                                required
                                value={formData.first_name}
                                onChange={handleChange}
                                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                placeholder="Juan"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Apellido</label>
                            <input
                                name="last_name"
                                required
                                value={formData.last_name}
                                onChange={handleChange}
                                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                placeholder="Pérez"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Correo Electrónico</label>
                            <input
                                name="email"
                                type="email"
                                value={formData.email}
                                onChange={handleChange}
                                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                placeholder="juan@ejemplo.com"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Teléfono</label>
                            <input
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                placeholder="+1 (555) 000-0000"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Dirección</label>
                            <div className="flex items-center gap-2">
                                {formData.latitude ? (
                                    <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-500 uppercase">
                                        <span className="material-symbols-outlined text-xs">location_on</span>
                                        Ubicado en Mapa
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-1 text-[10px] font-bold text-orange-500 uppercase">
                                        <span className="material-symbols-outlined text-xs">location_off</span>
                                        Sin Ubicación
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="relative group">
                            <input
                                name="address"
                                value={formData.address}
                                onChange={handleChange}
                                className="w-full pl-4 pr-12 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all shadow-sm"
                                placeholder="Sector, Ciudad (ej: Pueblo Nuevo, Santiago)"
                            />
                            <button
                                type="button"
                                onClick={handleAutoLocate}
                                title="Obtener coordenadas desde la dirección"
                                className="absolute right-2 top-1.5 p-1.5 bg-primary/10 text-primary hover:bg-primary/20 rounded-lg transition-all focus:ring-2 focus:ring-primary/30"
                            >
                                <span className="material-symbols-outlined">map</span>
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Rol</label>
                            <select
                                name="role"
                                value={formData.role}
                                onChange={handleChange}
                                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                            >
                                <option value="Member">Miembro</option>
                                <option value="Elder">Anciano</option>
                                <option value="Deacon">Diácono</option>
                                <option value="Deaconess">Diaconisa</option>
                                <option value="Pastor">Pastor</option>
                                <option value="Visitor">Visita</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Estado</label>
                            <select
                                name="status"
                                value={formData.status}
                                onChange={handleChange}
                                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                            >
                                <option value="Good Standing">Buen Estado</option>
                                <option value="Requires Follow-up">Requiere Seguimiento</option>
                                <option value="Urgent">Urgente</option>
                                <option value="Visitor">Visita</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-4 pt-2">
                        <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Vincular a Familia</label>

                        {!selectedFamilyMember ? (
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <span className="material-symbols-outlined text-gray-400">search</span>
                                </div>
                                <input
                                    type="text"
                                    value={memberSearch}
                                    onChange={(e) => setMemberSearch(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                    placeholder="Busca a un familiar (ej: Juan Pérez)..."
                                />
                                {searchResults.length > 0 && (
                                    <div className="absolute z-10 w-full mt-2 bg-white dark:bg-[#1a2332] rounded-xl shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                                        {searchResults.map((m) => (
                                            <button
                                                key={m.id}
                                                type="button"
                                                onClick={() => {
                                                    setSelectedFamilyMember(m);
                                                    setFormData(prev => ({ ...prev, family_id: m.family_id || '' }));
                                                    setMemberSearch('');
                                                    setSearchResults([]);
                                                }}
                                                className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left border-b border-gray-50 dark:border-gray-800 last:border-0"
                                            >
                                                <img src={m.avatar_url || "https://picsum.photos/100"} className="size-8 rounded-full" />
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-bold">{m.first_name} {m.last_name}</p>
                                                    <p className="text-[10px] text-gray-500">
                                                        {m.families?.name ? `Familia: ${m.families.name}` : 'Sin familia asignada'}
                                                    </p>
                                                </div>
                                                <span className="material-symbols-outlined text-primary text-sm">link</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex items-center gap-4 p-4 bg-primary/5 dark:bg-primary/10 rounded-2xl border border-primary/20 animate-in fade-in slide-in-from-top-2">
                                <img src={selectedFamilyMember.avatar_url || "https://picsum.photos/100"} className="size-12 rounded-full border-2 border-primary" />
                                <div className="flex-1">
                                    <p className="text-xs font-bold text-primary uppercase tracking-wider mb-1">Familia Vinculada</p>
                                    <p className="text-sm font-bold">{selectedFamilyMember.first_name} {selectedFamilyMember.last_name}</p>
                                    <p className="text-xs text-gray-500">{selectedFamilyMember.families?.name || 'Familia de ' + selectedFamilyMember.last_name}</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSelectedFamilyMember(null);
                                        setFormData(prev => ({ ...prev, family_id: '' }));
                                    }}
                                    className="p-2 hover:bg-primary/10 rounded-full transition-colors group"
                                >
                                    <span className="material-symbols-outlined text-gray-400 group-hover:text-red-500">close</span>
                                </button>
                            </div>
                        )}

                        <div className="flex items-center gap-4 py-2">
                            <div className="h-px flex-1 bg-gray-100 dark:bg-gray-800"></div>
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-[2px]">o selecciona directamente</span>
                            <div className="h-px flex-1 bg-gray-100 dark:bg-gray-800"></div>
                        </div>

                        <select
                            name="family_id"
                            value={formData.family_id}
                            onChange={(e) => {
                                handleChange(e);
                                if (!e.target.value) setSelectedFamilyMember(null);
                            }}
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                        >
                            <option value="">Sin Familia / Nueva Familia</option>
                            {families.map(family => (
                                <option key={family.id} value={family.id}>{family.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex gap-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-bold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 px-4 py-3 rounded-xl bg-primary hover:bg-blue-600 text-white font-bold shadow-lg shadow-blue-500/20 transition-all disabled:opacity-70 flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                            ) : (
                                <>
                                    <span className="material-symbols-outlined">{editMember ? 'sync' : 'save'}</span>
                                    {editMember ? 'Actualizar Datos' : 'Guardar Miembro'}
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddMemberModal;
