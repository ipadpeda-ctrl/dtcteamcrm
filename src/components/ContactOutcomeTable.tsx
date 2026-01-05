import React from 'react';
import type { Student } from '../types';
import { clsx } from 'clsx';
import { PieChart } from 'lucide-react';

interface ContactOutcomeTableProps {
    students: Student[];
}

const OUTCOME_LABELS: Record<string, string> = {
    'POSITIVE': '✅ Rinnovato',
    'NEGATIVE_PRICE': '❌ Troppo Costoso',
    'NEGATIVE_NOT_INTERESTED': '❌ Non Interessato',
    'NEGATIVE_OTHER': '❌ Altro',
    'NEUTRAL_BUSY': '⏳ Richiamare',
    'NO_ANSWER': '📞 Non Risponde'
};

const ContactOutcomeTable = ({ students }: ContactOutcomeTableProps) => {
    // Aggregation Logic
    const stats = React.useMemo(() => {
        const counts: Record<string, number> = {};
        let totalWithOutcome = 0;

        students.forEach(s => {
            if (s.contactOutcome) {
                counts[s.contactOutcome] = (counts[s.contactOutcome] || 0) + 1;
                totalWithOutcome++;
            }
        });

        // Initialize all possible outcomes to 0 if not present, to ensure stable table? 
        // Or just show what we have. Let's show all keys from OUTCOME_LABELS for completeness 
        // so the user sees 0 if no one is in that category, which is informative.
        const rows = Object.entries(OUTCOME_LABELS).map(([key, label]) => {
            const count = counts[key] || 0;
            const percentage = totalWithOutcome > 0 ? Math.round((count / totalWithOutcome) * 100) : 0;
            return {
                key,
                label,
                count,
                percentage
            };
        });

        // Sort by count desc
        return rows.sort((a, b) => b.count - a.count);
    }, [students]);

    return (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-gray-800 bg-gray-950/50 flex justify-between items-center backdrop-blur-sm">
                <h3 className="font-bold text-white flex items-center gap-2">
                    <PieChart className="text-purple-500" size={20} />
                    Report Esiti Contatti
                </h3>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-400">
                    <thead className="bg-gray-950 text-gray-200 uppercase font-medium">
                        <tr>
                            <th className="px-6 py-3">Esito</th>
                            <th className="px-6 py-3 text-right">Studenti</th>
                            <th className="px-6 py-3 text-right">%</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                        {stats.map((row) => (
                            <tr key={row.key} className="hover:bg-gray-800/30 transition-colors">
                                <td className="px-6 py-3 font-medium text-white">{row.label}</td>
                                <td className="px-6 py-3 text-right text-white font-bold">{row.count}</td>
                                <td className="px-6 py-3 text-right">
                                    <span className="inline-block min-w-[3rem] px-2 py-1 rounded-md bg-gray-800 text-xs font-mono text-gray-300">
                                        {row.percentage}%
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
             {stats.every(r => r.count === 0) && (
                 <div className="p-8 text-center text-gray-500">
                     Nessun esito registrato nel periodo/selezione.
                 </div>
             )}
        </div>
    );
};

export default ContactOutcomeTable;
