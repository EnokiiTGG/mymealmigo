"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  signInWithEmailAndPassword,
  User as FirebaseUser,
  sendPasswordResetEmail,
  signOut,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { getClientAuth, db } from "@/lib/firebase";
import { X } from "lucide-react";

const auth = getClientAuth();

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetMessage, setResetMessage] = useState("");
  const [resetError, setResetError] = useState("");
  const [isResetLoading, setIsResetLoading] = useState(false);
  const router = useRouter();

  const checkUserRoleAndRedirect = async (user: FirebaseUser) => {
    try {
      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);

      const role = userDoc.exists()
        ? String(userDoc.data()?.role || "").toLowerCase()
        : "";

      if (role === "admin") {
        router.push("/admin/dashboard");
      } else if (role === "nutritionist") {
        router.push("/nutritionist/dashboard");
      } else {
        await signOut(auth);
        setError("Only staff accounts (admin or nutritionist) can sign in.");
      }
    } catch (err) {
      console.error("Error checking user role:", err);
      setError("Failed to verify user role. Please try again.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Determine role once (used for email verification rule below)
      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);
      const role = userDoc.exists()
        ? String(userDoc.data()?.role || "").toLowerCase()
        : "";

      const isStaff = role === "admin" || role === "nutritionist";

      // Skip email verification for staff (admin/nutritionist). Non-staff would be blocked anyway.
      if (!isStaff && !user.emailVerified) {
        await auth.signOut();
        throw new Error("Please verify your email before logging in.");
      }

      await checkUserRoleAndRedirect(user);
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "An error occurred during login";
      setError(errorMessage);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsResetLoading(true);
    setResetMessage("");
    setResetError("");

    try {
      await sendPasswordResetEmail(auth, resetEmail);
      setResetMessage(
        "Password reset email sent! Please check your inbox (and spam/junk folder)."
      );
      setResetEmail("");
    } catch (err: unknown) {
      let errorMessage = "Failed to send password reset email.";
      if (err instanceof Error) {
        switch (err.message) {
          case "Firebase: Error (auth/user-not-found).":
            errorMessage = "No account found with this email.";
            break;
          case "Firebase: Error (auth/invalid-email).":
            errorMessage = "Invalid email address.";
            break;
          default:
            errorMessage = err.message;
        }
      }
      setResetError(errorMessage);
      console.error(err);
    } finally {
      setIsResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Staff Login
          </h2>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email-address" className="sr-only">
                Email address
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-[#58e221] focus:border-[#58e221] focus:z-10 sm:text-sm"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-[#58e221] focus:border-[#58e221] focus:z-10 sm:text-sm"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {error && <div className="text-red-500 text-sm text-center">{error}</div>}

          <div className="space-y-4">
            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-gradient-to-r from-[#58e221] to-[#3ae443] hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#58e221] disabled:opacity-70"
              >
                {isLoading ? "Signing in..." : "Sign in"}
              </button>
            </div>
            <div className="text-sm text-center">
              <button
                type="button"
                onClick={() => setIsResetModalOpen(true)}
                className="font-medium text-[#58e221] hover:text-[#58e221]/90"
              >
                Forgot your password?
              </button>
            </div>
          </div>
        </form>

        {/* Password Reset Modal */}
        {isResetModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-sm">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-bold text-gray-900">Reset Your Password</h3>
                <button
                  onClick={() => {
                    setIsResetModalOpen(false);
                    setResetMessage("");
                    setResetError("");
                    setResetEmail("");
                  }}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <form onSubmit={handlePasswordReset}>
                <div className="mb-4">
                  <label htmlFor="reset-email" className="block text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    id="reset-email"
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    placeholder="Enter your email"
                    required
                  />
                </div>
                {resetMessage && (
                  <div className="text-green-500 text-sm mb-4">{resetMessage}</div>
                )}
                {resetError && (
                  <div className="text-red-500 text-sm mb-4">{resetError}</div>
                )}
                <button
                  type="submit"
                  disabled={isResetLoading}
                  className={`w-full py-2 rounded-md text-white ${
                    isResetLoading
                      ? "bg-gray-400"
                      : "bg-gradient-to-r from-[#58e221] to-[#c4ffa4] hover:opacity-90"
                  }`}
                >
                  {isResetLoading ? "Sending..." : "Send Reset Email"}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
