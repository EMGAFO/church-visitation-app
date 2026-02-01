
import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { supabase } from '../services/supabase';
import Swal from 'sweetalert2';

interface BulkImportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const BulkImportModal: React.FC<BulkImportModalProps> = ({ isOpen, onClose, onSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [previewData, setPreviewData] = useState<any[]>([]);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    if (!isOpen) return null;

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const bstr = evt.target?.result;
                const wb = XLSX.read(bstr, { type: 'binary' });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];
                const data = XLSX.utils.sheet_to_json(ws);

                // Basic validation or mapping could go here
                setPreviewData(data);
                setError(null);
            } catch (err) {
                console.error(err);
                setError("Error reading file. Please ensure it's a valid Excel or CSV file.");
            }
        };
        reader.readAsBinaryString(file);
    };

    const handleImport = async () => {
        if (previewData.length === 0) return;
        setLoading(true);

        try {
            // Map keys to database columns
            // Expected headers: First Name, Last Name, Email, Phone, Address, Role, Status
            const formattedData = previewData.map(row => ({
                first_name: row['First Name'] || row['first_name'] || '',
                last_name: row['Last Name'] || row['last_name'] || '',
                email: row['Email'] || row['email'] || null,
                phone: row['Phone'] || row['phone'] || null,
                address: row['Address'] || row['address'] || null,
                role: row['Role'] || row['role'] || 'Member',
                status: row['Status'] || row['status'] || 'Good Standing',
                // Default avatar
                avatar_url: `https://ui-avatars.com/api/?name=${row['First Name']}+${row['Last Name']}&background=random`
            }));

            // Filter out rows without names
            const validRows = formattedData.filter(r => r.first_name && r.last_name);

            if (validRows.length === 0) {
                throw new Error("No se encontraron filas válidas. Asegúrese de que existen las columnas 'First Name' y 'Last Name'.");
            }

            const { error } = await supabase
                .from('members')
                .insert(validRows);

            if (error) throw error;

            await Swal.fire({
                title: '¡Importación Exitosa!',
                text: `¡Se importaron exitosamente ${validRows.length} miembros!`,
                icon: 'success',
                confirmButtonText: 'Aceptar',
                confirmButtonColor: '#2563EB'
            });

            onSuccess();
            handleClose();
        } catch (err: any) {
            console.error(err);
            Swal.fire({
                title: 'Error',
                text: err.message || 'Ocurrió un error durante la importación.',
                icon: 'error',
                confirmButtonText: 'Aceptar',
                confirmButtonColor: '#DC2626'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setPreviewData([]);
        setError(null);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white dark:bg-[#1a2332] rounded-2xl w-full max-w-2xl shadow-2xl p-6 border border-gray-100 dark:border-gray-700 max-h-[90vh] flex flex-col">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Importación Masiva de Miembros</h2>
                    <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto min-h-0">
                    {!previewData.length ? (
                        <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                            <span className="material-symbols-outlined text-4xl text-gray-400 mb-2">upload_file</span>
                            <p className="text-gray-600 dark:text-gray-300 font-medium mb-1">Subir Excel o CSV</p>
                            <p className="text-xs text-gray-400 mb-4">Columnas requeridas: First Name, Last Name, Email, Role, Status</p>
                            <input
                                type="file"
                                accept=".xlsx, .xls, .csv"
                                onChange={handleFileUpload}
                                className="hidden"
                                ref={fileInputRef}
                            />
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="px-4 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm font-bold shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                            >
                                Seleccionar Archivo
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <p className="text-sm text-gray-500">Previsualizando {previewData.length} filas</p>
                                <button
                                    onClick={() => setPreviewData([])}
                                    className="text-xs text-red-500 hover:underline"
                                >
                                    Limpiar y volver a subir
                                </button>
                            </div>
                            <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                                <table className="w-full text-xs text-left">
                                    <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                                        <tr>
                                            {['First Name', 'Last Name', 'Email', 'Role', 'Status'].map(h => (
                                                <th key={h} className="px-3 py-2 font-medium text-gray-500">{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                        {previewData.slice(0, 5).map((row, i) => (
                                            <tr key={i} className="bg-white dark:bg-[#1a2332]">
                                                <td className="px-3 py-2">{row['First Name'] || row['first_name']}</td>
                                                <td className="px-3 py-2">{row['Last Name'] || row['last_name']}</td>
                                                <td className="px-3 py-2">{row['Email'] || row['email']}</td>
                                                <td className="px-3 py-2">{row['Role'] || row['role']}</td>
                                                <td className="px-3 py-2">{row['Status'] || row['status']}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {previewData.length > 5 && (
                                    <div className="px-3 py-2 bg-gray-50 dark:bg-gray-800 text-center text-xs text-gray-500 border-t border-gray-200 dark:border-gray-700">
                                        ...y {previewData.length - 5} filas más
                                    </div>
                                )}
                            </div>

                            <div className="bg-blue-50 dark:bg-blue-900/10 p-3 rounded-lg text-xs text-blue-700 dark:text-blue-300">
                                <span className="font-bold">Nota:</span> Las columnas deben coincidir exactamente: First Name, Last Name, Email, Phone, Address, Role, Status.
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-300 text-sm rounded-lg flex items-center gap-2">
                            <span className="material-symbols-outlined text-lg">error</span>
                            {error}
                        </div>
                    )}
                </div>

                <div className="flex gap-4 pt-6 mt-auto border-t border-gray-100 dark:border-gray-800">
                    <button
                        onClick={handleClose}
                        className="flex-1 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-bold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleImport}
                        disabled={loading || previewData.length === 0}
                        className="flex-1 px-4 py-3 rounded-xl bg-primary hover:bg-blue-600 text-white font-bold shadow-lg shadow-blue-500/20 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                        ) : (
                            <>
                                <span className="material-symbols-outlined">cloud_upload</span>
                                Importar Miembros
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BulkImportModal;
