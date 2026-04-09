'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '@/firebase';
import { onAuthStateChanged, User, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import Link from 'next/link';
import { LayoutDashboard, Package, Brush, Wrench, BarChart3, LogIn, LogOut } from 'lucide-react';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  signIn: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isAdmin: false,
  signIn: async () => {},
  logout: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        const adminEmail = "yashrajvansh008@gmail.com";
        setIsAdmin(user.email === adminEmail && user.emailVerified);
        
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) {
          await setDoc(userRef, {
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
            role: user.email === adminEmail ? 'admin' : 'user',
            created_at: serverTimestamp(),
          });
        }
      } else {
        setIsAdmin(false);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const signIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Sign in error:", error);
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, loading, isAdmin, signIn, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function Navbar() {
  const { user, loading, signIn, logout, isAdmin } = useAuth();

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2 text-[#FF385C]">
            <LayoutDashboard className="h-8 w-8" fill="currentColor" strokeWidth={1} />
            <span className="text-xl font-bold tracking-tight">
              superhost<span className="font-medium">os</span>
            </span>
          </Link>
          
          <div className="hidden md:flex items-center gap-6 pl-8 border-l border-gray-200">
            <NavLink href="/" label="Dashboard" />
            <NavLink href="/messages" label="Messages" />
            <NavLink href="/housekeeping" label="Housekeeping" />
            <NavLink href="/shop" label="Inventory" />
          </div>
        </div>

        <div className="flex items-center gap-4">
          {loading ? (
            <div className="h-8 w-8 animate-pulse rounded-full bg-gray-200" />
          ) : user ? (
            <Link href="/account" className="flex items-center gap-3 rounded-full border border-gray-300 p-1.5 pr-4 hover:shadow-md transition-shadow cursor-pointer">
              <div className="h-8 w-8 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center text-gray-500">
                {user.photoURL ? <img src={user.photoURL} alt="" className="h-full w-full object-cover" /> : <LayoutDashboard className="h-4 w-4" />}
              </div>
              <div className="hidden sm:flex flex-col">
                <span className="text-sm font-medium text-[#222222] leading-tight">{user.displayName}</span>
                <span className="text-[10px] text-[#717171] uppercase tracking-wider">{isAdmin ? 'Admin' : 'Staff'}</span>
              </div>
            </Link>
          ) : (
            <button
              onClick={signIn}
              className="flex items-center gap-2 rounded-lg bg-[#FF385C] px-6 py-2.5 text-sm font-semibold text-white transition-transform hover:scale-[1.02] active:scale-95"
            >
              <LogIn className="h-4 w-4" />
              Sign In
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}

function NavLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="text-sm font-medium text-[#717171] transition-colors hover:text-[#222222]"
    >
      {label}
    </Link>
  );
}
