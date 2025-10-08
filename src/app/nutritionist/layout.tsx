"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function NutritionistLayout({ children }: { children: React.ReactNode }) {
  const { user, isNutritionist, loading } = useAuth() as any;
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;
    if (!user || !isNutritionist) router.replace("/");
  }, [loading, user, isNutritionist, router]);

  if (loading || !user || !isNutritionist) return null;

  const links = [
    { href: "/nutritionist", label: "Dashboard" },
    { href: "/nutritionist/chats", label: "Chats" },
    { href: "/nutritionist/recipes", label: "Recipes" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-10 bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-lg font-semibold">Nutritionist Panel</h1>
          <nav className="text-sm text-gray-600 flex gap-4">
            {links.map((l) => {
              const active = pathname === l.href;
              return (
                <a
                  key={l.href}
                  href={l.href}
                  className={active ? "text-[#58e221] font-medium" : "hover:text-[#58e221]"}
                >
                  {l.label}
                </a>
              );
            })}
          </nav>
        </div>
      </header>
      <main className="max-w-7xl mx-auto p-4">{children}</main>
    </div>
  );
}
