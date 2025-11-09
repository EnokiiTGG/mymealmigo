"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requireAdmin?: boolean;
  requireNutritionist?: boolean;   // ✅ NEW
  requireStaff?: boolean;          // ✅ NEW (admin OR nutritionist)
  redirectTo?: string;
}

export function ProtectedRoute({
  children,
  requireAuth = false,
  requireAdmin = false,
  requireNutritionist = false,    // ✅ default off
  requireStaff = false,           // ✅ default off
  redirectTo = "/",
}: ProtectedRouteProps) {
  const { user, loading, isAdmin, isNutritionist } = useAuth() as any;
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    // Must be signed in?
    if (requireAuth && !user) {
      router.push(redirectTo);
      return;
    }

    // Admin only?
    if (requireAdmin && !isAdmin) {
      router.push(redirectTo);
      return;
    }

    // Nutritionist only?
    if (requireNutritionist && !isNutritionist) {
      router.push(redirectTo);
      return;
    }

    // Staff = admin OR nutritionist
    if (requireStaff && !(isAdmin || isNutritionist)) {
      router.push(redirectTo);
      return;
    }
  }, [user, loading, isAdmin, isNutritionist, router, requireAuth, requireAdmin, requireNutritionist, requireStaff, redirectTo]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  // Render guards
  if ((requireAuth && !user)
    || (requireAdmin && !isAdmin)
    || (requireNutritionist && !isNutritionist)
    || (requireStaff && !(isAdmin || isNutritionist))) {
    return null;
  }

  return <>{children}</>;
}
