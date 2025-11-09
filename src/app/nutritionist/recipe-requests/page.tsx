"use client";

import Link from "next/link";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { getClientAuth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { LayoutDashboard, BookOpen, LogOut, Apple, ClipboardList } from "lucide-react";

export default function NutritionistLayout({ children }: { children: React.ReactNode }) {
  const { user, isNutritionist, loading } = useAuth() as any;
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;
    if (!user || !isNutritionist) router.replace("/");
  }, [loading, user, isNutritionist, router]);

  if (loading || !user || !isNutritionist) return null;

  const nav = [
    { href: "/nutritionist/dashboard", label: "Dashboard", Icon: LayoutDashboard },
    { href: "/nutritionist/foods", label: "Foods", Icon: Apple },
    { href: "/nutritionist/recipes", label: "Recipes", Icon: BookOpen },
    { href: "/nutritionist/recipe-requests", label: "Recipe Requests", Icon: ClipboardList },
  ];

  const isActive = (href: string) => pathname?.startsWith(href);

  const handleLogout = async () => {
    try {
      await signOut(getClientAuth());
      router.push("/");
    } catch (e) {
      console.error("Logout failed:", e);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r">
        <div className="px-4 py-4 border-b">
          <h1 className="text-lg font-semibold">Nutritionist</h1>
        </div>
        <nav className="py-3">
          <ul className="space-y-1 px-2">
            {nav.map(({ href, label, Icon }) => (
              <li key={href}>
                <Link
                  href={href}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm ${
                    isActive(href)
                      ? "bg-[#eaffea] text-[#1a7d1f]"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col">
        {/* Top bar with Logout */}
        <header className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 flex items-center justify-between">
            <h2 className="text-lg md:text-xl font-semibold">Nutritionist Dashboard</h2>
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