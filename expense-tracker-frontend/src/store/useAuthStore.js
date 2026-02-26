import { create } from 'zustand';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';

const useAuthStore = create((set) => ({
  user: null,
  loading: true,
  setUser: (user) => set({ user, loading: false }),
  logout: async () => {
    await signOut(auth);
    set({ user: null });
  },
}));

// Store the unsubscribe function so it can be cleaned up if needed
const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
  useAuthStore.getState().setUser(user);
});

// Export for cleanup (e.g., in tests or when app unmounts)
export const cleanupAuthListener = () => unsubscribeAuth();

export default useAuthStore;