"use client";
import type React from "react";
import Link from "next/link";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileEdit,
  Users,
  Settings,
  X,
  Menu,
  List, // used for Recipes
} from "lucide-react";
import type { Dispatch, SetStateAction } from "react";

interface SidebarProps {
  isSidebarOpen: boolean;
  setIsSidebarOpen: Dispatch<SetStateAction<boolean>>;
  isMobile: boolean;
}

export default function Sidebar({ isSidebarOpen, setIsSidebarOpen, isMobile }: SidebarProps) {
  const pathname = usePathname();

  // Close sidebar on route change (mobile)
  useEffect(() => {
    if (isMobile) setIsSidebarOpen(false);
  }, [pathname, isMobile, setIsSidebarOpen]);

  // Esc to close (mobile)
  useEffect(() => {
    if (!isMobile || !isSidebarOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsSidebarOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isMobile, isSidebarOpen, setIsSidebarOpen]);

  const navItems = [
    { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
    { name: "Content Editor", href: "/admin/cms", icon: FileEdit },
    { name: "Users", href: "/admin/users", icon: Users },
    { name: "Settings", href: "/admin/settings", icon: Settings },
  ];

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  const onNavClick = () => {
    if (isMobile) setIsSidebarOpen(false);
  };

  return (
    <>
      {/* Mobile toggle button */}
      {isMobile && (
        <div className="fixed left-4 top-4 z-40 md:hidden">
          <button
            onClick={() => setIsSidebarOpen((prev) => !prev)}
            className="rounded-md bg-white p-2 text-gray-600 shadow-md focus:outline-none focus:ring-2 focus:ring-[#58e221]"
            aria-label={isSidebarOpen ? "Close menu" : "Open menu"}
            aria-expanded={isSidebarOpen}
            aria-controls="admin-sidebar"
          >
            {isSidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      )}

      {/* Mobile overlay */}
      {isMobile && isSidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/40 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar panel */}
      <aside
        id="admin-sidebar"
        className={`fixed inset-y-0 left-0 z-30 w-56 transform bg-white shadow-lg transition-transform duration-300 ease-in-out md:w-64 ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
        role="navigation"
        aria-label="Admin sidebar"
      >
        <div className="flex h-full flex-col">
          <div className="flex h-14 items-center justify-center bg-[#58e221] text-white md:h-16">
            <span className="text-lg font-bold md:text-xl">MyMealMigo Admin</span>
          </div>

          <nav className="flex-1 space-y-1 px-2 py-3 md:py-4">
            {navItems.map((item) => {
              const active = isActive(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={onNavClick}
                  className={`flex items-center rounded-md px-3 py-2 text-sm font-medium ${
                    active
                      ? "bg-gray-100 text-[#58e221]"
                      : "text-gray-600 hover:bg-gray-50 hover:text-[#58e221]"
                  }`}
                  aria-current={active ? "page" : undefined}
                >
                  <Icon className="mr-2 h-5 w-5 md:mr-3" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>
    </>
  );
}
