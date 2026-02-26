import AppRoutes from "@/routes/index.jsx";
import useAuthStore from "@/store/useAuthStore";
import ErrorBoundary from "@/components/ErrorBoundary";

const App = () => {
  const { loading } = useAuthStore();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <AppRoutes />
      <div className="toast toast-bottom toast-end z-1000" />
    </ErrorBoundary>
  );
}

export default App;