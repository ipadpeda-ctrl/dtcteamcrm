import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';

const MainLayout = () => {
    return (
        <div className="flex h-screen bg-gray-950 text-white overflow-hidden">
            <Sidebar />
            <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-gray-950">
                <Outlet />
            </main>
        </div>
    );
};
export default MainLayout;
