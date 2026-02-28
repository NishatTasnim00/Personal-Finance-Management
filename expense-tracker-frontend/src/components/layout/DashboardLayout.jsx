import SideBar from '@/components/shared/Sidebar';
import { Outlet } from 'react-router-dom';

export default function DashboardLayout() {
  return (
    <div className="flex min-h-[calc(100vh-64px)] bg-neutral/70">
      <SideBar />
      <main className="flex-1 overflow-auto p-6 md:p-10 md:ml-16">
        <Outlet />
      </main>
    </div>
  );
}
