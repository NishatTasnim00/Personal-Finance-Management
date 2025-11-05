import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "@/pages/Login";
import Signup from "@/pages/Signup";
import Dashboard from "@/pages/Dashboard";
import Profile from "@/pages/Profile";
import Income from "@/components/Income";
import Expense from "@/components/Expense";
import useAuthStore from "@/store/useAuthStore";
import AppLayout from "@/components/layout/AppLayout";
import DashboardLayout from "@/components/layout/DashboardLayout";

const AppRoutes = () => {
  const { user, loading } = useAuthStore();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-base-200">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        {/* ── PUBLIC ── */}
        <Route
          path="/login"
          element={user ? <Navigate to="/dashboard" replace /> : <Login />}
        />
        <Route
          path="/signup"
          element={user ? <Navigate to="/dashboard" replace /> : <Signup />}
        />

        {/* ── ROOT REDIRECT (outside any layout) ── */}
        <Route
          path="/"
          element={<Navigate to={user ? "/dashboard" : "/login"} replace />}
        />

        {/* ── PROTECTED AREA ── */}
        <Route
          path="/*"
          element={user ? <AppLayout /> : <Navigate to="/login" replace />}
        >
          <Route element={<DashboardLayout />}>
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="income"    element={<Income />} />
            <Route path="expense"   element={<Expense />} />
            <Route path="profile"   element={<Profile />} />
          </Route>

          {/* 404 inside protected zone */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    </Router>
  );
};

export default AppRoutes;