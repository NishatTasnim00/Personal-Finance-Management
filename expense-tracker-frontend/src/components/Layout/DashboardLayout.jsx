import SideBar from '@/components/shared/Sidebar';
import { Outlet } from 'react-router-dom';

export default function DashboardLayout() {
  return (
    <div
      className="flex min-h-[calc(100vh-64px)] bg-amber-600"
      style={{ minHeight: 'calc(100vh - 64px)' }}
    >
      <SideBar />
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}