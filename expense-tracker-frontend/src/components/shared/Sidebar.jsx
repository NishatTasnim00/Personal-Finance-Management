import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Menu,
  X,
  BanknoteArrowUp,
  BanknoteArrowDown,
  Goal,
  Wallet,
  Brain,
  LayoutDashboard,
} from "lucide-react";
import useAuthStore from "@/store/useAuthStore";
import { useGetProfile } from "@/hooks/profile";

const navItems = [
  { name: "Dashboard",     path: "/dashboard",               icon: <LayoutDashboard /> },
  { name: "Income",        path: "/dashboard/incomes",        icon: <BanknoteArrowUp /> },
  { name: "Expense",       path: "/dashboard/expenses",       icon: <BanknoteArrowDown /> },
  { name: "Budgets",       path: "/dashboard/budgets",        icon: <Wallet /> },
  { name: "Savings Goals", path: "/dashboard/savings-goals",  icon: <Goal /> },
  { name: "AI Planner",    path: "/dashboard/ai-planner",     icon: <Brain /> },
];

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const { user } = useAuthStore();
  const { data: profile } = useGetProfile();

  const handleNavClick = () => {
    if (window.innerWidth < 768) setIsOpen(false);
  };

  const avatarUrl =
    profile?.avatar ||
    user?.photoURL ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(
      profile?.name || user?.displayName || "User",
    )}&background=6366f1&color=fff`;

  const displayName = profile?.name || user?.displayName || "User";
  const displayEmail = profile?.email || user?.email;

  return (
    <>
      {/* Mobile hamburger - only on small screens */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden fixed top-[18px] left-4 z-50 p-2 rounded-lg bg-base-200 shadow hover:bg-neutral"
        aria-label="Open sidebar"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
          onClick={() => setIsOpen(!isOpen)}
        />
      )}

      {/* Sidebar - fixed, full height, doesn't scroll with content */}
      <aside
        className={`
          fixed top-16 left-0 h-[calc(100vh-64px)]
          z-50 bg-base-200 flex flex-col
          transition-all duration-300 ease-in-out
          ${
            isOpen
              ? "translate-x-0 w-64"
              : "-translate-x-full w-64 md:translate-x-0 md:w-16"
          }
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 pl-3 shrink-0">
          <div
            className={`flex items-center gap-2 overflow-hidden transition-all duration-300 ${isOpen ? "opacity-100 w-auto" : "opacity-0 w-0 md:hidden"}`}
          >
            <img src="/budget.png" alt="logo" className="h-8 shrink-0" />
            <div className="whitespace-nowrap">
              <div className="font-bold text-lg">FinanceTracker</div>
              <div className="text-xs opacity-70">Personal Finance</div>
            </div>
          </div>

          {/* Desktop toggle */}
          <button
            onClick={() => setIsOpen((o) => !o)}
            className="hidden md:flex p-2 rounded-lg hover:bg-neutral ml-auto"
            aria-label={isOpen ? "Collapse sidebar" : "Expand sidebar"}
          >
            {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          {/* Mobile close */}
          <button
            onClick={() => setIsOpen(false)}
            className="md:hidden p-2 rounded-lg hover:bg-neutral ml-auto"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2 overflow-y-auto">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const active = location.pathname === item.path;
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    onClick={handleNavClick}
                    title={!isOpen ? item.name : undefined}
                    className={`
                      flex items-center gap-3 px-3 py-2 rounded-lg transition-all
                      ${active ? "bg-primary text-primary-content" : "hover:bg-neutral"}
                    `}
                  >
                    <span className="text-xl shrink-0">{item.icon}</span>
                    <span
                      className={`truncate transition-all duration-300 ${isOpen ? "opacity-100 w-auto" : "opacity-0 w-0 overflow-hidden md:hidden"}`}
                    >
                      {item.name}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User info with real profile picture */}
        <div className="p-3 shrink-0">
          <Link
            to="/profile"
            onClick={handleNavClick}
            className={`flex items-center gap-3 ${isOpen ? "rounded-lg md:hover:bg-neutral p-3" : "p-1 mb-5"}  transition-all`}
            title={!isOpen ? displayName : undefined}
          >
            <div className="avatar shrink-0">
              <div className="w-9 h-9 rounded-full ring ring-primary ring-offset-base-100 ring-offset-1">
                <img
                  src={avatarUrl}
                  alt={displayName}
                  className="object-cover"
                />
              </div>
            </div>
            <div
              className={`flex-1 min-w-0 transition-all duration-300 ${isOpen ? "opacity-100 w-auto" : "opacity-0 w-0 overflow-hidden md:hidden"}`}
            >
              <div className="font-medium truncate text-sm">{displayName}</div>
              <div className="text-xs opacity-70 truncate">{displayEmail}</div>
            </div>
          </Link>
        </div>
      </aside>
    </>
  );
}
