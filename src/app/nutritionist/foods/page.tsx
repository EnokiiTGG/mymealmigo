
"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, doc, addDoc, updateDoc, deleteDoc, onSnapshot, orderBy, query, serverTimestamp, type DocumentData, type WithFieldValue } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { ProtectedRoute } from "@/context/ProtectedRoute";
import { Plus, Save, Trash2, RefreshCw, Search } from "lucide-react";

type FoodDoc = {
  name: string;
  brand?: string;
  category?: string;
  servingSize?: string;   // e.g. "100 g" or "1 cup (200 ml)"
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
  createdAt?: any;
  updatedAt?: any;
};

type FoodRow = FoodDoc & { id: string };

const blankFood: Omit<FoodRow, "id"> = {
  name: "",
  brand: "",
  category: "",
  servingSize: "100 g",
  calories: undefined,
  protein: undefined,
  carbs: undefined,
  fat: undefined,
  fiber: undefined,
  sugar: undefined,
  sodium: undefined,
};

export default function NutritionistFoodsPage() {
  const [foods, setFoods] = useState<FoodRow[]>([]);
  const [q, setQ] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<FoodRow, "id">>(blankFood);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    const col = collection(db, "foods");
    const unsub = onSnapshot(query(col, orderBy("updatedAt","desc")), (qs) => {
      const rows = qs.docs.map(d => ({ id: d.id, ...(d.data() as FoodDoc) }));
      setFoods(rows);
    }, (err) => {
      console.error("foods onSnapshot:", err);
      setFoods([]);
    });
    return () => unsub();
  }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return foods;
    return foods.filter(f => 
      (f.name||"").toLowerCase().includes(s) ||
      (f.brand||"").toLowerCase().includes(s) ||
      (f.category||"").toLowerCase().includes(s)
    );
  }, [q, foods]);

  const startNew = () => {
    setSelectedId(null);
    setForm(blankFood);
  };

  const startEdit = (f: FoodRow) => {
    setSelectedId(f.id);
    const { id, ...rest } = f;
    setForm(rest);
  };

  const numberOrUndefined = (v: any) => {
    const n = Number(v);
    return isFinite(n) ? n : undefined;
  };

  const save = async () => {
    setSaving(true);
    setMsg(null);
    try {
      const payload: WithFieldValue<FoodDoc> = {
        name: (form.name||"").trim(),
        brand: (form.brand||"").trim(),
        category: (form.category||"").trim(),
        servingSize: (form.servingSize||"").trim() || "100 g",
        calories: numberOrUndefined(form.calories),
        protein: numberOrUndefined(form.protein),
        carbs: numberOrUndefined(form.carbs),
        fat: numberOrUndefined(form.fat),
        fiber: numberOrUndefined(form.fiber),
        sugar: numberOrUndefined(form.sugar),
        sodium: numberOrUndefined(form.sodium),
        updatedAt: serverTimestamp(),
      };
      if (!selectedId) {
        await addDoc(collection(db,"foods"), { ...payload, createdAt: serverTimestamp() });
        setMsg("Food added.");
      } else {
        await updateDoc(doc(db,"foods",selectedId), payload);
        setMsg("Food saved.");
      }
      setTimeout(()=>setMsg(null), 1500);
    } catch (e:any) {
      console.error("save food:", e);
      setMsg(e?.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!selectedId) return;
    if (!confirm("Delete this food item?")) return;
    try {
      await deleteDoc(doc(db,"foods",selectedId));
      setSelectedId(null);
      setForm(blankFood);
    } catch (e) {
      console.error("delete food:", e);
      alert("Failed to delete food.");
    }
  };

  return (
    <ProtectedRoute>
      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-semibold">Foods Dictionary</h1>
          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input
                className="rounded-md border px-3 py-2 pl-9 text-sm"
                placeholder="Search by name, brand, or category"
                value={q}
                onChange={(e)=>setQ(e.target.value)}
              />
            </div>
            <button onClick={startNew} className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-gray-50">
              <Plus className="h-4 w-4" /> New
            </button>
          </div>
        </div>

        {msg && <div className="rounded-md border bg-white px-3 py-2 text-sm">{msg}</div>}

        <div className="grid gap-6 lg:grid-cols-3">
          {/* List */}
          <div className="rounded-xl border bg-white">
            <div className="border-b px-4 py-3 text-sm font-medium">All foods</div>
            <ul className="max-h-[70vh] overflow-y-auto divide-y">
              {filtered.length === 0 ? (
                <li className="px-4 py-3 text-sm text-gray-500">No foods yet.</li>
              ) : (
                filtered.map((f)=>(
                  <li key={f.id} className={`cursor-pointer px-4 py-3 text-sm hover:bg-gray-50 ${selectedId===f.id?"bg-emerald-50":""}`} onClick={()=>startEdit(f)}>
                    <div className="font-medium">{f.name || "(Unnamed food)"}</div>
                    <div className="mt-1 text-xs text-gray-500">{[f.brand, f.category].filter(Boolean).join(" • ")}</div>
                    {f.updatedAt && <div className="mt-1 text-[11px] text-gray-400">Updated</div>}
                  </li>
                ))
              )}
            </ul>
          </div>

          {/* Editor */}
          <div className="lg:col-span-2 rounded-xl border bg-white p-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                {selectedId ? `Editing: ${selectedId}` : "New food"}
              </div>
              <div className="flex gap-2">
                {selectedId && (
                  <button onClick={remove} className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm text-red-600 hover:bg-red-50">
                    <Trash2 className="h-4 w-4" /> Delete
                  </button>
                )}
                <button onClick={save} disabled={saving || !form.name.trim()} className="inline-flex items-center gap-2 rounded-md bg-[#58e221] px-3 py-2 text-sm text-white hover:opacity-90 disabled:opacity-60">
                  {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  {saving ? "Saving…" : "Save"}
                </button>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <label className="block">
                <span className="mb-1 block text-sm text-gray-700">Name</span>
                <input className="w-full rounded-md border px-3 py-2" value={form.name} onChange={e=>setForm(f=>({...f, name: e.target.value}))} placeholder="e.g., Oats, Brown Rice"/>
              </label>
              <label className="block">
                <span className="mb-1 block text-sm text-gray-700">Brand</span>
                <input className="w-full rounded-md border px-3 py-2" value={form.brand||""} onChange={e=>setForm(f=>({...f, brand: e.target.value}))} placeholder="Optional brand"/>
              </label>
              <label className="block">
                <span className="mb-1 block text-sm text-gray-700">Category</span>
                <input className="w-full rounded-md border px-3 py-2" value={form.category||""} onChange={e=>setForm(f=>({...f, category: e.target.value}))} placeholder="e.g., Grains, Dairy, Fruit"/>
              </label>
              <label className="block">
                <span className="mb-1 block text-sm text-gray-700">Serving Size</span>
                <input className="w-full rounded-md border px-3 py-2" value={form.servingSize||""} onChange={e=>setForm(f=>({...f, servingSize: e.target.value}))} placeholder='e.g., "100 g" or "1 cup (200 ml)"'/>
              </label>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-3">
              {[
                ["Calories (kcal)","calories"],
                ["Protein (g)","protein"],
                ["Carbs (g)","carbs"],
                ["Fat (g)","fat"],
                ["Fiber (g)","fiber"],
                ["Sugar (g)","sugar"],
                ["Sodium (mg)","sodium"],
              ].map(([label,key])=>(
                <label key={key} className="block">
                  <span className="mb-1 block text-sm text-gray-700">{label}</span>
                  <input type="number" step="any" className="w-full rounded-md border px-3 py-2" value={(form as any)[key] ?? ""} onChange={e=>setForm(f=>({...f, [key]: e.target.value}))}/>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
