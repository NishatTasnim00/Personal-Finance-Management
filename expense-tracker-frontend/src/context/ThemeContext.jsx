import { createContext, useContext, useEffect, useState } from "react";
import api from "@/lib/api";
import { toastError } from "@/lib/toast";
import useAuthStore from "@/store/useAuthStore";

const ThemeContext = createContext({
  theme: "light",
  setTheme: () => {},
  loading: false,
});

// Map backend theme values -> DaisyUI themes
const mapBackendToDaisy = (backendTheme) => {
  if (backendTheme === "dark") return "synthwave";
  if (backendTheme === "light") return "pastel";

  // system
  if (window.matchMedia?.("(prefers-color-scheme: dark)").matches) {
    return "synthwave";
  }
  return "pastel";
};

// Map DaisyUI themes -> backend theme values
const mapDaisyToBackend = (daisyTheme) => {
  if (daisyTheme === "synthwave") return "dark";
  if (daisyTheme === "pastel") return "light";
  return "system";
};

export const ThemeProvider = ({ children }) => {
  const user = useAuthStore((s) => s.user);
  const [theme, setThemeState] = useState(() => {
    return localStorage.getItem("theme") || "pastel";
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  // Sync theme from backend only when user is logged in
  useEffect(() => {
    if (!user) return;

    let cancelled = false;
    setLoading(true);

    const loadThemeFromProfile = async () => {
      try {
        const { result } = await api.get("/user/profile");
        if (cancelled) return;

        const backendTheme = result?.theme || "system";
        const daisyTheme = mapBackendToDaisy(backendTheme);
        setThemeState(daisyTheme);
      } catch (err) {
        if (!cancelled) {
          console.error("Failed to load theme from profile:", err);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadThemeFromProfile();

    return () => {
      cancelled = true;
    };
  }, [user]);

  const setTheme = async (nextTheme) => {
    setThemeState(nextTheme);

    // Persist to backend
    try {
      await api.patch("/user/profile", {
        theme: mapDaisyToBackend(nextTheme),
      });
    } catch (err) {
      console.error("Failed to save theme:", err);
      toastError(
        err?.response?.data?.message || "Failed to save theme preference",
      );
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, loading }}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeContext;

// eslint-disable-next-line react-refresh/only-export-components
export const useTheme = () => useContext(ThemeContext);
