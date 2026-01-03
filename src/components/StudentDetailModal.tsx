import { useState } from 'react';
import { X, Phone, CheckCircle, Save } from 'lucide-react';
import { format } from 'date-fns';
import { useAppContext } from '../context/AppContext';
import { DIFFICULTY_TAGS } from '../utils/tagUtils';
import type { Student } from '../types';
import clsx from 'clsx';

interface StudentDetailModalProps {
    student: Student;
    onClose: () => void;
}

const StudentDetailModal = ({ student, onClose }: StudentDetailModalProps) => {
    const { updateStudent, currentUser, users } = useAppContext();
    const [activeTab, setActiveTab] = useState<'overview' | 'tags' | 'notes'>('overview');

    // Local state for editing
    const [formData, setFormData] = useState({
        isRenewed: student.isRenewed || false,
        renewalDate: student.renewalDate || '',
        callBooked: student.callBooked || false,
        difficultyTags: student.difficultyTags || [],
        notes: student.notes || '',
        coachComment: student.coachComment || '',
        coachId: student.coachId
    });

    const handleSave = () => {
        // If renewed, the main endDate should be updated to the renewal date
        const newEndDate = formData.isRenewed && formData.renewalDate ? formData.renewalDate : student.endDate;

        // Calculate new status
        let newStatus = student.status;

        // Logic: If the new end date is in the future, the student should be ACTIVE
        // This handles both Renewal cases and manual date extensions
        if (newEndDate) {
            const end = new Date(newEndDate);
            const now = new Date();
            console.log('--- HANDLE SAVE DEBUG ---');
            console.log('Original Status:', student.status);
            console.log('Is Renewed:', formData.isRenewed);
            console.log('New End Date String:', newEndDate);
            console.log('Parsed End Date:', end);
            console.log('Now:', now);
            console.log('End > Now:', end > now);

            if (end > now) {
                newStatus = 'ACTIVE';
                console.log('Setting Status to ACTIVE');
            }
        }

        const updates: Partial<Student> = {
            ...formData,
            endDate: newEndDate,
            status: newStatus
        };
        updateStudent(student.id, updates);
        onClose();
    };

    const toggleTag = (tagLabel: string) => {
        setFormData(prev => {
            const currentTags = prev.difficultyTags;
            if (currentTags.includes(tagLabel)) {
                return { ...prev, difficultyTags: currentTags.filter(t => t !== tagLabel) };
            } else {
                return { ...prev, difficultyTags: [...currentTags, tagLabel] };
            }
        });
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
            <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="p-6 border-b border-gray-800 bg-gray-900/50 flex justify-between items-start">
                    <div>
                        <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                            {student.name}
                            <span className={clsx("px-2 py-0.5 rounded-full text-xs border",
                                student.status === 'ACTIVE' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                                    student.status === 'EXPIRED' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-gray-700 text-gray-300 border-gray-600')}>
                                {student.status}
                            </span>
                        </h2>
                        <div className="text-gray-400 text-sm mt-1 flex items-center gap-4">
                            <span>{student.email}</span>
                            <span>•</span>
                            <span>{student.package} Plan</span>
                            {/* Original Coach Display */}
                            {student.originalCoachId && student.originalCoachId !== student.coachId && (
                                <>
                                    <span>•</span>
                                    <span className="text-gray-500 italic flex items-center gap-1">
                                        Ex: {users.find(u => u.id === student.originalCoachId)?.name.split(' ')[0]}
                                    </span>
                                </>
                            )}
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-800 bg-gray-900/30">
                    <button
                        onClick={() => setActiveTab('overview')}
                        className={clsx("flex-1 py-4 text-sm font-medium border-b-2 transition-colors",
                            activeTab === 'overview' ? "border-blue-500 text-blue-400" : "border-transparent text-gray-400 hover:text-white")}
                    >
                        Panoramica & Rinnovi
                    </button>
                    <button
                        onClick={() => setActiveTab('tags')}
                        className={clsx("flex-1 py-4 text-sm font-medium border-b-2 transition-colors",
                            activeTab === 'tags' ? "border-blue-500 text-blue-400" : "border-transparent text-gray-400 hover:text-white")}
                    >
                        Difficoltà & Tag
                    </button>
                    <button
                        onClick={() => setActiveTab('notes')}
                        className={clsx("flex-1 py-4 text-sm font-medium border-b-2 transition-colors",
                            activeTab === 'notes' ? "border-blue-500 text-blue-400" : "border-transparent text-gray-400 hover:text-white")}
                    >
                        Note & Commenti
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
                    {activeTab === 'overview' && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Renewal Section */}
                                <div className="bg-gray-950/50 p-4 rounded-xl border border-gray-800 space-y-4">
                                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                                        <CheckCircle size={16} /> Stato Rinnovo
                                    </h3>

                                    <div className="flex items-center justify-between p-3 bg-gray-900 rounded-lg border border-gray-800">
                                        <span className="text-gray-300">Ha Rinnovato?</span>
                                        <button
                                            onClick={() => setFormData(prev => ({ ...prev, isRenewed: !prev.isRenewed }))}
                                            className={clsx("w-12 h-6 rounded-full transition-colors relative", formData.isRenewed ? "bg-green-600" : "bg-gray-700")}
                                        >
                                            <div className={clsx("absolute top-1 w-4 h-4 rounded-full bg-white transition-all shadow-md", formData.isRenewed ? "left-7" : "left-1")} />
                                        </button>
                                    </div>

                                    {formData.isRenewed && (
                                        <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                                            <div>
                                                <label className="text-xs text-gray-500 mb-1 block">Data Scadenza Rinnovo</label>
                                                <input
                                                    type="date"
                                                    className="w-full bg-gray-900 border border-gray-800 rounded-lg p-2 text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                                    value={formData.renewalDate ? formData.renewalDate.substring(0, 10) : ''}
                                                    onChange={e => setFormData(prev => ({ ...prev, renewalDate: e.target.value }))}
                                                />
                                            </div>

                                            {/* Coach Reassignment - Owner/Renewals Only */}
                                            {(currentUser?.role === 'OWNER' || currentUser?.role === 'RENEWALS') && (
                                                <div className="pt-2 border-t border-gray-800">
                                                    <label className="text-xs text-blue-400 mb-1 block font-bold">Assegna Nuovo Coach</label>
                                                    <select
                                                        className="w-full bg-gray-900 border border-gray-800 rounded-lg p-2 text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                                        value={formData.coachId}
                                                        onChange={e => setFormData(prev => ({ ...prev, coachId: e.target.value }))}
                                                    >
                                                        {users
                                                            .filter(u => u.role === 'COACH' || u.role === 'OWNER')
                                                            .map(coach => (
                                                                <option key={coach.id} value={coach.id}>
                                                                    {coach.name}
                                                                </option>
                                                            ))
                                                        }
                                                    </select>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Engagement Section */}
                                <div className="bg-gray-950/50 p-4 rounded-xl border border-gray-800 space-y-4">
                                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                                        <Phone size={16} /> Engagement
                                    </h3>

                                    <div className="flex items-center justify-between p-3 bg-gray-900 rounded-lg border border-gray-800">
                                        <span className="text-gray-300">Call Prenotata?</span>
                                        <button
                                            disabled={currentUser?.role === 'RENEWALS'} // Disabled for Renewals
                                            onClick={() => setFormData(prev => ({ ...prev, callBooked: !prev.callBooked }))}
                                            className={clsx("w-12 h-6 rounded-full transition-colors relative",
                                                formData.callBooked ? "bg-blue-600" : "bg-gray-700",
                                                currentUser?.role === 'RENEWALS' && "opacity-50 cursor-not-allowed"
                                            )}
                                        >
                                            <div className={clsx("absolute top-1 w-4 h-4 rounded-full bg-white transition-all shadow-md", formData.callBooked ? "left-7" : "left-1")} />
                                        </button>
                                    </div>

                                    <div className="p-3 bg-gray-900 rounded-lg border border-gray-800 mt-2">
                                        <div className="text-xs text-gray-500 mb-1">Ultimo Contatto</div>
                                        <div className="text-sm text-white font-mono">{format(new Date(student.lastContactDate), 'dd MMM yyyy HH:mm')}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'tags' && (
                        <div className="space-y-4">
                            <p className="text-sm text-gray-400">Seleziona le principali difficoltà riscontrate dallo studente.</p>
                            <div className="flex flex-wrap gap-2">
                                {DIFFICULTY_TAGS.map(tag => {
                                    const isSelected = formData.difficultyTags.includes(tag.label);
                                    return (
                                        <button
                                            key={tag.label}
                                            onClick={() => toggleTag(tag.label)}
                                            className={clsx(
                                                "px-3 py-1.5 rounded-lg text-sm font-medium border transition-all flex items-center gap-2",
                                                isSelected
                                                    ? tag.color + " ring-2 ring-offset-2 ring-offset-gray-900 ring-blue-500/50"
                                                    : "bg-gray-900 text-gray-400 border-gray-800 hover:bg-gray-800 hover:text-gray-200"
                                            )}
                                        >
                                            {isSelected && <CheckCircle size={12} />}
                                            {tag.label}
                                        </button>
                                    );
                                })}
                            </div>

                        </div>
                    )}

                    {activeTab === 'notes' && (
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">Note Interne (Visibili a tutto il team)</label>
                                <textarea
                                    className="w-full h-32 bg-gray-950 border border-gray-800 rounded-xl p-4 text-gray-300 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                                    placeholder="Scrivi note dettagliate su progressi, problemi o strategie..."
                                    value={formData.notes}
                                    onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-800 bg-gray-900/50 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors font-medium"
                    >
                        Annulla
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-lg shadow-lg shadow-blue-900/20 font-medium flex items-center gap-2 transition-all active:scale-95"
                    >
                        <Save size={18} />
                        Salva Modifiche
                    </button>
                </div>
            </div>
        </div>
    );
};

export default StudentDetailModal;
