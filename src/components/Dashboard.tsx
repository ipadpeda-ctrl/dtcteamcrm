import { useAppContext } from '../context/AppContext';
import ContactOutcomeTable from './ContactOutcomeTable';
import StudentTable from './StudentTable';
import TeamPerformance from './TeamPerformance';
import { Users, AlertTriangle, MessageCircle, TrendingUp, AlertCircle } from 'lucide-react';
import React from 'react';
import StudentDetailModal from './StudentDetailModal';
import { isContactUrgent } from '../utils/businessLogic';
import { differenceInDays, format } from 'date-fns';
import clsx from 'clsx';

const OUTCOME_LABELS: Record<string, string> = {
    'POSITIVE': '✅ Rinnovato',
    'NEGATIVE_PRICE': '❌ Troppo Costoso',
    'NEGATIVE_NOT_INTERESTED': '❌ Non Interessato',
    'NEGATIVE_OTHER': '❌ Altro',
    'NEUTRAL_BUSY': '⏳ Richiamare',
    'NO_ANSWER': '📞 Non Risponde'
};

interface StatCardProps {
    title: string;
    value: number | string;
    icon: React.ElementType;
    color: 'blue' | 'red' | 'yellow' | 'green';
    className?: string;
}

const StatCard = ({ title, value, icon: Icon, color, className }: StatCardProps) => (
    <div className={clsx("bg-gray-900 p-6 rounded-xl border border-gray-800 hover:border-opacity-100 transition-all group", className)}>
        <div className="flex justify-between items-start">
            <div>
                <p className="text-gray-400 text-sm font-medium mb-1">{title}</p>
                <h3 className="text-3xl font-bold text-white tracking-tight">{value}</h3>
            </div>
            <div className={clsx("p-3 rounded-lg transition-transform group-hover:scale-110",
                color === 'blue' && "bg-blue-500/10 text-blue-500",
                color === 'red' && "bg-red-500/10 text-red-500",
                color === 'yellow' && "bg-yellow-500/10 text-yellow-500",
                color === 'green' && "bg-green-500/10 text-green-500"
            )}>
                <Icon size={24} />
            </div>
        </div>
    </div>
);

import type { Student } from '../types';

