import { useState } from 'react';
import { format } from 'date-fns';
import { Search, CheckCircle, Clock, Edit2, X, Trash2 } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { isContactUrgent, calculateTotalLessons } from '../utils/businessLogic';
import { getTagColor } from '../utils/tagUtils';
import StudentDetailModal from './StudentDetailModal';
import clsx from 'clsx';
import type { PackageType, StudentStatus, Student } from '../types';

const StudentTable = () => {
    const { students, currentUser, markAsContacted, users, updateStudent, removeStudent } = useAppContext();
    const [filterName, setFilterName] = useState('');
    const [filterStatus, setFilterStatus] = useState<StudentStatus | 'ALL'>('ALL');

    // Modal States
    const [editingStudent, setEditingStudent] = useState<Student | null>(null); // For Quick Edit (Package/Coach)
    const [viewingStudent, setViewingStudent] = useState<Student | null>(null); // For Detail View

    const [editForm, setEditForm] = useState<{ lessonsDone: number, totalLessons: number, coachId: string }>({
        lessonsDone: 0,
        totalLessons: 0,
        coachId: ''
    });

    const coaches = users.filter(u => u.role === 'COACH' || u.role === 'OWNER');

    // Filter logic based on Role
    const visibleStudents = students.filter(s => {
        // Role check
        if (currentUser?.role === 'COACH' && s.coachId !== currentUser.id) return false;
        // Search
        if (filterName && !s.name.toLowerCase().includes(filterName.toLowerCase())) return false;
        // Status
        if (filterStatus !== 'ALL' && s.status !== filterStatus) return false;

        return true;
    });

    const handleEditClick = (student: Student) => {
        setEditingStudent(student);
        setEditForm({
            lessonsDone: student.lessonsDone,
            totalLessons: student.totalLessons || calculateTotalLessons(student.package),
            coachId: student.coachId
        });
    };

    const handleSaveEdit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingStudent) return;

        updateStudent(editingStudent.id, {
            lessonsDone: editForm.lessonsDone,
            totalLessons: editForm.totalLessons,
            coachId: editForm.coachId
        });
        setEditingStudent(null);
    };

    const getPackageColor = (pkg: PackageType) => {
        switch (pkg) {
            case 'Silver': return 'bg-gray-400 text-gray-900 border-gray-300';
            case 'Gold': return 'bg-yellow-400 text-yellow-900 border-yellow-300';
            case 'Platinum': return 'bg-cyan-400 text-cyan-900 border-cyan-300';
            case 'Elite': return 'bg-purple-500 text-purple-100 border-purple-400';
            case 'Grandmaster': return 'bg-red-600 text-red-100 border-red-500 animate-pulse';
            default: return 'bg-gray-700 text-gray-300';
        }
    };

    const getCoachName = (id: string) => users.find(u => u.id === id)?.name || id;

    return (
        <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden shadow-xl">
            {/* Toolbar */}
            <div className="p-4 border-b border-gray-800 flex flex-wrap gap-4 justify-between items-center bg-gray-900/50">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                    <input
                        type="text"
                        placeholder="Cerca studente..."
                        className="w-full bg-gray-950 border border-gray-800 text-gray-200 pl-10 pr-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                        value={filterName}
                        onChange={e => setFilterName(e.target.value)}
                    />
                </div>
                <select
                    className="bg-gray-950 border border-gray-800 text-gray-200 px-4 py-2 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value as StudentStatus | 'ALL')}
                >
                    <option value="ALL">Tutti gli stati</option>
                    <option value="ACTIVE">Attivo</option>
                    <option value="EXPIRED">Scaduto</option>
                    <option value="NOT_RENEWED">Non Rinnovato</option>
                </select>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-400">
                    <thead className="bg-gray-950 text-gray-500 uppercase text-xs font-semibold tracking-wider">
                        <tr>
                            <th className="px-6 py-4">Studente</th>
                            <th className="px-6 py-4">Pacchetto</th>
                            <th className="px-6 py-4">Scadenza</th>
                            <th className="px-6 py-4">Lezioni</th>
                            <th className="px-6 py-4 text-center">Ultimo Contatto</th>
                            <th className="px-6 py-4">Coach</th>
                            <th className="px-6 py-4">Azioni</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800/50">
                        {visibleStudents.map(student => {
                            const isUrgent = isContactUrgent(student);
                            return (
                                <tr
                                    key={student.id}
                                    className="hover:bg-gray-800/30 transition-colors group cursor-pointer"
                                    onClick={(e) => {
                                        // Prevent opening detail when clicking specific action buttons
                                        if ((e.target as HTMLElement).closest('button')) return;
                                        setViewingStudent(student);
                                    }}
                                >
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-white text-base">{student.name}</div>
                                        <div className="text-xs text-gray-500">{student.email}</div>
                                        {student.difficultyTags && student.difficultyTags.length > 0 && (
                                            <div className="flex flex-wrap gap-1 mt-2">
                                                {student.difficultyTags.slice(0, 3).map(tag => (
                                                    <span key={tag} className={clsx("text-[10px] px-1.5 py-0.5 rounded border opacity-80", getTagColor(tag))}>
                                                        {tag}
                                                    </span>
                                                ))}
                                                {student.difficultyTags.length > 3 && (
                                                    <span className="text-[10px] px-1.5 py-0.5 rounded border bg-gray-800 text-gray-400 border-gray-700">
                                                        +{student.difficultyTags.length - 3}
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={clsx("px-2.5 py-1 rounded-full text-xs font-bold border shadow-sm", getPackageColor(student.package))}>
                                            {student.package}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 font-mono text-gray-300">
                                        <div>{student.endDate ? format(new Date(student.endDate), 'dd MMM yyyy') : '-'}</div>
                                        {student.isRenewed && (
                                            <div className="text-[10px] text-green-400 flex items-center gap-1 mt-1">
                                                <CheckCircle size={10} /> Rinnovato
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-24 bg-gray-800 rounded-full h-2 overflow-hidden">
                                                <div
                                                    className="bg-blue-500 h-full rounded-full"
                                                    style={{ width: `${Math.min((student.lessonsDone / (student.totalLessons || calculateTotalLessons(student.package))) * 100, 100)}%` }}
                                                ></div>
                                            </div>
                                            <span className="text-xs font-medium text-gray-300">{student.lessonsDone}/{student.totalLessons || calculateTotalLessons(student.package)}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <div className="flex flex-col items-center gap-2">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); markAsContacted(student.id); }}
                                                className={clsx(
                                                    "px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-2 transition-all",
                                                    isUrgent
                                                        ? "bg-red-500/10 text-red-500 border-red-500/30 animate-pulse hover:bg-red-500/20"
                                                        : "bg-green-500/10 text-green-500 border-green-500/20 hover:bg-green-500/20 opacity-80 hover:opacity-100"
                                                )}
                                            >
                                                {isUrgent ? <Clock size={12} /> : <CheckCircle size={12} />}
                                                {isUrgent ? 'URGENTE' : 'OK'}
                                            </button>
                                            <span className="text-[10px] text-gray-300 font-mono">
                                                {format(new Date(student.lastContactDate), 'dd/MM HH:mm')}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-xs text-gray-300">
                                        {getCoachName(student.coachId)}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleEditClick(student); }}
                                                className="text-gray-500 hover:text-white hover:bg-gray-800 p-2 rounded-lg transition-colors"
                                                title="Modifica"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            {currentUser?.role === 'OWNER' && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (window.confirm('Sei sicuro di voler eliminare questo studente? Questa azione è irreversibile.')) {
                                                            removeStudent(student.id);
                                                        }
                                                    }}
                                                    className="text-gray-500 hover:text-red-500 hover:bg-red-500/10 p-2 rounded-lg transition-colors"
                                                    title="Elimina"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Edit Modal */}
            {editingStudent && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-900 border border-gray-800 rounded-xl w-full max-w-sm p-6 shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-white">Modifica Studente</h3>
                            <button onClick={() => setEditingStudent(null)} className="text-gray-400 hover:text-white transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSaveEdit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Lezioni Fatte</label>
                                <input
                                    type="number"
                                    min="0"
                                    disabled={currentUser?.role === 'RENEWALS'}
                                    className={clsx("w-full bg-gray-950 border border-gray-800 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-blue-500 outline-none",
                                        currentUser?.role === 'RENEWALS' && "opacity-50 cursor-not-allowed"
                                    )}
                                    value={editForm.lessonsDone}
                                    onChange={e => setEditForm(prev => ({ ...prev, lessonsDone: parseInt(e.target.value) || 0 }))}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Lezioni Totali</label>
                                <input
                                    type="number"
                                    min="1"
                                    disabled={currentUser?.role === 'RENEWALS'}
                                    className={clsx("w-full bg-gray-950 border border-gray-800 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-blue-500 outline-none",
                                        currentUser?.role === 'RENEWALS' && "opacity-50 cursor-not-allowed"
                                    )}
                                    value={editForm.totalLessons}
                                    onChange={e => setEditForm(prev => ({ ...prev, totalLessons: parseInt(e.target.value) || 1 }))}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Coach Assegnato</label>
                                <select
                                    disabled={currentUser?.role !== 'OWNER'} // Only Owner can change Coach in this view
                                    className="w-full bg-gray-950 border border-gray-800 rounded-lg p-2.5 text-white disabled:opacity-50 disabled:cursor-not-allowed focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={editForm.coachId}
                                    onChange={e => setEditForm(prev => ({ ...prev, coachId: e.target.value }))}
                                >
                                    {coaches.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                                {currentUser?.role !== 'OWNER' && (
                                    <p className="text-xs text-yellow-500/80 mt-1">Solo l'Owner può riassegnare il coach.</p>
                                )}
                                {currentUser?.role === 'RENEWALS' && (
                                    <p className="text-xs text-red-500/80 mt-1">Il Responsabile Rinnovi non può modificare le lezioni.</p>
                                )}
                            </div>

                            <button
                                type="submit"
                                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg mt-4 transition-all"
                            >
                                Salva Modifiche
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Detail Modal */}
            {viewingStudent && (
                <StudentDetailModal
                    student={viewingStudent}
                    onClose={() => setViewingStudent(null)}
                />
            )}
        </div>
    );
};

export default StudentTable;
