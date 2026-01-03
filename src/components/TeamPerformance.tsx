import { Users, TrendingUp, AlertTriangle, UserCheck } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { calculateCoachStats } from '../utils/businessLogic';
import clsx from 'clsx';

const TeamPerformance = () => {
    const { students, users } = useAppContext();
    const stats = calculateCoachStats(students, users);

    return (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-8 shadow-xl">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                <Users className="text-blue-500" />
                Performance del Team
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {stats.map(coach => (
                    <div key={coach.coachId} className="bg-gray-950/50 rounded-xl border border-gray-800 p-5 hover:border-blue-500/30 transition-all">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="font-bold text-lg text-white">{coach.coachName}</h3>
                                <div className="text-xs text-gray-400">Coach</div>
                            </div>
                            <div className={clsx("px-2 py-1 rounded text-xs font-bold",
                                coach.activeStudents > 15 ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500')}>
                                {coach.activeStudents} Attivi
                            </div>
                        </div>

                        <div className="space-y-4">
                            {/* Retention Metrics */}
                            <div>
                                <div className="flex justify-between text-xs mb-1">
                                    <span className="text-gray-400 flex items-center gap-1">
                                        <TrendingUp size={12} /> Retention Rate
                                    </span>
                                    <span className={clsx("font-bold",
                                        coach.retentionRate > 70 ? 'text-green-400' :
                                            coach.retentionRate > 40 ? 'text-yellow-400' : 'text-red-400')}>
                                        {coach.retentionRate}%
                                    </span>
                                </div>
                                <div className="w-full bg-gray-800 rounded-full h-1.5">
                                    <div
                                        className={clsx("h-1.5 rounded-full",
                                            coach.retentionRate > 70 ? 'bg-green-500' :
                                                coach.retentionRate > 40 ? 'bg-yellow-500' : 'bg-red-500')}
                                        style={{ width: `${coach.retentionRate}%` }}
                                    ></div>
                                </div>
                                <div className="text-[10px] text-gray-500 mt-1 text-right">
                                    {coach.renewedCount} Rinnovi su {Math.round(coach.renewedCount / (coach.retentionRate / 100 || 1))} conclusi
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 mt-4">
                                {/* Urgency Metric */}
                                <div className="bg-gray-900 rounded-lg p-3 border border-gray-800 flex flex-col items-center justify-center relative overflow-hidden">
                                    {coach.urgentCount > 2 && (
                                        <div className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full animate-ping"></div>
                                    )}
                                    <div className={clsx("text-xl font-bold mb-1", coach.urgentCount > 0 ? "text-red-400" : "text-gray-400")}>
                                        {coach.urgentCount}
                                    </div>
                                    <div className="text-[10px] text-gray-500 uppercase tracking-wide flex items-center gap-1">
                                        <AlertTriangle size={10} /> Urgenti
                                    </div>
                                </div>

                                {/* Total Students Metric */}
                                <div className="bg-gray-900 rounded-lg p-3 border border-gray-800 flex flex-col items-center justify-center">
                                    <div className="text-xl font-bold text-gray-300 mb-1">
                                        {coach.totalStudents}
                                    </div>
                                    <div className="text-[10px] text-gray-500 uppercase tracking-wide flex items-center gap-1">
                                        <UserCheck size={10} /> Totali
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TeamPerformance;
