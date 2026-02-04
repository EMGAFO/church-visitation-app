
import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import { supabase } from '../services/supabase';
import { Member } from '../types';
import L from 'leaflet';
import Swal from 'sweetalert2';

// Fix for default marker icon in Leaflet + React
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const LocationPicker = ({ onLocationSelected }: { onLocationSelected: (lat: number, lng: number) => void }) => {
    useMapEvents({
        click(e) {
            onLocationSelected(e.latlng.lat, e.latlng.lng);
        },
    });
    return null;
};

const MemberMap: React.FC = () => {
    const [members, setMembers] = useState<Member[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedMember, setSelectedMember] = useState<Member | null>(null);
    const [isSettingLocation, setIsSettingLocation] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchMembers();
    }, []);

    const fetchMembers = async () => {
        try {
            console.log('Fetching members for map...');
            const { data, error } = await supabase
                .from('members')
                .select('*');

            if (error) {
                console.error('Supabase error:', error);
                throw error;
            }

            if (data) {
                console.log(`Found ${data.length} members.`);
                setMembers(data);
            }
        } catch (err) {
            console.error('Error fetching members:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleLocationSelected = async (lat: number, lng: number, memberOverride?: Member) => {
        const targetMember = memberOverride || selectedMember;
        if (!targetMember) {
            console.warn('No member selected for location update');
            return;
        }

        console.log(`Updating location for ${targetMember.first_name}: ${lat}, ${lng}`);

        try {
            const { error } = await supabase
                .from('members')
                .update({
                    latitude: lat,
                    longitude: lng
                })
                .eq('id', targetMember.id);

            if (error) throw error;

            Swal.fire({
                title: '¡Ubicación Guardada!',
                text: `Se ha vinculado la ubicación a ${targetMember.first_name}.`,
                icon: 'success',
                timer: 2000,
                showConfirmButton: false,
                toast: true,
                position: 'top-end'
            });

            // Update local state
            setMembers(prev => prev.map(m =>
                m.id === targetMember.id
                    ? { ...m, latitude: lat, longitude: lng }
                    : m
            ));

            setIsSettingLocation(false);
            setSelectedMember(null);
        } catch (error) {
            console.error('Error updating member location:', error);
            Swal.fire('Error', 'No se pudo guardar la ubicación en la base de datos.', 'error');
        }
    };

    const geocodeAddress = async (member: Member) => {
        if (!member.address) {
            Swal.fire('Atención', 'Este miembro no tiene una dirección escrita para buscar.', 'info');
            return;
        }

        try {
            setLoading(true);
            const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(member.address + ", Dominican Republic")}`);
            const data = await response.json();

            if (data && data.length > 0) {
                const { lat, lon } = data[0];
                handleLocationSelected(parseFloat(lat), parseFloat(lon), member);
            } else {
                Swal.fire('No encontrado', 'No pudimos encontrar esa dirección automáticamente. Por favor, márcala manualmente en el mapa.', 'warning');
            }
        } catch (err) {
            Swal.fire('Error', 'Hubo un problema al conectar con el servicio de mapas.', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative h-[calc(100vh-64px)] lg:h-screen w-full overflow-hidden">
            <div className="absolute top-4 left-4 z-[1000] w-72 md:w-80">
                <div className="bg-white/95 dark:bg-[#151c2b]/95 backdrop-blur-md p-4 rounded-3xl shadow-2xl border border-white/20 dark:border-gray-800">
                    <h1 className="text-xl font-black mb-1">Mapa de Miembros</h1>
                    <p className="text-[10px] text-gray-500 mb-4">Ubicaciones y planificación de rutas.</p>

                    <div className="relative mb-4">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span className="material-symbols-outlined text-gray-400 text-sm">search</span>
                        </div>
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Buscar miembro..."
                            className="w-full pl-9 pr-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 border-none text-xs focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                        />
                    </div>

                    {isSettingLocation ? (
                        <div className="bg-primary/10 p-4 rounded-2xl border border-primary/20 animate-pulse">
                            <p className="text-[10px] font-bold text-primary mb-1 uppercase tracking-tight text-center">Modo Selección Activo</p>
                            <p className="text-xs font-medium mb-3 text-center leading-tight">Haz clic en el mapa para ubicar a <br /><span className="text-primary font-bold">{selectedMember?.first_name}</span></p>
                            <button
                                onClick={() => setIsSettingLocation(false)}
                                className="w-full py-2 bg-white dark:bg-gray-700 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm hover:bg-gray-50 transition-colors"
                            >
                                Cancelar
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
                                    {searchTerm ? 'Resultados' : `Pendientes (${members.filter(m => !m.latitude).length})`}
                                </p>
                            </div>
                            {members
                                .filter(m => {
                                    if (searchTerm) {
                                        const fullSearch = `${m.first_name} ${m.last_name}`.toLowerCase();
                                        return fullSearch.includes(searchTerm.toLowerCase());
                                    }
                                    return !m.latitude;
                                })
                                .map(m => (
                                    <div
                                        key={m.id}
                                        className="w-full flex items-center gap-2 p-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-all text-left border border-transparent hover:border-gray-100 dark:hover:border-gray-700 group"
                                    >
                                        <button
                                            onClick={() => {
                                                if (m.latitude && m.longitude) {
                                                    // Map will be controlled via useMap or just markers
                                                    setSelectedMember(m);
                                                    // We'll need a way to center, maybe just select it
                                                } else {
                                                    setSelectedMember(m);
                                                    setIsSettingLocation(true);
                                                }
                                            }}
                                            className="flex flex-1 items-center gap-2 min-w-0"
                                        >
                                            <div className="relative">
                                                <img src={m.avatar_url || "https://picsum.photos/100"} className="size-8 rounded-full shadow-sm" />
                                                <div className={`absolute -bottom-0.5 -right-0.5 size-2.5 border-2 border-white dark:border-gray-900 rounded-full ${m.latitude ? 'bg-emerald-500' : 'bg-orange-500'}`}></div>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-bold truncate">{m.first_name} {m.last_name}</p>
                                                <p className={`text-[8px] font-black uppercase tracking-tighter ${m.latitude ? 'text-emerald-500' : 'text-orange-500'}`}>
                                                    {m.latitude ? 'Ubicado' : 'Pendiente'}
                                                </p>
                                            </div>
                                        </button>
                                        <div className="flex gap-1">
                                            <button
                                                onClick={() => geocodeAddress(m)}
                                                title={m.latitude ? "Volver a ubicar automáticamente" : "Auto-ubicar"}
                                                className={`p-1.5 rounded-lg transition-colors ${m.latitude ? 'text-gray-300 hover:text-emerald-500 hover:bg-emerald-50' : 'text-gray-400 hover:text-primary hover:bg-primary/10'}`}
                                            >
                                                <span className="material-symbols-outlined text-sm">location_searching</span>
                                            </button>
                                            <button
                                                onClick={() => { setSelectedMember(m); setIsSettingLocation(true); }}
                                                title={m.latitude ? "Cambiar ubicación manualmente" : "Pin manual"}
                                                className={`p-1.5 rounded-lg transition-colors ${m.latitude ? 'text-gray-300 hover:text-emerald-500 hover:bg-emerald-50' : 'text-gray-400 hover:text-primary hover:bg-primary/10'}`}
                                            >
                                                <span className="material-symbols-outlined text-sm">{m.latitude ? 'edit_location' : 'add_location'}</span>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            {members.filter(m => {
                                if (searchTerm) {
                                    const fullSearch = `${m.first_name} ${m.last_name}`.toLowerCase();
                                    return fullSearch.includes(searchTerm.toLowerCase());
                                }
                                return !m.latitude;
                            }).length === 0 && (
                                    <p className="text-[10px] text-gray-500 text-center py-4 italic">No se encontraron miembros.</p>
                                )}
                        </div>
                    )}
                </div>
            </div>

            <div className="absolute inset-0 z-0">
                <MapContainer
                    center={[19.4517, -70.6970]} // Santiago, Dominican Republic as default
                    zoom={13}
                    style={{ height: '100%', width: '100%' }}
                    zoomControl={false}
                >
                    <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    />
                    {members.filter(m => m.latitude && m.longitude).map(m => (
                        <Marker key={m.id} position={[m.latitude!, m.longitude!]}>
                            <Popup>
                                <div className="p-2 text-center min-w-[150px]">
                                    <img src={m.avatar_url || "https://picsum.photos/100"} className="size-16 rounded-full mx-auto mb-2 border-2 border-primary" />
                                    <p className="font-bold text-lg m-0 leading-tight">{m.first_name} {m.last_name}</p>
                                    <p className="text-sm text-gray-500 mb-2">{m.address || 'Sin dirección'}</p>
                                    <a href={`#/members/${m.id}`} className="inline-block bg-primary text-white px-4 py-1.5 rounded-lg text-xs font-bold no-underline">
                                        Ver Perfil
                                    </a>
                                </div>
                            </Popup>
                        </Marker>
                    ))}
                    {isSettingLocation && <LocationPicker onLocationSelected={handleLocationSelected} />}
                </MapContainer>
            </div>
        </div>
    );
};

export default MemberMap;
