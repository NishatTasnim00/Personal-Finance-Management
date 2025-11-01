import AppRoutes from "@/routes/index.jsx";
import { BrowserRouter as Router } from "react-router-dom";
import useAuthStore from "@/store/useAuthStore";

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
      <AppRoutes />
  );
}

export default App;