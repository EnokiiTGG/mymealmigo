"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, ChevronLeft, ChevronRight, Eye, Check, X } from "lucide-react";
import {
  collection,
  getDocsFromServer,
  doc,
  updateDoc,
  Timestamp,
  type DocumentData,
  type QueryDocumentSnapshot,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { ProtectedRoute } from "@/context/ProtectedRoute";

type Role = "free" | "premium" | "admin" | "nutritionist";
type AccountStatus = "Active" | "Suspended";
type RoleFilter = "all" | Role;

type RowUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  accountStatus: AccountStatus;
  joinedISO: string;
  subscription?: {
    plan?: "free" | "premium";
    active?: boolean;
    billing?: "monthly" | "yearly" | null;
  };
  photoURL?: string | null;
};

const isTimestamp = (v: unknown): v is Timestamp =>
  typeof v === "object" && v !== null && v instanceof Timestamp;

const hasCode = (e: unknown): e is { code: string } =>
  typeof e === "object" &&
  e !== null &&
  "code" in e &&
  typeof (e as Record<string, unknown>).code === "string";

const hasMessage = (e: unknown): e is { message: string } =>
  typeof e === "object" &&
  e !== null &&
  "message" in e &&
  typeof (e as Record<string, unknown>).message === "string";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<RowUser[]>([]);
  const [filtered, setFiltered] = useState<RowUser[]>([]);
  const [q, setQ] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [viewUser, setViewUser] = useState<RowUser | null>(null);
  const [page, setPage] = useState(1);
  const perPage = 10;

  const loadUsers = async () => {
    setLoading(true);
    setErr(null);
    try {
      const snap = await getDocsFromServer(collection(db, "users"));
      const rows: RowUser[] = snap.docs.map((d: QueryDocumentSnapshot<DocumentData>) => {
        const data = d.data();

        // joined date
        let joinedISO = new Date().toISOString();
        const createdAt = data?.createdAt;
        if (isTimestamp(createdAt)) {
          joinedISO = createdAt.toDate().toISOString();
        } else if (typeof createdAt === "string") {
          joinedISO = new Date(createdAt).toISOString();
        } else if (data?.joined) {
          joinedISO = new Date(data.joined as string).toISOString();
        }

        // role
        const rawRole = typeof data?.role === "string" ? (data.role.toLowerCase() as Role | "user") : "free";
        const subPlan: "free" | "premium" =
          data?.subscription?.plan === "premium" || rawRole === "premium" ? "premium" : "free";
        const role: Role = rawRole === "admin" ? "admin" : rawRole === "nutritionist" ? "nutritionist" : subPlan === "premium" ? "premium" : "free";
        

        // account status
        const status: AccountStatus = data?.accountStatus === "Suspended" ? "Suspended" : "Active";

        // subscription
        const subscription = {
          plan: subPlan,
          active:
            typeof data?.subscription?.active === "boolean"
              ? (data.subscription.active as boolean)
              : subPlan === "premium",
          billing:
            data?.subscription?.billing === "monthly" || data?.subscription?.billing === "yearly"
              ? (data.subscription.billing as "monthly" | "yearly")
              : null,
        };

        return {
          id: d.id,
          name: (data?.name || data?.displayName || "Member") as string,
          email: (data?.email || "—") as string,
          role,
          accountStatus: status,
          joinedISO,
          subscription,
          photoURL: (data?.photoURL ?? null) as string | null,
        };
      });

      setUsers(rows);
    } catch (e: unknown) {
      console.error("Users load error:", e);
      setErr(
        hasCode(e) && e.code === "permission-denied"
          ? "Permission denied loading users. Check Firestore rules for admin reads."
          : hasMessage(e)
          ? e.message
          : "Failed to load users."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadUsers();
  }, []);

  useEffect(() => {
    let base = users;
    if (q.trim()) {
      const s = q.trim().toLowerCase();
      base = base.filter((u) => u.name.toLowerCase().includes(s) || u.email.toLowerCase().includes(s));
    }
    if (roleFilter !== "all") base = base.filter((u) => u.role === roleFilter);
    setFiltered(base);
    setPage(1);
  }, [q, roleFilter, users]);

  const pageCount = useMemo(() => Math.max(1, Math.ceil(filtered.length / perPage)), [filtered.length, perPage]);
  const start = (page - 1) * perPage;
  const visible = filtered.slice(start, start + perPage);

  const toggleSuspend = async (u: RowUser) => {
    try {
      const newStatus: AccountStatus = u.accountStatus === "Active" ? "Suspended" : "Active";
      await updateDoc(doc(db, "users", u.id), { accountStatus: newStatus });
      setUsers((prev) => prev.map((x) => (x.id === u.id ? { ...x, accountStatus: newStatus } : x)));
    } catch (e: unknown) {
      console.error("Suspend toggle failed:", e);
      setErr(hasMessage(e) ? e.message : "Failed to update status.");
    }
  };

  const canPrev = page > 1;
  const canNext = page < pageCount;

  return (
    <ProtectedRoute requireAdmin>
      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-semibold">Users</h1>

          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input
                className="rounded-md border px-3 py-2 pl-9 text-sm"
                placeholder="Search name or email"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
            <select
              className="rounded-md border px-3 py-2 text-sm"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as RoleFilter)}
            >
              <option value="all">All roles</option>
              <option value="free">Free</option>
              <option value="premium">Premium</option>
              <option value="admin">Admin</option>
              <option value="nutritionist">Nutritionist</option>
            </select>
          </div>
        </div>

        {err && (
          <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {err}{" "}
            <button onClick={loadUsers} className="ml-2 underline">
              Retry
            </button>
          </div>
        )}

        <div className="overflow-x-auto rounded-xl border bg-white">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Joined</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td className="px-6 py-4 text-sm text-gray-500" colSpan={5}>
                    Loading…
                  </td>
                </tr>
              ) : visible.length === 0 ? (
                <tr>
                  <td className="px-6 py-4 text-sm text-gray-500" colSpan={5}>
                    No users found.
                  </td>
                </tr>
              ) : (
                visible.map((u) => (
                  <tr key={u.id}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-200 text-xs text-gray-600">
                          {u.name?.slice(0, 1).toUpperCase()}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{u.name}</div>
                          <div className="text-sm text-gray-500">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                          u.role === "premium"
                            ? "bg-purple-100 text-purple-800"
                            : u.role === "admin"
                            ? "bg-amber-100 text-amber-800"
                            : u.role === "nutritionist"
                            ? "bg-teal-100 text-teal-800"
                            : "bg-gray-100 text-gray-800"
                            
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                          u.accountStatus === "Active"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {u.accountStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(u.joinedISO).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="inline-flex gap-2">
                        <button
                          className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-sm hover:bg-gray-50"
                          onClick={() => setViewUser(u)}
                          title="View"
                        >
                          <Eye className="h-4 w-4" /> View
                        </button>
                        <button
                          className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-sm text-white ${
                            u.accountStatus === "Active"
                              ? "bg-amber-600 hover:bg-amber-700"
                              : "bg-green-600 hover:bg-green-700"
                          }`}
                          onClick={() => void toggleSuspend(u)}
                          title={u.accountStatus === "Active" ? "Suspend" : "Activate"}
                        >
                          {u.accountStatus === "Active" ? <X className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                          {u.accountStatus === "Active" ? "Suspend" : "Activate"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* Pagination */}
          <div className="flex items-center justify-between px-4 py-3">
            <div className="text-sm text-gray-600">
              Page {page} of {pageCount}
            </div>
            <div className="inline-flex items-center gap-2">
              <button
                className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-sm hover:bg-gray-50 disabled:opacity-50"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={!canPrev}
              >
                <ChevronLeft className="h-4 w-4" />
                Prev
              </button>
              <button
                className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-sm hover:bg-gray-50 disabled:opacity-50"
                onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                disabled={!canNext}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Simple "View user" modal */}
        {viewUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md rounded-xl bg-white p-6">
              <h2 className="mb-3 text-lg font-semibold">User Details</h2>
              <div className="space-y-1 text-sm">
                <div>
                  <span className="font-medium">Name:</span> {viewUser.name}
                </div>
                <div>
                  <span className="font-medium">Email:</span> {viewUser.email}
                </div>
                <div>
                  <span className="font-medium">Role:</span> {viewUser.role}
                </div>
                <div>
                  <span className="font-medium">Status:</span> {viewUser.accountStatus}
                </div>
                <div>
                  <span className="font-medium">Joined:</span>{" "}
                  {new Date(viewUser.joinedISO).toLocaleString()}
                </div>
                {viewUser.subscription && (
                  <div>
                    <span className="font-medium">Subscription:</span>{" "}
                    {viewUser.subscription.plan ?? "free"} •{" "}
                    {viewUser.subscription.active ? "active" : "inactive"}{" "}
                    {viewUser.subscription.billing ? `• ${viewUser.subscription.billing}` : ""}
                  </div>
                )}
              </div>

              <div className="mt-4 text-right">
                <button
                  onClick={() => setViewUser(null)}
                  className="rounded-md border px-3 py-2 text-sm hover:bg-gray-50"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
