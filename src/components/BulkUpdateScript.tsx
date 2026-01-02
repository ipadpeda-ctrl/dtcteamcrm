import { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { calculateTotalLessons } from '../utils/businessLogic';
import { RefreshCw, Check } from 'lucide-react';

export const BulkUpdateScript = () => {
    const { students, updateStudent, currentUser } = useAppContext();
    const [isRunning, setIsRunning] = useState(false);
    const [progress, setProgress] = useState<{ processed: number, updated: number, total: number } | null>(null);

    // Only Owner can see this
    if (currentUser?.role !== 'OWNER') return null;

    const runUpdate = async () => {
        if (!confirm('ATTENZIONE: Questo script aggiornerà le "Lezioni Totali" di TUTTI gli studenti nel database in base al loro pacchetto (es. Silver -> 8, Gold -> 16). Confermi?')) return;

        setIsRunning(true);
        let updatedCount = 0;
        let processedCount = 0;

        try {
            for (const student of students) {
                const correctTotal = calculateTotalLessons(student.package);

                // Check if update is needed (preserve non-standard values ONLY if explicitly requested, 
                // but here user asked to fix them. We will update if it matches the OLD default 10 or 20, OR if it simply mismatch).
                // User said: "automatically update also all existing students... recalculating based on package"
                // So we FORCE update everyone to the standard.

                if (student.totalLessons !== correctTotal) {
                    await updateStudent(student.id, { totalLessons: correctTotal });
                    updatedCount++;
                }

                processedCount++;
                // Slight delay to avoid rate limits if many
                if (processedCount % 10 === 0) await new Promise(r => setTimeout(r, 50));
            }
        } catch (error) {
            console.error("Bulk update failed", error);
            alert("Errore durante l'aggiornamento");
        } finally {
            setIsRunning(false);
            setProgress({ processed: processedCount, updated: updatedCount, total: students.length });
        }
    };

    return (
        <div className="fixed bottom-4 right-4 z-50">
            {!progress ? (
                <button
                    onClick={runUpdate}
                    disabled={isRunning}
                    className="bg-yellow-600/20 hover:bg-yellow-600/40 text-yellow-500 border border-yellow-500/50 p-3 rounded-full shadow-lg backdrop-blur-sm transition-all flex items-center gap-2 group"
                    title="Esegui FIX Lezioni Totali"
                >
                    <RefreshCw size={20} className={isRunning ? "animate-spin" : ""} />
                    <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 whitespace-nowrap text-xs font-bold">
                        Fix Lezioni
                    </span>
                </button>
            ) : (
                <div className="bg-gray-900 border border-gray-700 p-4 rounded-xl shadow-xl flex flex-col gap-2 min-w-[200px] animate-in slide-in-from-bottom-5">
                    <div className="flex justify-between items-center">
                        <h4 className="text-sm font-bold text-white flex items-center gap-2">
                            <Check size={16} className="text-green-500" /> Finito
                        </h4>
                        <button onClick={() => setProgress(null)} className="text-gray-400 hover:text-white text-xs">Chiudi</button>
                    </div>
                    <div className="text-xs text-gray-400">
                        Processati: <span className="text-white">{progress.processed}</span><br />
                        Aggiornati: <span className="text-green-400 font-bold">{progress.updated}</span>
                    </div>
                </div>
            )}
        </div>
    );
};
