import { Link, useLocation } from "react-router-dom";
import {
  X,
  BanknoteArrowUp,
  BanknoteArrowDown,
  Goal,
  Wallet,
  Brain,
} from "lucide-react";

const navItems = [
  { name: "Income", path: "/dashboard/incomes", icon: <BanknoteArrowUp /> },
  { name: "Expense", path: "/dashboard/expenses", icon: <BanknoteArrowDown /> },
  { name: "Budgets", path: "/dashboard/budgets", icon: <Wallet /> },
  { name: "Savings Goals", path: "/dashboard/savings-goals", icon: <Goal /> },
  { name: "AI Planner", path: "/dashboard/ai-planner", icon: <Brain /> },
];

export default function MenuDrawer({ isOpen, onClose }) {
  const location = useLocation();

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <aside
        className={`
          fixed top-0 left-0 h-full w-64 bg-base-100 shadow-lg z-50
          transform transition-transform duration-300
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
          md:hidden
        `}
      >
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="font-bold text-lg">Finance Tracker</h2>
          <button onClick={onClose}>
            <X />
          </button>
        </div>

        <ul className="p-4 space-y-2">
          {navItems.map((item) => {
            const active = location.pathname === item.path;
            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  onClick={onClose}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg
                    ${
                      active
                        ? "bg-primary text-primary-content"
                        : "hover:bg-base-200"
                    }`}
                >
                  {item.icon}
                  {item.name}
                </Link>
              </li>
            );
          })}
        </ul>
      </aside>
    </>
  );
}