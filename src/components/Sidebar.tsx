import { useState } from 'react';
import { LayoutDashboard, Users, LogOut, Settings, Upload } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { NavLink } from 'react-router-dom';
import clsx from 'clsx';
import DataImportModal from './DataImportModal';

const Sidebar = () => {
    const { currentUser, logout } = useAppContext();
    const [showImport, setShowImport] = useState(false);

    const linkClass = ({ isActive }: { isActive: boolean }) =>
        clsx(
            "flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer transition-colors",
            isActive
                ? "bg-blue-600/10 border border-blue-600/20 text-blue-400 font-medium"
                : "text-gray-400 hover:text-white hover:bg-gray-800"
        );

    return (
        <aside className="w-72 bg-gray-900 border-r border-gray-800 flex flex-col">
            <div className="p-6">
                <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500">
                    Trading Academy
                </h1>
                <p className="text-xs text-gray-500 mt-1 uppercase tracking-wider">Management System</p>
            </div>

            <nav className="flex-1 px-4 space-y-2">
                <NavLink to="/" end className={linkClass}>
                    <LayoutDashboard size={20} />
                    <span>Dashboard</span>
                </NavLink>
                <NavLink to="/students" className={linkClass}>
                    <Users size={20} />
                    <span>Studenti</span>
                </NavLink>

                <button
                    onClick={() => setShowImport(true)}
                    className="w-full flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg cursor-pointer transition-colors"
                >
                    <Upload size={20} />
                    <span>Importa Dati</span>
                </button>

                {/* Placeholder Settings */}
                <div className="flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg cursor-pointer transition-colors opacity-50">
                    <Settings size={20} />
                    <span>Impostazioni</span>
                </div>
            </nav>

            <div className="p-4 border-t border-gray-800 bg-gray-900/50">
                <div className="flex items-center gap-3 text-gray-300">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center font-bold text-white shadow-lg shadow-blue-500/20">
                        {currentUser?.name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">{currentUser?.name}</div>
                        <div className="text-xs text-blue-400 font-medium">{currentUser?.role}</div>
                    </div>
                    <button
                        onClick={logout}
                        className="p-2 hover:bg-gray-800 rounded-lg transition-colors group"
                        title="Esci"
                    >
                        <LogOut size={18} className="text-gray-500 group-hover:text-red-400 transition-colors" />
                    </button>
                </div>
            </div>
            {showImport && <DataImportModal onClose={() => setShowImport(false)} />}
        </aside>
    );
};
export default Sidebar;
