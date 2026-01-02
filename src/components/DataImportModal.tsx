import { useState, useRef } from 'react';
import { Upload, X, Download, CheckCircle, ArrowRight } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import type { PackageType, Student } from '../types';
import { parseDateSafe, calculateTotalLessons } from '../utils/businessLogic';

interface DataImportModalProps {
    onClose: () => void;
}

type RequiredField = 'name' | 'email' | 'package' | 'startDate' | 'coach' | 'lessonsDone' | 'totalLessons';

const REQUIRED_FIELDS: { key: RequiredField; label: string; required: boolean }[] = [
    { key: 'name', label: 'Nome Studente', required: true },
    { key: 'email', label: 'Email', required: false },
    { key: 'package', label: 'Pacchetto (Silver/Gold)', required: false },
    { key: 'startDate', label: 'Data Inizio', required: false },
    { key: 'coach', label: 'Coach', required: false },
    { key: 'lessonsDone', label: 'Lezioni Fatte', required: false },
    { key: 'totalLessons', label: 'Totale Lezioni', required: false },
];

const DataImportModal = ({ onClose }: DataImportModalProps) => {
    const { addStudent, users, currentUser } = useAppContext();
    const fileInputRef = useRef<HTMLInputElement>(null);

    // State
    const [step, setStep] = useState<'UPLOAD' | 'MAPPING' | 'PROCESSING' | 'COMPLETE'>('UPLOAD');
    const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
    const [csvRows, setCsvRows] = useState<string[][]>([]);
    const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
    const [stats, setStats] = useState<{ total: number; success: number; errors: number } | null>(null);

    const handleDownloadTemplate = () => {
        const headers = ['Nome Cognome', 'Email', 'Pacchetto', 'Data Inizio', 'Coach', 'Lezioni Fatte', 'Totale Lezioni'];
        // Use semicolon for Excel compatibility in IT/EU regions
        const csvContent = "data:text/csv;charset=utf-8," + headers.join(";");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "template_studenti.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target?.result as string;
            if (!text) return;

            const lines = text.split('\n').filter(line => line.trim() !== '');
            if (lines.length < 2) {
                alert("Il file CSV sembra vuoto o non valido");
                return;
            }

            // Detect delimiter (comma or semicolon)
            const firstLine = lines[0];
            const delimiter = firstLine.includes(';') ? ';' : ',';

            // Parser using detected delimiter
            const headers = firstLine.split(delimiter).map(h => h.trim().replace(/^"|"$/g, ''));
            const rows = lines.slice(1).map(line => line.split(delimiter).map(cell => cell.trim().replace(/^"|"$/g, '')));

            setCsvHeaders(headers);
            setCsvRows(rows);

            // Auto-map predictable headers
            const initialMapping: Record<string, string> = {};
            REQUIRED_FIELDS.forEach(field => {
                const match = headers.find(h => h.toLowerCase().includes(field.label.toLowerCase()) || h.toLowerCase().includes(field.key.toLowerCase()));
                if (match) initialMapping[field.key] = match;
            });
            setColumnMapping(initialMapping);

            setStep('MAPPING');
        };
        reader.readAsText(file);
    };

    const handleMappingChange = (fieldKey: string, header: string) => {
        setColumnMapping(prev => ({ ...prev, [fieldKey]: header }));
    };

    const executeImport = async () => {
        setStep('PROCESSING');
        let successCount = 0;
        let errorCount = 0;

        for (const row of csvRows) {
            try {
                // Helper to get value from row based on mapping
                const getValue = (key: RequiredField) => {
                    const header = columnMapping[key];
                    if (!header) return '';
                    const index = csvHeaders.indexOf(header);
                    return index !== -1 ? row[index] : '';
                };

                const name = getValue('name');
                const email = getValue('email');

                if (!name || (!email && REQUIRED_FIELDS.find(f => f.key === 'email')?.required)) {
                    errorCount++; // Skip rows without critical data
                    continue;
                }

                const pkg = (getValue('package') || 'Silver') as PackageType;
                const rawStartDate = getValue('startDate');
                const startDate = rawStartDate ? parseDateSafe(rawStartDate).split('T')[0] : new Date().toISOString().split('T')[0];
                const coachName = getValue('coach');
                const lessonsDone = parseInt(getValue('lessonsDone')) || 0;
                const totalLessons = parseInt(getValue('totalLessons')) || calculateTotalLessons(pkg);

                // Find coach ID
                const potentialCoach = users.find(u => u.name.toLowerCase().includes(coachName.toLowerCase())) || users.find(u => u.role === 'COACH');

                // Validate ID (must be UUID-like, not '2' or '1')
                const isValidId = (id: string | undefined) => id && id.length > 20;

                const validCoachId = isValidId(potentialCoach?.id) ? potentialCoach?.id : undefined;
                const validCurrentUserId = isValidId(currentUser?.id) ? currentUser?.id : undefined;
                const validFirstUserId = isValidId(users[0]?.id) ? users[0]?.id : undefined;

                const finalCoachId = validCoachId || validCurrentUserId || validFirstUserId;

                const newStudent = {
                    name,
                    email,
                    package: pkg,
                    startDate,
                    lessonsDone,
                    totalLessons,
                    coachId: finalCoachId!, // We assume at least one valid user exists (the logged in one)
                    status: 'ACTIVE' as const
                };

                const success = await addStudent(newStudent as Omit<Student, 'id' | 'status' | 'endDate' | 'lastContactDate' | 'difficultyTags' | 'notes'>);

                if (success) {
                    successCount++;
                } else {
                    errorCount++;
                }
            } catch (err) {
                console.error("Import error row", row, err);
                errorCount++;
            }
        }

        setStats({ total: successCount + errorCount, success: successCount, errors: errorCount });
        setStep('COMPLETE');
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
            <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-lg shadow-2xl p-6 flex flex-col max-h-[90vh]">
                <div className="flex justify-between items-center mb-6 shrink-0">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <Upload size={24} className="text-blue-500" />
                        Importa Studenti
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white"><X size={24} /></button>
                </div>

                <div className="flex-1 overflow-y-auto min-h-0 pr-2">
                    {step === 'UPLOAD' && (
                        <div className="space-y-6">
                            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 text-sm text-blue-300">
                                1. Scarica il template<br />
                                2. Compila il file CSV<br />
                                3. Importa e mappa le colonne
                            </div>

                            <button
                                onClick={handleDownloadTemplate}
                                className="w-full py-3 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl text-gray-300 flex items-center justify-center gap-2 transition-all font-medium"
                            >
                                <Download size={18} /> Scarica Template CSV
                            </button>

                            <div className="relative pt-4 text-center">
                                <input
                                    type="file"
                                    accept=".csv"
                                    ref={fileInputRef}
                                    onChange={handleFileUpload}
                                    className="hidden"
                                />
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl shadow-lg shadow-blue-900/20 font-bold flex items-center justify-center gap-2 transition-all active:scale-95"
                                >
                                    Seleziona File CSV
                                </button>
                                <p className="mt-2 text-xs text-gray-500">Formato consigliato: .csv (UTF-8)</p>
                            </div>
                        </div>
                    )}

                    {step === 'MAPPING' && (
                        <div className="space-y-4">
                            <h3 className="text-white font-medium mb-4">Mappa le colonne del tuo file</h3>
                            <div className="space-y-3">
                                {REQUIRED_FIELDS.map((field) => (
                                    <div key={field.key} className="grid grid-cols-2 items-center gap-4 p-3 bg-gray-800/50 rounded-lg">
                                        <div className="text-sm text-gray-300 font-medium">
                                            {field.label} {field.required && <span className="text-red-400">*</span>}
                                        </div>
                                        <select
                                            className="bg-gray-900 border border-gray-700 text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                                            value={columnMapping[field.key] || ''}
                                            onChange={(e) => handleMappingChange(field.key, e.target.value)}
                                        >
                                            <option value="">-- Ignora --</option>
                                            {csvHeaders.map(h => (
                                                <option key={h} value={h}>{h}</option>
                                            ))}
                                        </select>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {(step === 'PROCESSING' || step === 'COMPLETE') && stats && (
                        <div className="text-center space-y-6 pt-8">
                            <div className="w-16 h-16 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mx-auto mb-2">
                                <CheckCircle size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-white">Importazione Completata</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-gray-800 p-4 rounded-xl">
                                    <span className="block text-3xl font-bold text-green-400">{stats.success}</span>
                                    <span className="text-xs text-gray-400 uppercase tracking-wider">Successi</span>
                                </div>
                                <div className="bg-gray-800 p-4 rounded-xl">
                                    <span className="block text-3xl font-bold text-red-400">{stats.errors}</span>
                                    <span className="text-xs text-gray-400 uppercase tracking-wider">Errori</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="mt-6 pt-4 border-t border-gray-800 flex justify-end gap-3 shrink-0">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
                    >
                        Annulla
                    </button>
                    {step === 'MAPPING' && (
                        <button
                            onClick={executeImport}
                            disabled={!columnMapping['name']}
                            className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            Importa Dati <ArrowRight size={16} />
                        </button>
                    )}
                    {step === 'COMPLETE' && (
                        <button
                            onClick={onClose}
                            className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors"
                        >
                            Chiudi
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DataImportModal;
