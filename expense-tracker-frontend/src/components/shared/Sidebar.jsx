// src/components/shared/Sidebar.tsx
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, LayoutDashboard, BanknoteArrowUp, BanknoteArrowDown  } from "lucide-react";   // any icon library you use
import useAuthStore from "@/store/useAuthStore";

const navItems = [
  { name: "Income",    path: "/income",    icon: <BanknoteArrowUp />},
  { name: "Expence", path: "/expense", icon: <BanknoteArrowDown /> },
];

export default function Sidebar() {
  // local state – no props required
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const { user } = useAuthStore();

  return (
    <aside
      className={`
        flex flex-col bg-base-200 text-base-content
        transition-all duration-300
        ${isOpen ? "w-64" : "w-16"}
        min-h-full
      `}
    >
      {/* ---------- Header (toggle only) ---------- */}
      <div className="flex items-center justify-between p-4">
        {/* Logo – visible only when open */}
        <div className={`flex items-center gap-2 ${isOpen ? "block" : "hidden"}`}>
          <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white font-bold text-lg">
            FT
          </div>
          <div>
            <div className="font-bold text-lg">FinanceTracker</div>
            <div className="text-xs opacity-70">Personal Finance</div>
          </div>
        </div>

        {/* Toggle button – always visible */}
        <button
          onClick={() => setIsOpen((o) => !o)}
          className="p-1 rounded-lg hover:bg-base-300 transition-colors"
          aria-label={isOpen ? "Collapse sidebar" : "Expand sidebar"}
        >
          {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* ---------- Navigation ---------- */}
      <nav className="flex-1 px-2">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const active = location.pathname === item.path;
            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`
                    flex items-center gap-3 px-3 py-2 rounded-lg transition-all
                    ${active ? "bg-primary text-primary-content" : "hover:bg-base-300"}
                  `}
                >
                  {/* Icon – always shown */}
                  <span className="text-xl">{item.icon}</span>
                  {/* Title – shown only when open */}
                  <span className={`truncate ${isOpen ? "block" : "hidden"}`}>
                    {item.name}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* ---------- User info (bottom) ---------- */}
      <div className="border-t border-base-300 p-4">
        <div className="flex items-center gap-3">
          <div className="avatar">
            <div className="w-10 rounded-full">
              <img
                src={
                  user?.photoURL ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(
                    user?.displayName || "User"
                  )}&background=6366f1&color=fff`
                }
                alt="User avatar"
              />
            </div>
          </div>

          {/* User text – shown only when open */}
          <div className={`flex-1 ${isOpen ? "block" : "hidden"}`}>
            <div className="font-medium truncate">{user?.displayName || "User"}</div>
            <div className="text-xs opacity-70 truncate">{user?.email}</div>
          </div>
        </div>
      </div>
    </aside>
  );
}