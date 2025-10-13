// src/components/navbar.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, LogOut } from "lucide-react";
import { getClientAuth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, loading, isAdmin, isNutritionist } = useAuth(); // ← include isNutritionist
  const router = useRouter();

  const handleLogout = async () => {
    try {
      const auth = await getClientAuth();
      if (!auth) throw new Error("Auth not available on server");
      await signOut(auth);
      router.push("/");
      setMobileMenuOpen(false);
    } catch (err) {
      console.error("Error logging out:", err);
      router.push("/");
      setMobileMenuOpen(false);
    }
  };

  if (loading) return <div className="bg-white h-16 animate-pulse" />;

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: Brand + Links */}
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Link href="/" className="text-xl font-bold text-[#58e221]">
                MyMealMigo
              </Link>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-6 lg:space-x-8">
              <Link href="/#features" className="text-gray-500 hover:border-[#58e221] hover:text-[#58e221] inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium">Features</Link>
              <Link href="/#pricing" className="text-gray-500 hover:border-[#58e221] hover:text-[#58e221] inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium">Pricing</Link>
              <Link href="/#testimonials" className="text-gray-500 hover:border-[#58e221] hover:text-[#58e221] inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium">Testimonials</Link>
              <Link href="/#howitworks" className="text-gray-500 hover:border-[#58e221] hover:text-[#58e221] inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium">How It Works</Link>
              <Link href="/#download" className="text-gray-500 hover:border-[#58e221] hover:text-[#58e221] inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium">Download</Link>
              <Link href="/calculators" className="text-gray-500 hover:border-[#58e221] hover:text-[#58e221] inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium">Calculators</Link>
              <Link href="/about-project" className="text-gray-500 hover:text-[#58e221] inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium">About Project</Link>

              {/* Admin link */}
              {user && isAdmin && (
                <Link
                  href="/admin/dashboard"
                  className="text-gray-500 hover:border-[#58e221] hover:text-[#58e221] inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium"
                >
                  Admin Dashboard
                </Link>
              )}

              {/* Nutritionist link */}
              {user && isNutritionist && (
                <Link
                  href="/nutritionist/dashboard"
                  className="text-gray-500 hover:border-[#58e221] hover:text-[#58e221] inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium"
                >
                  Nutritionist Dashboard
                </Link>
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center sm:hidden">
            <button
              type="button"
              className="bg-white inline-flex items-center justify-center p-2 rounded-md text-gray-500 hover:text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[#58e221]"
              aria-controls="mobile-menu"
              aria-expanded={mobileMenuOpen}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <span className="sr-only">Open main menu</span>
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="sm:hidden" id="mobile-menu">
          <div className="pt-2 pb-3 space-y-1">
            <Link href="/#features" className="text-gray-500 hover:bg-gray-50 hover:text-[#58e221] block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium" onClick={() => setMobileMenuOpen(false)}>Features</Link>
            <Link href="/#pricing" className="text-gray-500 hover:bg-gray-50 hover:text-[#58e221] block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium" onClick={() => setMobileMenuOpen(false)}>Pricing</Link>
            <Link href="/#testimonials" className="text-gray-500 hover:bg-gray-50 hover:text-[#58e221] block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium" onClick={() => setMobileMenuOpen(false)}>Testimonials</Link>
            <Link href="/#howitworks" className="text-gray-500 hover:bg-gray-50 hover:text-[#58e221] block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium" onClick={() => setMobileMenuOpen(false)}>How It Works</Link>
            <Link href="/#download" className="text-gray-500 hover:bg-gray-50 hover:text-[#58e221] block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium" onClick={() => setMobileMenuOpen(false)}>Download</Link>
            <Link href="/calculators" className="text-gray-500 hover:bg-gray-50 hover:text-[#58e221] block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium" onClick={() => setMobileMenuOpen(false)}>Calculators</Link>
            <Link href="/about-project" className="text-gray-500 hover:bg-gray-50 hover:text-[#58e221] block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium" onClick={() => setMobileMenuOpen(false)}>About Project</Link>

            {/* Admin link (mobile) */}
            {user && isAdmin && (
              <Link
                href="/admin/dashboard"
                className="text-gray-500 hover:bg-gray-50 hover:text-[#58e221] block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                Admin Dashboard
              </Link>
            )}

            {/* Nutritionist link (mobile) */}
            {user && isNutritionist && (
              <Link
                href="/nutritionist/dashboard"
                className="text-gray-500 hover:bg-gray-50 hover:text-[#58e221] block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                Nutritionist Dashboard
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
