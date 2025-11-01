import useAuthStore from "@/store/useAuthStore";

const Dashboard = () => {
  const { logout, loading } = useAuthStore();

  return (
    <div className="h-16 bg-secondary flex items-center justify-end px-4">
      <button
        className="btn btn-soft btn-secondary"
        onClick={logout}
        disabled={loading}
      >
        {loading ? <span className="loading loading-spinner"></span> : "Logout"}
      </button>
    </div>
  );
};

export default Dashboard;
