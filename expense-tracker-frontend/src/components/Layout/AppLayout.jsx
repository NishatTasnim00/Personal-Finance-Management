import Navbar from "@/components/shared/Navber";
import { Outlet } from "react-router-dom"; 

const AppLayout = () => {
  return (
    <div className="min-h-screen bg-base-200">
      <Navbar />
      <main className="pt-16">
        <Outlet />
      </main>
    </div>
  );
};

export default AppLayout;