import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import type { User, Role } from '../types';
import { useNavigate } from 'react-router-dom';
import { Lock, User as UserIcon, Shield, Headphones, Briefcase, ArrowRight, Eye, EyeOff } from 'lucide-react';

const LandingPage = () => {
    const { users, login, isLoading } = useAppContext();
    const navigate = useNavigate();
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');

    // Temporary hardcoded credentials until DB is updated
    const CREDENTIALS: Record<string, string> = {
        'Simone': 'simodtc!!',
        'Matteo': 'Mattepeda',
        'Samuela': 'Samusamu123',
        'Thomas': 'thommm11',
        'Responsabile rinnovi': 'Luccc901',
        'Supportochat': 'Poilkj'
    };

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!selectedUser) return;

        // Check password
        // Priority: 1. Hardcoded map, 2. User specific password from DB
        const cleanName = selectedUser.name.trim();
        const userPass = CREDENTIALS[cleanName] || selectedUser.password;

        const isValid = userPass && userPass === password;

        if (isValid) {
            login(selectedUser);
            navigate('/');
        } else {
            setError('Password non corretta');
        }
    };

    const getRoleIcon = (role: Role) => {
        switch (role) {
            case 'OWNER': return <Shield className="w-8 h-8 text-yellow-400" />;
            case 'COACH': return <UserIcon className="w-8 h-8 text-blue-400" />;
            case 'RENEWALS': return <Briefcase className="w-8 h-8 text-green-400" />;
            case 'SUPPORT': return <Headphones className="w-8 h-8 text-purple-400" />;
            default: return <UserIcon className="w-8 h-8 text-gray-400" />;
        }
    };

    if (isLoading) {
        return <div className="min-h-screen bg-gray-950 flex items-center justify-center text-white">Caricamento...</div>;
    }

    return (
        <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[100px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 rounded-full blur-[100px]" />
            </div>

            <div className="z-10 w-full max-w-4xl text-center">
                <h1 className="text-4xl md:text-5xl font-bold text-white mb-2 tracking-tight">
                    Trading Academy Team
                </h1>
                <p className="text-gray-400 mb-12 text-lg">Seleziona il tuo ruolo per accedere</p>

                {!selectedUser ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {users.map((user) => (
                            <button
                                key={user.id}
                                onClick={() => setSelectedUser(user)}
                                className="group relative p-6 bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-2xl hover:border-gray-700 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-blue-500/10 flex flex-col items-center gap-4"
                            >
                                <div className="p-4 bg-gray-800/50 rounded-full group-hover:bg-gray-800 transition-colors">
                                    {getRoleIcon(user.role)}
                                </div>
                                <div className="text-center">
                                    <h3 className="text-xl font-semibold text-white group-hover:text-blue-400 transition-colors">
                                        {user.name}
                                    </h3>
                                    <p className="text-sm text-gray-500 font-medium uppercase tracking-wider mt-1">
                                        {user.role}
                                    </p>
                                </div>
                            </button>
                        ))}
                    </div>
                ) : (
                    <div className="max-w-md mx-auto animate-in fade-in zoom-in duration-300">
                        <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-2xl p-8 shadow-2xl">
                            <div className="flex flex-col items-center gap-4 mb-6">
                                <div className="p-4 bg-gray-800/50 rounded-full">
                                    {getRoleIcon(selectedUser.role)}
                                </div>
                                <h2 className="text-2xl font-bold text-white">Ciao, {selectedUser.name}</h2>
                                <p className="text-gray-400">Inserisci la password per continuare</p>
                            </div>

                            <form onSubmit={handleLogin} className="space-y-4">
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Password"
                                        className="w-full bg-gray-950 border border-gray-800 rounded-lg py-3 pl-10 pr-12 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                                        autoFocus
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                                    >
                                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>

                                {error && (
                                    <p className="text-red-400 text-sm text-center">{error}</p>
                                )}

                                <div className="flex gap-3 mt-6">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSelectedUser(null);
                                            setPassword('');
                                            setError('');
                                        }}
                                        className="flex-1 px-4 py-2 text-gray-400 hover:text-white transition-colors"
                                    >
                                        Indietro
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                                    >
                                        Accedi <ArrowRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LandingPage;
