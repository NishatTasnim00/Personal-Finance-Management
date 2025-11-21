import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {toastError} from '@/lib/toast'
// const queryClient = new QueryClient();

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 30,        // 30 seconds
      gcTime: 1000 * 60 * 5,       // 5 minutes (formerly cacheTime)
      refetchOnWindowFocus: false,
      retry: 1,
    },
    mutations: {
      onError: (err) => {
        toastError(err ||"Something went wrong!");
      },
    },
  },
});

const savedTheme = localStorage.getItem('theme') || 'light';
document.documentElement.setAttribute('data-theme', savedTheme);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
    <App />
    </QueryClientProvider>
  </StrictMode>,
)