const PriorityList = ({ title, students, type, onActionClick }: { title: string, students: Student[], type: 'RENEWAL' | 'SUPPORT', onActionClick?: (s: Student) => void }) => (
    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="p-4 border-b border-gray-800 bg-gray-950/50 flex justify-between items-center backdrop-blur-sm">
            <h3 className="font-bold text-white flex items-center gap-2">
                {type === 'RENEWAL' ? <AlertTriangle className="text-yellow-500" size={20} /> : <MessageCircle className="text-red-500" size={20} />}
                {title}
            </h3>
            <span className="text-xs bg-gray-800 text-gray-300 px-2.5 py-1 rounded-full border border-gray-700 font-mono font-medium">{students.length}</span>
        </div>
        <div className="max-h-80 overflow-y-auto divide-y divide-gray-800 custom-scrollbar">
            {students.length === 0 ? (
                <div className="p-12 text-center flex flex-col items-center justify-center text-gray-500 gap-2">
                    <CheckCircleIcon className="text-green-500/50" size={32} />
                    <p>Tutto in ordine! Nessuna priorità.</p>
                </div>
            ) : students.map(s => (
                <div key={s.id} className="p-4 hover:bg-gray-800/40 transition-colors flex justify-between items-start group">
                    <div className="flex-1 min-w-0 pr-4">
                        <div className="font-medium text-white group-hover:text-blue-400 transition-colors">{s.name}</div>
                        <div className="text-xs text-gray-500 mt-0.5 font-mono">
                            {type === 'RENEWAL'
                                ? `Scade il ${format(new Date(s.endDate), 'dd MMM')} • ${s.lessonsDone} Lezioni`
                                : `Ultimo: ${format(new Date(s.lastContactDate), 'dd MMM HH:mm')}`
                            }
                        </div>
                        {/* Show Difficulty Tags & Notes directly in the list for RENEWAL type */}
                        {type === 'RENEWAL' && (
                            <div className="mt-2 space-y-1">
                                {s.contactOutcome && (
                                    <div className="text-xs font-semibold text-white bg-blue-500/20 px-2 py-1 rounded inline-block border border-blue-500/30">
                                        Ultimo: {OUTCOME_LABELS[s.contactOutcome] || s.contactOutcome}
                                        {s.contactOutcomeDate && <span className="text-gray-400 font-normal ml-1">({format(new Date(s.contactOutcomeDate), 'dd MMM')})</span>}
                                    </div>
                                )}
                                {s.difficultyTags && s.difficultyTags.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mt-1">
                                        {s.difficultyTags.map(tag => (
                                            <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded border bg-red-500/10 text-red-500 border-red-500/20">
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                )}
                                {(s.coachComment || s.contactNotes) && (
                                    <div className="text-xs text-gray-400 italic bg-gray-950/50 p-2 rounded border border-gray-800 mt-1">
                                        "{s.contactNotes || s.coachComment}"
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                    <button
                        onClick={() => onActionClick && onActionClick(s)}
                        className="text-xs bg-gray-950 hover:bg-white hover:text-black border border-gray-800 hover:border-white text-gray-300 px-4 py-2 rounded-lg transition-all font-medium"
                    >
                        {type === 'RENEWAL' ? 'Gestisci' : 'Contatta'}
                    </button>
                </div>
            ))}
        </div>
    </div>
)

// Wrapper to handle the modal logic from within the list item
// We use a simple button here that will likely need to trigger the parent's modal state
// BUT, since StudentTable uses parent state, we should probably pass a handler or use Context
// actually, the original code had a <button>Gestisci</button> that didn't do anything in the snippet I saw?
// Wait, the original snippet had: <button ...> {type === 'RENEWAL' ? 'Gestisci' : 'Contatta'} </button>
// And it didn't seem to have an onClick logic connected to opening the modal?
// Ah, the Dashboard component is using `visibleStudents` for stats, but `StudentTable` handles the modal.
// The PriorityList was just visual in my previous read?
// Let's check line 64 of original file.
// "button className="..." > ... </button>" -> It has NO onClick.
// Use requested "la possibilità di modificare il rinnovo come precedentemente fatto".
// This implies the previous list DID work? Or maybe I assumed it did.
// Actually, I should make it work. I need to lift the "setViewingStudent" state up or pass it down.
// Since Dashboard doesn't have the modal state, I need to add it to Dashboard.tsx.


import { CheckCircle as CheckCircleIcon } from 'lucide-react'; // Removing duplicate, just using CheckCircle from top import

const Dashboard = () => {
    const { students, currentUser } = useAppContext();

    // Filter students visible to current user
    const visibleStudents = students.filter(s =>
        currentUser?.role === 'COACH' ? s.coachId === currentUser.id : true
    );

    const totalStudents = visibleStudents.length;
    const urgentContacts = visibleStudents.filter(s => isContactUrgent(s)).length;
    const expiringSoon = visibleStudents.filter(s => {
        if (!s.endDate) return false;
        const daysLeft = differenceInDays(new Date(s.endDate), new Date());
        return daysLeft >= 0 && daysLeft <= 7;
    }).length;

    // Logic for Priority Queues
    const studentsIn30DayRenewalWindow = visibleStudents.filter(s => {
        if (!s.endDate) return false;
        const daysLeft = differenceInDays(new Date(s.endDate), new Date());
        return daysLeft >= 0 && daysLeft <= 30;
    });

    const urgentRenewals = studentsIn30DayRenewalWindow.filter(s => {
        if (!s.endDate) return false;
        const daysLeft = differenceInDays(new Date(s.endDate), new Date());
        // Urgent: Left < 7 days OR High Lessons BUT Priority is for real deadlines
        return (daysLeft >= 0 && daysLeft <= 7);
    });

    const upcomingRenewals = studentsIn30DayRenewalWindow.filter(s => {
        if (!s.endDate) return false;
        const daysLeft = differenceInDays(new Date(s.endDate), new Date());
        return (daysLeft > 7 && daysLeft <= 30);
    });

    const supportPriority = students.filter(s => isContactUrgent(s));

    // Modal State
    const [viewingStudent, setViewingStudent] = React.useState<Student | null>(null);

    return (
        <div className="p-8 max-w-[1600px] mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-white mb-2">Benvenuto, {currentUser?.name}</h1>
                <p className="text-gray-400">Ecco la situazione aggiornata degli studenti oggi.</p>
            </div>

            {/* Owner Exclusive: Team Performance */}
            {currentUser?.role === 'OWNER' && (
                <TeamPerformance />
            )}

            {/* RENEWALS DASHBOARD VIEW */}
            {currentUser?.role === 'RENEWALS' ? (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <StatCard
                            title="In Scadenza (30gg)"
                            value={studentsIn30DayRenewalWindow.length}
                            icon={AlertTriangle}
                            color="yellow"
                            className="hover:border-yellow-500/50"
                        />
                        <StatCard
                            title="Rinnovati (Totale)"
                            value={visibleStudents.filter(s => s.isRenewed).length}
                            icon={CheckCircleIcon}
                            color="green"
                            className="hover:border-green-500/50"
                        />
                        <StatCard
                            title="In Difficoltà"
                            value={visibleStudents.filter(s => s.difficultyTags && s.difficultyTags.length > 0).length}
                            icon={AlertCircle}
                            color="red"
                            className="hover:border-red-500/50"
                        />
                        <StatCard
                            title="Totale Studenti"
                            value={totalStudents}
                            icon={Users}
                            color="blue"
                            className="hover:border-blue-500/50"
                        />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <PriorityList
                            title="🚨 In Scadenza (Urgente < 7gg)"
                            students={urgentRenewals}
                            type="RENEWAL"
                            onActionClick={setViewingStudent}
                        />
                        <PriorityList
                            title="📅 Prossimi Rinnovi (30gg)"
                            students={upcomingRenewals}
                            type="RENEWAL"
                            onActionClick={setViewingStudent}
                        />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6 mb-2">
                        <ContactOutcomeTable students={visibleStudents} />
                        <PriorityList
                            title="⚠️ Difficoltà Segnalate"
                            students={studentsIn30DayRenewalWindow.filter(s => (s.difficultyTags && s.difficultyTags.length > 0))}
                            type="RENEWAL"
                            onActionClick={setViewingStudent}
                        />
                    </div>
                </>
            ) : (
                /* GENERIC / OWNER / COACH VIEW */
                <>
                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <StatCard
                            title="Studenti Totali"
                            value={totalStudents}
                            icon={Users}
                            color="blue"
                            className="hover:border-blue-500/50"
                        />
                        <StatCard
                            title="Da Contattare"
                            value={urgentContacts}
                            icon={MessageCircle}
                            color="red"
                            className="hover:border-red-500/50"
                        />
                        <StatCard
                            title="In Scadenza (7gg)"
                            value={expiringSoon}
                            icon={AlertTriangle}
                            color="yellow"
                            className="hover:border-yellow-500/50"
                        />
                        <StatCard
                            title="Active Rate"
                            value={`${visibleStudents.length > 0 ? Math.round((visibleStudents.filter(s => s.status === 'ACTIVE').length / visibleStudents.length) * 100) : 0}%`}
                            icon={TrendingUp}
                            color="green"
                            className="hover:border-green-500/50"
                        />
                    </div>

                    {/* Role Specific Priority Lists */}
                    <div className="grid grid-cols-1 gap-6 mt-8">
                        {(currentUser?.role === 'OWNER') && (
                            <div className="mb-6">
                                <ContactOutcomeTable students={visibleStudents} />
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {(currentUser?.role === 'OWNER') && (
                            <>
                                <PriorityList title="🚨 Rinnovi Urgenti" students={urgentRenewals} type="RENEWAL" onActionClick={setViewingStudent} />
                                <PriorityList title="Urgenza Contatti" students={supportPriority} type="SUPPORT" onActionClick={setViewingStudent} />
                            </>
                        )}
                        {/* Support sees Support Queue */}
                        {(currentUser?.role === 'SUPPORT') && (
                            <PriorityList title="Urgenza Contatti" students={supportPriority} type="SUPPORT" onActionClick={setViewingStudent} />
                        )}
                    </div>
                </>
            )
            }

            <div className="space-y-4 pt-4 border-t border-gray-800/50">
                <div className="flex justify-between items-end">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <Users size={20} className="text-blue-500" />
                        Management Studenti
                    </h3>
                </div>
                <StudentTable />
            </div>

            {/* Modal */}
            {
                viewingStudent && (
                    <StudentDetailModal
                        student={viewingStudent}
                        onClose={() => setViewingStudent(null)}
                    />
                )
            }
        </div >
    );
};

export default Dashboard;
