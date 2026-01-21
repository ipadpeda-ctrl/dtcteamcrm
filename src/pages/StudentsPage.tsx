import { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import StudentTable from '../components/StudentTable';
import { Plus, X } from 'lucide-react';
import type { PackageType, Student } from '../types';
import { v4 as uuidv4 } from 'uuid';

const StudentsPage = () => {
    const { users, addStudent } = useAppContext();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState<Partial<Student>>({
        name: '',
        email: '',
        package: 'Silver',
        coachId: '',
        startDate: new Date().toISOString().split('T')[0], // Today YYYY-MM-DD
    });

    const coaches = users.filter(u => (u.role === 'COACH' || u.role === 'OWNER') && !u.name.toLowerCase().includes('simone'));

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name || !formData.coachId) return;

        const newStudent: Student = {
            id: uuidv4(),
            name: formData.name,
            email: formData.email,
            package: formData.package as PackageType,
            startDate: new Date(formData.startDate!).toISOString(),
            endDate: '', // Will be calculated by context
            coachId: formData.coachId,
            lessonsDone: 0,
            totalLessons: 10, // Default value, will be recalculated by backend/context if needed
            lastContactDate: new Date().toISOString(),
            status: 'ACTIVE',
            difficultyTags: [],
            notes: ''
        };

        addStudent(newStudent);
        setIsModalOpen(false);
        setFormData({
            name: '',
            email: '',
            package: 'Silver',
            coachId: '',
            startDate: new Date().toISOString().split('T')[0],
        });
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-white">Management Studenti</h1>
                    <p className="text-gray-400">Gestisci l'elenco completo degli studenti dell'accademia.</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors"
                >
                    <Plus size={20} />
                    Nuovo Studente
                </button>
            </div>

            <StudentTable />

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-900 border border-gray-800 rounded-xl w-full max-w-md p-6 shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-white">Aggiungi Studente</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Nome Completo</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full bg-gray-950 border border-gray-800 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Email</label>
                                <input
                                    type="email"
                                    className="w-full bg-gray-950 border border-gray-800 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Pacchetto</label>
                                    <select
                                        className="w-full bg-gray-950 border border-gray-800 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={formData.package}
                                        onChange={e => setFormData({ ...formData, package: e.target.value as PackageType })}
                                    >
                                        <option value="Silver">Silver</option>
                                        <option value="Gold">Gold</option>
                                        <option value="Platinum">Platinum</option>
                                        <option value="Elite">Elite</option>
                                        <option value="Grandmaster">Grandmaster</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Data Inizio</label>
                                    <input
                                        type="date"
                                        required
                                        className="w-full bg-gray-950 border border-gray-800 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={formData.startDate}
                                        onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Assegna Coach</label>
                                <select
                                    required
                                    className="w-full bg-gray-950 border border-gray-800 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={formData.coachId}
                                    onChange={e => setFormData({ ...formData, coachId: e.target.value })}
                                >
                                    <option value="">Seleziona un Coach...</option>
                                    {coaches.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>

                            <button
                                type="submit"
                                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg mt-4 transition-all"
                            >
                                Conferma Inserimento
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StudentsPage;
