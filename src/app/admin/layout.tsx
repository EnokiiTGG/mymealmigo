"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Sidebar from "@/components/admin-sidebar";
import { getClientAuth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { LogOut } from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Closed by default
  const [isMobile, setIsMobile] = useState(false);
  const { user, loading, isAdmin } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const checkIfMobile = () => {
      const mobile = window.innerWidth < 768; // md breakpoint
      setIsMobile(mobile);
      setIsSidebarOpen(!mobile); // Closed on mobile, open on desktop
    };

    checkIfMobile();
    window.addEventListener("resize", checkIfMobile);
    return () => window.removeEventListener("resize", checkIfMobile);
  }, []);

  // Protect the route
  useEffect(() => {
    if (loading) return;
    if (!user || !isAdmin) router.push("/");
  }, [user, loading, isAdmin, router]);

  const handleLogout = async () => {
    try {
      const auth = getClientAuth();
      await signOut(auth);
      router.push("/");
    } catch (e) {
      console.error("Logout failed:", e);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!user || !isAdmin) return null;

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
        isMobile={isMobile}
      />

      {/* Main content */}
      <div
        className={`flex-1 flex flex-col transition-all duration-300 ${
          isSidebarOpen && isMobile ? "ml-56" : "ml-0 md:ml-64"
        }`}
      >
        {/* Top bar with Logout */}
        <header className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 flex items-center justify-between">
            <h1 className="text-lg md:text-xl font-semibold">Admin Dashboard</h1>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-2 text-sm px-3 py-2 rounded-md border hover:bg-gray-50"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
