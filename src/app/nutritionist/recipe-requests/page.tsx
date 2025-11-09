"use client";

import { useEffect, useMemo, useState } from "react";
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  type DocumentData,
  type WithFieldValue,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Search, Check, X, ChevronDown, ChevronUp } from "lucide-react";

/* ======================== Types ======================== */
type Ingredient = { name: string; amount?: string };

type RecipeRequest = {
  id: string;
  title?: string;
  description?: string;
  tags?: string[];
  ingredients?: Ingredient[];
  steps?: string[];
  notes?: string;
  userUid?: string;
  userEmail?: string;
  status?: "open" | "resolved";
  createdAtISO?: string;
  updatedAtISO?: string;
};

type RecipeDoc = {
  title: string;
  description?: string;
  tags?: string[];
  ingredients?: Ingredient[];
  steps?: string[];
  imageURL?: string;
  imageStoragePath?: string;
  isPublic?: boolean;
  createdAt?: any;
  updatedAt?: any;
};

/* ======================== Page ======================== */
export default function RecipeRequestsPage() {
  const [requests, setRequests] = useState<RecipeRequest[]>([]);
  const [q, setQ] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<"all" | "open" | "resolved">("open");

  /* ======================== Helpers ======================== */
  const mapRequest = (id: string, data: DocumentData): RecipeRequest => {
    const createdAtISO =
      (data.createdAt?.toDate?.() as Date | undefined)?.toISOString?.() ??
      (typeof data.createdAt === "string" ? data.createdAt : undefined);
    const updatedAtISO =
      (data.updatedAt?.toDate?.() as Date | undefined)?.toISOString?.() ??
      (typeof data.updatedAt === "string" ? data.updatedAt : undefined);

    return {
      id,
      title: data.title || "",
      description: data.description || "",
      tags: Array.isArray(data.tags) ? data.tags.filter(Boolean) : [],
      ingredients: Array.isArray(data.ingredients) ? data.ingredients : [],
      steps: Array.isArray(data.steps) ? data.steps : [],
      notes: data.notes || "",
      userUid: data.userUid || "",
      userEmail: data.userEmail || "",
      status: (data.status as "open" | "resolved") || "open",
      createdAtISO,
      updatedAtISO,
    };
  };

  /* ======================== Live listeners ======================== */
  useEffect(() => {
    const col = collection(db, "recipeRequests");
    const unsub = onSnapshot(
      query(col, orderBy("createdAt", "desc")),
      (qs) => {
        const rows = qs.docs.map((d) => mapRequest(d.id, d.data()));
        setRequests(rows);
      },
      (err) => {
        console.error("recipeRequests onSnapshot error:", err);
        setRequests([]);
      }
    );
    return () => unsub();
  }, []);

  /* ======================== Derived ======================== */
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    let list = requests;

    // Apply status filter
    if (statusFilter !== "all") {
      list = list.filter((r) => r.status === statusFilter);
    }

    // Apply search
    if (s) {
      list = list.filter((r) => {
        const hay = `${r.title ?? ""} ${r.description ?? ""} ${r.tags?.join(" ") ?? ""} ${r.userEmail ?? ""}`.toLowerCase();
        return hay.includes(s);
      });
    }

    return list;
  }, [q, requests, statusFilter]);

  /* ======================== Actions ======================== */
  const convertRequestToRecipe = async (r: RecipeRequest) => {
    try {
      const payload: WithFieldValue<RecipeDoc> = {
        title: (r.title || "").trim(),
        description: (r.description || r.notes || "").trim(),
        tags: (r.tags || []).map((t) => `${t}`.trim()).filter(Boolean),
        ingredients: (r.ingredients || [])
          .map((i) => ({ name: (i.name || "").trim(), amount: (i.amount || "").trim() }))
          .filter((i) => i.name),
        steps: (r.steps || []).map((s) => `${s}`.trim()).filter(Boolean),
        imageURL: "",
        imageStoragePath: "",
        isPublic: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      const newRef = await addDoc(collection(db, "recipes"), payload);
      await updateDoc(doc(db, "recipeRequests", r.id), {
        status: "resolved",
        updatedAt: serverTimestamp(),
        convertedRecipeId: newRef.id,
      });
      setMsg("Request converted to recipe and marked resolved.");
      setTimeout(() => setMsg(null), 2000);
    } catch (e: any) {
      console.error("convert request:", e);
      setMsg(`Error converting: ${e?.code ?? e?.message ?? "Unknown error"}`);
    }
  };

  const markRequestResolved = async (id: string) => {
    try {
      await updateDoc(doc(db, "recipeRequests", id), {
        status: "resolved",
        updatedAt: serverTimestamp(),
      });
      setMsg("Request marked as resolved.");
      setTimeout(() => setMsg(null), 1500);
    } catch (e: any) {
      console.error("resolve request:", e);
      setMsg(`Error: ${e?.code ?? e?.message ?? "Failed to resolve"}`);
    }
  };

  const deleteRequest = async (id: string) => {
    if (!confirm("Delete this request?")) return;
    try {
      await deleteDoc(doc(db, "recipeRequests", id));
      setMsg("Request deleted.");
      setTimeout(() => setMsg(null), 1500);
    } catch (e) {
      console.error("delete request:", e);
      alert("Failed to delete request.");
    }
  };

  const toggleExpanded = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  /* ======================== UI ======================== */
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold">Recipe Requests from Users</h1>

        <div className="flex gap-2">
          <select
            className="rounded-md border px-3 py-2 text-sm"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as "all" | "open" | "resolved")}
          >
            <option value="all">All Requests</option>
            <option value="open">Open</option>
            <option value="resolved">Resolved</option>
          </select>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input
              className="rounded-md border px-3 py-2 pl-9 text-sm"
              placeholder="Search requests"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
        </div>
      </div>

      {msg && <div className="rounded-md border bg-white px-3 py-2 text-sm">{msg}</div>}

      <div className="rounded-xl border bg-white">
        <div className="border-b px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium">
              {filtered.length} {filtered.length === 1 ? "Request" : "Requests"}
            </div>
            <div className="text-xs text-gray-500">
              {requests.filter((r) => r.status === "open").length} open •{" "}
              {requests.filter((r) => r.status === "resolved").length} resolved
            </div>
          </div>
        </div>

        <ul className="divide-y max-h-[calc(100vh-250px)] overflow-y-auto">
          {filtered.length === 0 ? (
            <li className="px-4 py-6 text-center text-sm text-gray-500">
              {statusFilter === "open"
                ? "No open requests"
                : statusFilter === "resolved"
                ? "No resolved requests"
                : "No requests found"}
            </li>
          ) : (
            filtered.map((r) => (
              <li key={r.id} className="px-4 py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="font-medium text-base">{r.title || "(Untitled request)"}</div>
                      <span
                        className={`text-xs px-2 py-[2px] rounded ${
                          r.status === "open"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-emerald-100 text-emerald-700"
                        }`}
                      >
                        {r.status}
                      </span>
                    </div>

                    {r.userEmail && (
                      <div className="text-xs text-gray-500 mb-2">Requested by: {r.userEmail}</div>
                    )}

                    {r.createdAtISO && (
                      <div className="text-xs text-gray-400 mb-2">
                        {new Date(r.createdAtISO).toLocaleString()}
                      </div>
                    )}

                    {(r.description || r.notes) && (
                      <div className="text-sm text-gray-700 mb-2 line-clamp-2">
                        {r.description || r.notes}
                      </div>
                    )}

                    {r.tags && r.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {r.tags.slice(0, 6).map((t) => (
                          <span
                            key={t}
                            className="rounded bg-gray-100 px-2 py-[2px] text-[11px] text-gray-700"
                          >
                            #{t}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Expandable details */}
                    {(r.ingredients?.length || r.steps?.length) && (
                      <button
                        onClick={() => toggleExpanded(r.id)}
                        className="inline-flex items-center gap-1 text-xs text-[#58e221] hover:underline mt-2"
                      >
                        {expandedId === r.id ? (
                          <>
                            <ChevronUp className="h-3 w-3" /> Hide details
                          </>
                        ) : (
                          <>
                            <ChevronDown className="h-3 w-3" /> Show details
                          </>
                        )}
                      </button>
                    )}

                    {expandedId === r.id && (
                      <div className="mt-3 space-y-3 bg-gray-50 rounded-md p-3">
                        {r.ingredients && r.ingredients.length > 0 && (
                          <div>
                            <div className="text-xs font-medium text-gray-700 mb-1">Ingredients:</div>
                            <ul className="text-xs text-gray-600 space-y-1">
                              {r.ingredients.map((ing, i) => (
                                <li key={i}>
                                  • {ing.name} {ing.amount && `(${ing.amount})`}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {r.steps && r.steps.length > 0 && (
                          <div>
                            <div className="text-xs font-medium text-gray-700 mb-1">Steps:</div>
                            <ol className="text-xs text-gray-600 space-y-1 list-decimal list-inside">
                              {r.steps.map((step, i) => (
                                <li key={i}>{step}</li>
                              ))}
                            </ol>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex shrink-0 gap-2">
                    <button
                      onClick={() => convertRequestToRecipe(r)}
                      title="Convert to recipe and mark resolved"
                      className="inline-flex items-center gap-1 rounded-md bg-[#58e221] px-3 py-2 text-xs text-white hover:opacity-90"
                    >
                      <Check className="h-3.5 w-3.5" /> Convert
                    </button>
                    {r.status === "open" && (
                      <button
                        onClick={() => markRequestResolved(r.id)}
                        title="Mark as resolved"
                        className="inline-flex items-center gap-1 rounded-md border px-3 py-2 text-xs hover:bg-gray-50"
                      >
                        <Check className="h-3.5 w-3.5" /> Resolve
                      </button>
                    )}
                    <button
                      onClick={() => deleteRequest(r.id)}
                      title="Delete request"
                      className="inline-flex items-center gap-1 rounded-md border px-3 py-2 text-xs text-red-600 hover:bg-red-50"
                    >
                      <X className="h-3.5 w-3.5" /> Delete
                    </button>
                  </div>
                </div>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}