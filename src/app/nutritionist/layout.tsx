"use client";

import Link from "next/link";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { getClientAuth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import {
  LayoutDashboard,
  MessageSquare,
  BookOpen,
  LogOut,
} from "lucide-react";

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
    { href: "/nutritionist/chats",      label: "Chats",     Icon: MessageSquare },
    { href: "/nutritionist/recipes",    label: "Recipes",   Icon: BookOpen },
  ];

  const isActive = (href: string) => pathname?.startsWith(href);

  const doLogout = async () => {
    try {
      await signOut(getClientAuth());
      router.push("/");
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar — styled like admin */}
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

        <div className="px-2 pt-2 pb-4 border-t">
          <button
            onClick={doLogout}
            className="w-full flex items-center justify-center gap-2 text-sm px-3 py-2 rounded-md text-gray-700 hover:bg-gray-100"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col">
        {/* Top bar — matches admin tone */}
        <header className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <h2 className="text-xl font-semibold">Nutritionist Dashboard</h2>
          </div>
        </header>

        <main className="max-w-7xl mx-auto w-full p-6">{children}</main>
      </div>
    </div>
  );
}
