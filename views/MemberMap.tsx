
import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import { supabase } from '../services/supabase';
import { Member } from '../types';
import L from 'leaflet';
import Swal from 'sweetalert2';
import { motion, AnimatePresence } from 'framer-motion';

// Fix for default marker icon in Leaflet + React
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Helper component to center map on a member
const MapController = ({ centerOn }: { centerOn: [number, number] | null }) => {
    const map = useMap();
    useEffect(() => {
        if (centerOn) {
            map.flyTo(centerOn, 16, { duration: 1.2 });
        }
    }, [centerOn, map]);
    return null;
};

// Zoom Controls Overlay
const ZoomControls = () => {
    const map = useMap();
    return (
        <div className="absolute right-4 bottom-4 z-[1000] flex flex-col gap-2">
            <button
                onClick={() => map.zoomIn()}
                className="size-10 bg-white/95 dark:bg-[#151c2b]/95 backdrop-blur-md rounded-xl shadow-xl border border-white/20 dark:border-gray-800 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:text-primary transition-colors pointer-events-auto"
            >
                <span className="material-symbols-outlined font-black">add</span>
            </button>
            <button
                onClick={() => map.zoomOut()}
                className="size-10 bg-white/95 dark:bg-[#151c2b]/95 backdrop-blur-md rounded-xl shadow-xl border border-white/20 dark:border-gray-800 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:text-primary transition-colors pointer-events-auto"
            >
                <span className="material-symbols-outlined font-black">remove</span>
            </button>
        </div>
    );
};

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
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [filterType, setFilterType] = useState<'all' | 'pending' | 'located'>('all');
    const [mapCenter, setMapCenter] = useState<[number, number] | null>(null);

    const sidebarRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetchMembers();
    }, []);

    const fetchMembers = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('members')
                .select('*');

            if (error) throw error;
            if (data) setMembers(data);
        } catch (err) {
            console.error('Error fetching members:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleLocationSelected = async (lat: number, lng: number, memberOverride?: Member) => {
        const targetMember = memberOverride || selectedMember;
        if (!targetMember) return;

        try {
            const { error } = await supabase
                .from('members')
                .update({ latitude: lat, longitude: lng })
                .eq('id', targetMember.id);

            if (error) throw error;

            Swal.fire({
                title: '¡Ubicación Guardada!',
                text: `Ubicación vinculada a ${targetMember.first_name}.`,
                icon: 'success',
                timer: 2000,
                showConfirmButton: false,
                toast: true,
                position: 'top-end'
            });

            setMembers(prev => prev.map(m =>
                m.id === targetMember.id ? { ...m, latitude: lat, longitude: lng } : m
            ));

            setIsSettingLocation(false);
            setSelectedMember(null);
        } catch (error) {
            console.error('Error updating member location:', error);
            Swal.fire('Error', 'No se pudo guardar la ubicación.', 'error');
        }
    };

    const geocodeAddress = async (member: Member) => {
        if (!member.address) {
            Swal.fire('Atención', 'Este miembro no tiene dirección registrada.', 'info');
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
                Swal.fire('No encontrado', 'No pudimos encontrar esa dirección automáticamente.', 'warning');
            }
        } catch (err) {
            Swal.fire('Error', 'Error al conectar con el servicio de mapas.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const filteredMembers = members.filter(m => {
        const matchesSearch = searchTerm === '' ||
            `${m.first_name} ${m.last_name}`.toLowerCase().includes(searchTerm.toLowerCase());

        if (!matchesSearch) return false;

        if (filterType === 'pending') return !m.latitude;
        if (filterType === 'located') return !!m.latitude;
        return true;
    });

    return (
        <div className="relative h-[calc(100vh-64px)] lg:h-screen w-full overflow-hidden bg-gray-50 dark:bg-gray-950">
            {/* Map Background */}
            <div className="absolute inset-0 z-0">
                <MapContainer
                    center={[19.4517, -70.6970]}
                    zoom={13}
                    style={{ height: '100%', width: '100%' }}
                    zoomControl={false}
                >
                    <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    />

                    <MapController centerOn={mapCenter} />

                    {members.filter(m => m.latitude && m.longitude).map(m => (
                        <Marker key={m.id} position={[m.latitude!, m.longitude!]}>
                            <Popup className="premium-popup">
                                <div className="p-2 text-center min-w-[180px]">
                                    <div className="relative inline-block mb-3">
                                        <img
                                            src={m.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(m.first_name + ' ' + m.last_name)}&background=random`}
                                            className="size-16 rounded-full mx-auto border-2 border-primary shadow-lg object-cover"
                                        />
                                        <div className="absolute -bottom-1 -right-1 bg-white dark:bg-gray-900 rounded-full p-1 shadow-md flex items-center justify-center">
                                            <span className="material-symbols-outlined text-[14px] text-emerald-500 font-black">check_circle</span>
                                        </div>
                                    </div>
                                    <h3 className="font-black text-lg m-0 leading-tight dark:text-white">{m.first_name} {m.last_name}</h3>
                                    <p className="text-[10px] font-black text-gray-400 mt-1 mb-3 uppercase tracking-widest">{m.role || 'MIEMBRO'}</p>

                                    <div className="text-[10px] text-gray-500 dark:text-gray-400 mb-4 bg-gray-50 dark:bg-gray-800/50 p-2 rounded-xl flex items-center gap-2 border border-gray-100 dark:border-gray-700">
                                        <span className="material-symbols-outlined text-sm text-primary">location_on</span>
                                        <span className="truncate">{m.address || 'Sin dirección registrada'}</span>
                                    </div>

                                    <div className="flex gap-2">
                                        <a
                                            href={`#/members/${m.id}`}
                                            className="flex-1 bg-primary text-white py-2 rounded-xl text-[10px] font-bold no-underline hover:brightness-110 active:scale-95 transition-all uppercase tracking-widest flex items-center justify-center gap-1 shadow-sm"
                                        >
                                            <span className="material-symbols-outlined text-[14px]">person</span>
                                            Perfil
                                        </a>
                                        <button
                                            onClick={() => {
                                                const url = `https://www.google.com/maps/dir/?api=1&destination=${m.latitude},${m.longitude}`;
                                                window.open(url, '_blank');
                                            }}
                                            className="flex-1 bg-emerald-500 text-white py-2 rounded-xl text-[10px] font-bold hover:brightness-110 active:scale-95 transition-all uppercase tracking-widest flex items-center justify-center gap-1 shadow-sm"
                                        >
                                            <span className="material-symbols-outlined text-[14px]">directions</span>
                                            Ir
                                        </button>
                                    </div>
                                </div>
                            </Popup>
                        </Marker>
                    ))}
                    {isSettingLocation && <LocationPicker onLocationSelected={handleLocationSelected} />}
                    <ZoomControls />
                </MapContainer>
            </div>

            {/* Draggable & Toggleable Sidebar */}
            <AnimatePresence>
                <motion.div
                    drag
                    dragMomentum={false}
                    className="absolute top-4 left-4 z-[1000]"
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                >
                    <div
                        ref={sidebarRef}
                        className={`bg-white/95 dark:bg-[#111827]/95 backdrop-blur-xl rounded-[2.5rem] shadow-2xl border border-white/20 dark:border-gray-800 transition-all duration-500 ease-in-out ${isSidebarCollapsed ? 'w-16 h-16' : 'w-72 md:w-85'}`}
                    >
                        {isSidebarCollapsed ? (
                            <button
                                onClick={() => setIsSidebarCollapsed(false)}
                                className="w-full h-full flex items-center justify-center text-primary group"
                                title="Expandir lista"
                            >
                                <span className="material-symbols-outlined text-3xl group-hover:scale-110 transition-transform">menu_open</span>
                            </button>
                        ) : (
                            <div className="p-5">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="cursor-grab active:cursor-grabbing flex-1">
                                        <h1 className="text-xl font-black mb-0.5 tracking-tight flex items-center gap-2">
                                            Mapa de Miembros
                                            <span className="material-symbols-outlined text-gray-300 text-sm">drag_pan</span>
                                        </h1>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Gestión de Ubicaciones</p>
                                    </div>
                                    <button
                                        onClick={() => setIsSidebarCollapsed(true)}
                                        className="size-8 rounded-full flex items-center justify-center text-gray-400 hover:text-primary hover:bg-primary/10 transition-all"
                                        title="Colapsar"
                                    >
                                        <span className="material-symbols-outlined text-xl">close_fullscreen</span>
                                    </button>
                                </div>

                                <div className="relative mb-4">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                        <span className="material-symbols-outlined text-gray-400 text-sm">search</span>
                                    </div>
                                    <input
                                        type="text"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        placeholder="Buscar un miembro..."
                                        className="w-full pl-10 pr-4 py-3 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border-none text-[11px] focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                                    />
                                </div>

                                {/* Modernized Filter Tabs */}
                                <div className="flex bg-gray-100/50 dark:bg-gray-800/50 p-1.5 rounded-2xl mb-5 space-x-1">
                                    {[
                                        { id: 'all', label: 'Todos', count: members.length },
                                        { id: 'pending', label: 'Sin Ubicar', count: members.filter(m => !m.latitude).length },
                                        { id: 'located', label: 'Ubicados', count: members.filter(m => !!m.latitude).length }
                                    ].map((tab) => (
                                        <button
                                            key={tab.id}
                                            onClick={() => setFilterType(tab.id as any)}
                                            className={`flex-1 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${filterType === tab.id
                                                ? 'bg-white dark:bg-gray-700 text-primary shadow-sm'
                                                : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
                                        >
                                            <div className="leading-none mb-0.5">{tab.label}</div>
                                            <div className="opacity-50 text-[8px]">{tab.count}</div>
                                        </button>
                                    ))}
                                </div>

                                {isSettingLocation ? (
                                    <div className="bg-primary/5 p-5 rounded-[2rem] border border-primary/20 animate-pulse text-center">
                                        <div className="size-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                                            <span className="material-symbols-outlined text-primary">pin_drop</span>
                                        </div>
                                        <p className="text-[10px] font-black text-primary mb-1 uppercase tracking-widest">Selección Activa</p>
                                        <p className="text-xs font-medium mb-4 leading-tight opacity-70">Haz clic en el mapa para ubicar a <br /><span className="text-primary font-bold">{selectedMember?.first_name}</span></p>
                                        <button
                                            onClick={() => setIsSettingLocation(false)}
                                            className="w-full py-2.5 bg-white dark:bg-gray-700 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm hover:brightness-95 transition-all"
                                        >
                                            Cancelar
                                        </button>
                                    </div>
                                ) : (
                                    <div className="space-y-2.5 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
                                        {filteredMembers.map(m => (
                                            <div
                                                key={m.id}
                                                className="w-full flex items-center gap-3 p-2.5 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all text-left border border-transparent hover:border-gray-100 dark:hover:border-gray-700 group cursor-default"
                                            >
                                                <button
                                                    onClick={() => {
                                                        if (m.latitude && m.longitude) {
                                                            setMapCenter([m.latitude, m.longitude]);
                                                            setSelectedMember(m);
                                                        } else {
                                                            setSelectedMember(m);
                                                            setIsSettingLocation(true);
                                                        }
                                                    }}
                                                    className="flex flex-1 items-center gap-3 min-w-0"
                                                >
                                                    <div className="relative shrink-0">
                                                        <img
                                                            src={m.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(m.first_name + ' ' + m.last_name)}&background=random`}
                                                            className="size-9 rounded-full shadow-sm object-cover"
                                                        />
                                                        <div className={`absolute -bottom-0.5 -right-0.5 size-3 border-2 border-white dark:border-gray-900 rounded-full ${m.latitude ? 'bg-emerald-500 bubble-anim' : 'bg-orange-400'}`}></div>
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-[11px] font-black truncate">{m.first_name} {m.last_name}</p>
                                                        <p className={`text-[8px] font-black uppercase tracking-tighter ${m.latitude ? 'text-emerald-500' : 'text-orange-400'}`}>
                                                            {m.latitude ? 'CON UBICACIÓN' : 'PENDIENTE'}
                                                        </p>
                                                    </div>
                                                </button>
                                                <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-all transform translate-x-1 group-hover:translate-x-0">
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); geocodeAddress(m); }}
                                                        title="Auto-ubicar"
                                                        className={`size-8 rounded-xl flex items-center justify-center transition-all ${m.latitude ? 'text-gray-300 hover:text-emerald-500 hover:bg-emerald-50' : 'text-gray-400 hover:text-primary hover:bg-primary/5'}`}
                                                    >
                                                        <span className="material-symbols-outlined text-[18px]">magic_button</span>
                                                    </button>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); setSelectedMember(m); setIsSettingLocation(true); }}
                                                        title="Ubicar manualmente"
                                                        className={`size-8 rounded-xl flex items-center justify-center transition-all ${m.latitude ? 'text-gray-300 hover:text-emerald-500 hover:bg-emerald-50' : 'text-gray-400 hover:text-primary hover:bg-primary/5'}`}
                                                    >
                                                        <span className="material-symbols-outlined text-[18px]">add_location_alt</span>
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                        {filteredMembers.length === 0 && (
                                            <div className="text-center py-10 opacity-50">
                                                <div className="size-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                                                    <span className="material-symbols-outlined text-3xl text-gray-300">person_search</span>
                                                </div>
                                                <p className="text-[10px] font-black uppercase tracking-[0.2em]">Sin Resultados</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </motion.div>
            </AnimatePresence>
        </div>
    );
};

export default MemberMap;
