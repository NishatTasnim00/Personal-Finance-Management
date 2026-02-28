import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useTheme } from "@/context/ThemeContext.jsx";
import useAuthStore from "@/store/useAuthStore";
import { Menu } from "lucide-react";
import MenuDrawer from "@/components/shared/MenuDrawer";
import { useGetProfile } from "@/hooks/profile";

const Navbar = () => {
  const { loading, user } = useAuthStore();
  const { data: profile } = useGetProfile();

  const avatarUrl =
    profile?.avatar ||
    user?.photoURL ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(
      profile?.name || user?.displayName || "User"
    )}&background=6366f1&color=fff`;
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleTheme = () => {
    setTheme(theme === "pastel" ? "synthwave" : "pastel");
  };

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/login");
  };

  return (
    <>
      <div className="navbar bg-base-100 shadow-md fixed top-0 z-50 w-full px-4">
        {/* Left Section */}
        <div className="flex-1 flex items-center gap-3">
          {/* Mobile Menu Button */}
          <button
            className="md:hidden btn btn-ghost btn-circle"
            onClick={() => setIsMenuOpen(true)}
          >
            <Menu />
          </button>

          <Link
            to="/dashboard"
            className="text-xl font-bold text-primary"
          >
            Finance Tracker
          </Link>
        </div>

        {/* Right Section */}
        <div className="flex-none gap-2 flex items-center">
          {/* Theme Toggle */}
     <label className="swap swap-rotate btn btn-ghost btn-circle">
          <input
            type="checkbox"
            checked={theme === "synthwave"}
            onChange={toggleTheme}
          />
          <svg
            className="swap-on fill-current w-5 h-5"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
          >
            <path d="M5.64,17l-.71.71a1,1,0,0,0,0,1.41,1,1,0,0,0,1.41,0l.71-.71A1,1,0,0,0,5.64,17ZM5,12a1,1,0,0,0-1-1H3a1,1,0,0,0,0,2H4A1,1,0,0,0,5,12Zm7-7a1,1,0,0,0,1-1V3a1,1,0,0,0-2,0V4A1,1,0,0,0,12,5ZM5.64,7.05a1,1,0,0,0,.7.29,1,1,0,0,0,.71-.29,1,1,0,0,0,0-1.41l-.71-.71A1,1,0,0,0,4.93,6.34Zm12,.29a1,1,0,0,0,.7-.29l.71-.71a1,1,0,1,0-1.41-1.41L17,5.64a1,1,0,0,0,0,1.41A1,1,0,0,0,17.66,7.34ZM21,11H20a1,1,0,0,0,0,2h1a1,1,0,0,0,0-2Zm-9,8a1,1,0,0,0-1,1v1a1,1,0,0,0,2,0V20A1,1,0,0,0,12,19ZM18.36,17A1,1,0,0,0,17,18.36l.71.71a1,1,0,0,0,1.41,0,1,1,0,0,0,0-1.41ZM12,6.5A5.5,5.5,0,1,0,17.5,12,5.51,5.51,0,0,0,12,6.5Zm0,9A3.5,3.5,0,1,1,15.5,12,3.5,3.5,0,0,1,12,15.5Z" />
          </svg>
          <svg
            className="swap-off fill-current w-5 h-5"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
          >
            <path d="M21.64,13a1,1,0,0,0-1.05-.14,8.05,8.05,0,0,1-3.37.73A8.15,8.15,0,0,1,9.08,5.49a8.59,8.59,0,0,1,.25-2A1,1,0,0,0,8,2.36,10.14,10.14,0,1,0,22,14.05,1,1,0,0,0,21.64,13Zm-9.5,6.74A8.14,8.14,0,0,1,7.08,5.22v.27A10.15,10.15,0,0,0,17.22,15.63a9.79,9.79,0,0,0,2.1-.22A8.11,8.11,0,0,1,12.14,19.73Z" />
          </svg>
        </label>

          {/* Profile Avatar */}
          {/* <Link to="/profile" className="btn btn-ghost btn-circle avatar">
            <div className="w-9 rounded-full ring ring-primary ring-offset-base-100 ring-offset-1">
              <img src={avatarUrl} alt="Profile" className="object-cover" />
            </div>
          </Link> */}

          {/* Logout */}
          <button
            className="btn btn-primary btn-sm"
            onClick={handleLogout}
            disabled={loading}
          >
            {loading ? (
              <span className="loading loading-spinner"></span>
            ) : (
              "Logout"
            )}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      <MenuDrawer
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
      />
    </>
  );
};

export default Navbar;