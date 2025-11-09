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
  Timestamp,
  type DocumentData,
  type WithFieldValue,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import { ProtectedRoute } from "@/context/ProtectedRoute";
import { Plus, Save, Trash2, Upload, RefreshCw, Search, Image as ImageIcon } from "lucide-react";
import Image from "next/image";
import type { FieldValue } from "firebase/firestore";

/* ======================== Types ======================== */
type Ingredient = { name: string; amount?: string };

type RecipeDoc = {
  title: string;
  description?: string;
  tags?: string[];
  ingredients?: { name: string; amount?: string }[];
  steps?: string[];
  imageURL?: string;
  imageStoragePath?: string;
  isPublic?: boolean;
  createdAt?: Timestamp | FieldValue;
  updatedAt?: Timestamp | FieldValue;
};

type RecipeRow = {
  id: string;
  title: string;
  description: string;
  tags: string[];
  ingredients: Ingredient[];
  steps: string[];
  imageURL?: string;
  imageStoragePath?: string;
  isPublic: boolean;
  createdAtISO?: string;
  updatedAtISO?: string;
};

/* ======================== State defaults ======================== */
const blankRecipe: Omit<RecipeRow, "id"> = {
  title: "",
  description: "",
  tags: [],
  ingredients: [{ name: "", amount: "" }],
  steps: [""],
  imageURL: "",
  imageStoragePath: "",
  isPublic: true,
};

/* ======================== Page ======================== */
export default function RecipesPage() {
  const [recipes, setRecipes] = useState<RecipeRow[]>([]);
  const [q, setQ] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<RecipeRow, "id">>(blankRecipe);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  /* ======================== Helpers ======================== */
  const mapDoc = (id: string, data: DocumentData): RecipeRow => {
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
      imageURL: data.imageURL || "",
      imageStoragePath: data.imageStoragePath || "",
      isPublic: data.isPublic !== false,
      createdAtISO,
      updatedAtISO,
    };
  };

  /* ======================== Live listeners ======================== */
  useEffect(() => {
    const col = collection(db, "recipes");
    const unsub = onSnapshot(
      query(col, orderBy("updatedAt", "desc")),
      (qs) => {
        const rows = qs.docs.map((d) => mapDoc(d.id, d.data()));
        setRecipes(rows);
      },
      (err) => {
        console.error("recipes onSnapshot error:", err);
        setRecipes([]);
      }
    );
    return () => unsub();
  }, []);

  /* ======================== Derived ======================== */
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return recipes;
    return recipes.filter(
      (r) => r.title.toLowerCase().includes(s) || r.tags.join(" ").toLowerCase().includes(s)
    );
  }, [q, recipes]);

  /* ======================== CRUD: Recipes ======================== */
  const startNew = () => {
    setSelectedId(null);
    setForm(blankRecipe);
  };

  const startEdit = (r: RecipeRow) => {
    setSelectedId(r.id);
    setForm({
      title: r.title,
      description: r.description,
      tags: r.tags,
      ingredients: r.ingredients.length ? r.ingredients : [{ name: "", amount: "" }],
      steps: r.steps.length ? r.steps : [""],
      imageURL: r.imageURL || "",
      imageStoragePath: r.imageStoragePath || "",
      isPublic: r.isPublic,
      createdAtISO: r.createdAtISO,
      updatedAtISO: r.updatedAtISO,
    });
  };

  const save = async () => {
    setSaving(true);
    setMsg(null);
    try {
      if (!selectedId) {
        // CREATE
        const payload: WithFieldValue<RecipeDoc> = {
          title: form.title.trim(),
          description: form.description?.trim() || "",
          tags: (form.tags || []).map((t) => t.trim()).filter(Boolean),
          ingredients: (form.ingredients || [])
            .map((i) => ({ name: i.name?.trim() || "", amount: i.amount?.trim() || "" }))
            .filter((i) => i.name),
          steps: (form.steps || []).map((s) => s.trim()).filter(Boolean),
          imageURL: form.imageURL || "",
          imageStoragePath: form.imageStoragePath || "",
          isPublic: !!form.isPublic,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };
        const refDoc = await addDoc(collection(db, "recipes"), payload);
        setSelectedId(refDoc.id);
        setMsg("Recipe created.");
      } else {
        // UPDATE
        const payload: WithFieldValue<RecipeDoc> = {
          title: form.title.trim(),
          description: form.description?.trim() || "",
          tags: (form.tags || []).map((t) => t.trim()).filter(Boolean),
          ingredients: (form.ingredients || [])
            .map((i) => ({ name: i.name?.trim() || "", amount: i.amount?.trim() || "" }))
            .filter((i) => i.name),
          steps: (form.steps || []).map((s) => s.trim()).filter(Boolean),
          imageURL: form.imageURL || "",
          imageStoragePath: form.imageStoragePath || "",
          isPublic: !!form.isPublic,
          updatedAt: serverTimestamp(),
        };
        await updateDoc(doc(db, "recipes", selectedId), payload);
        setMsg("Recipe saved.");
      }
      setTimeout(() => setMsg(null), 2000);
    } catch (e: any) {
      console.error("save recipe:", e);
      setMsg(`Error saving recipe: ${e?.code ?? e?.message ?? "Unknown error"}`);
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!selectedId) return;
    if (!confirm("Delete this recipe?")) return;
    try {
      if (form.imageStoragePath) {
        try {
          await deleteObject(ref(storage, form.imageStoragePath));
        } catch (e) {
          console.warn("image delete failed:", e);
        }
      }
      await deleteDoc(doc(db, "recipes", selectedId));
      setSelectedId(null);
      setForm(blankRecipe);
    } catch (e) {
      console.error("delete recipe error:", e);
      alert("Failed to delete recipe.");
    }
  };

  const uploadRecipeImage = async (file: File) => {
    if (!file) return;
    if (!selectedId) {
      setMsg("Save the recipe first, then upload an image.");
      return;
    }

    const allowed = ["image/png", "image/jpeg"] as const;
    const maxSize = 5 * 1024 * 1024;

    let contentType = file.type;
    if (!contentType) {
      const name = file.name.toLowerCase();
      if (name.endsWith(".png")) contentType = "image/png";
      else if (name.endsWith(".jpg") || name.endsWith(".jpeg")) contentType = "image/jpeg";
    }
    if (!contentType || !allowed.includes(contentType as any)) {
      setMsg("Error: Only PNG or JPEG files are allowed.");
      return;
    }
    if (file.size > maxSize) {
      setMsg("Error: File must be smaller than 5MB.");
      return;
    }

    setUploading(true);
    try {
      const path = `websiteImages/recipes/${selectedId}_${Date.now()}`;
      const storageRef = ref(storage, path);
      await uploadBytes(storageRef, file, { contentType });
      const url = (await getDownloadURL(storageRef)).trimEnd();

      await updateDoc(doc(db, "recipes", selectedId), {
        imageURL: url,
        imageStoragePath: path,
        updatedAt: serverTimestamp(),
      });

      setForm((f) => ({ ...f, imageURL: url, imageStoragePath: path }));
      setMsg("Image uploaded!");
    } catch (e: any) {
      console.error("Image upload failed:", e);
      setMsg(`Error: ${e?.code ?? e?.message ?? "Image upload failed. Check Storage rules."}`);
    } finally {
      setUploading(false);
      setTimeout(() => setMsg(null), 2200);
    }
  };

  const removeRecipeImage = async () => {
    if (!selectedId || !form.imageStoragePath) return;
    try {
      if (!form.imageStoragePath.startsWith("websiteImages/")) {
        throw new Error("Invalid storage path");
      }
      await deleteObject(ref(storage, form.imageStoragePath));
      await updateDoc(doc(db, "recipes", selectedId), {
        imageURL: "",
        imageStoragePath: "",
        updatedAt: serverTimestamp(),
      });
      setForm((f) => ({ ...f, imageURL: "", imageStoragePath: "" }));
      setMsg("Image removed.");
    } catch (e: any) {
      console.error("Media removal failed:", e);
      setMsg(`Error: ${e?.code ?? e?.message ?? "Failed to remove image."}`);
    } finally {
      setTimeout(() => setMsg(null), 2200);
    }
  };

  /* ======================== UI ======================== */
  return (
    <ProtectedRoute requireNutritionist>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-semibold">Recipes</h1>

          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input
                className="rounded-md border px-3 py-2 pl-9 text-sm"
                placeholder="Search title or tags"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
            <button
              onClick={startNew}
              className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-gray-50"
              title="New recipe"
            >
              <Plus className="h-4 w-4" /> New
            </button>
          </div>
        </div>

        {msg && <div className="rounded-md border bg-white px-3 py-2 text-sm">{msg}</div>}

        <div className="grid gap-6 lg:grid-cols-3">
          {/* List */}
          <div className="rounded-xl border bg-white">
            <div className="border-b px-4 py-3 text-sm font-medium">All recipes ({recipes.length})</div>
            <ul className="max-h-[70vh] overflow-y-auto divide-y">
              {filtered.length === 0 ? (
                <li className="px-4 py-3 text-sm text-gray-500">No recipes yet.</li>
              ) : (
                filtered.map((r) => (
                  <li
                    key={r.id}
                    className={`cursor-pointer px-4 py-3 text-sm hover:bg-gray-50 ${
                      selectedId === r.id ? "bg-emerald-50" : ""
                    }`}
                    onClick={() => startEdit(r)}
                  >
                    <div className="font-medium">{r.title || "(Untitled)"}</div>
                    <div className="mt-1 text-xs text-gray-500 line-clamp-2">{r.description}</div>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {r.tags.slice(0, 5).map((t) => (
                        <span key={t} className="rounded bg-gray-100 px-2 py-[2px] text-[11px] text-gray-700">
                          #{t}
                        </span>
                      ))}
                    </div>
                    {r.updatedAtISO && (
                      <div className="mt-1 text-[11px] text-gray-400">
                        Updated {new Date(r.updatedAtISO).toLocaleString()}
                      </div>
                    )}
                  </li>
                ))
              )}
            </ul>
          </div>

          {/* Editor */}
          <div className="lg:col-span-2 rounded-xl border bg-white p-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                {selectedId ? `Editing: ${selectedId}` : "New recipe"}
              </div>
              <div className="flex gap-2">
                {selectedId && (
                  <button
                    onClick={remove}
                    className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" /> Delete
                  </button>
                )}
                <button
                  onClick={save}
                  disabled={saving || !form.title.trim()}
                  className="inline-flex items-center gap-2 rounded-md bg-[#58e221] px-3 py-2 text-sm text-white hover:opacity-90 disabled:opacity-60"
                >
                  {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  {saving ? "Saving…" : "Save"}
                </button>
              </div>
            </div>

            {/* Title & desc */}
            <div className="grid gap-3 md:grid-cols-2">
              <label className="block">
                <span className="mb-1 block text-sm text-gray-700">Title</span>
                <input
                  className="w-full rounded-md border px-3 py-2"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="e.g., Grilled Chicken Salad"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-sm text-gray-700">Visibility</span>
                <select
                  className="w-full rounded-md border px-3 py-2"
                  value={form.isPublic ? "public" : "private"}
                  onChange={(e) => setForm((f) => ({ ...f, isPublic: e.target.value === "public" }))}
                >
                  <option value="public">Public</option>
                  <option value="private">Private</option>
                </select>
              </label>
            </div>

            <label className="mt-3 block">
              <span className="mb-1 block text-sm text-gray-700">Short Description</span>
              <textarea
                className="w-full rounded-md border px-3 py-2"
                rows={3}
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="A quick summary or serving notes…"
              />
            </label>

            {/* Image */}
            <div className="mt-4 grid gap-3 md:grid-cols-[200px_1fr]">
              <div className="flex flex-col items-start gap-2">
                <div className="h-[120px] w-[200px] overflow-hidden rounded-md border bg-gray-50">
                  {form.imageURL ? (
                    <Image
                      src={form.imageURL}
                      alt={`${form.title || "Recipe"} image`}
                      width={200}
                      height={120}
                      className="h-full w-full object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-gray-400">
                      <ImageIcon className="h-6 w-6" />
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-gray-50">
                    <Upload className="h-4 w-4" />
                    {uploading ? "Uploading…" : "Upload"}
                    <input
                      type="file"
                      accept="image/png,image/jpeg"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) void uploadRecipeImage(file);
                        e.currentTarget.value = "";
                      }}
                      disabled={uploading}
                    />
                  </label>
                  {form.imageURL && (
                    <button
                      onClick={removeRecipeImage}
                      title="Delete image"
                      aria-label="Delete image"
                      className="rounded-md border p-2 hover:bg-red-50 text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
                {!selectedId && (
                  <p className="text-xs text-gray-500">Save the recipe first to enable image upload.</p>
                )}
              </div>

              {/* Tags */}
              <label className="block">
                <span className="mb-1 block text-sm text-gray-700">Tags (comma separated)</span>
                <input
                  className="w-full rounded-md border px-3 py-2"
                  value={form.tags.join(", ")}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      tags: e.target.value
                        .split(",")
                        .map((t) => t.trim())
                        .filter(Boolean),
                    }))
                  }
                  placeholder="e.g., healthy, low-carb, dinner"
                />
              </label>
            </div>

            {/* Ingredients */}
            <div className="mt-6">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-sm font-medium">Ingredients</h3>
                <button
                  onClick={() =>
                    setForm((f) => ({
                      ...f,
                      ingredients: [...(f.ingredients || []), { name: "", amount: "" }],
                    }))
                  }
                  className="text-sm text-[#58e221]"
                >
                  + Add ingredient
                </button>
              </div>
              {(form.ingredients || []).map((ing, i) => (
                <div key={i} className="mb-2 grid gap-2 md:grid-cols-[1fr_180px_40px]">
                  <input
                    className="rounded-md border px-3 py-2"
                    placeholder="Name (e.g., Chicken breast)"
                    value={ing.name}
                    onChange={(e) => {
                      const arr = [...(form.ingredients || [])];
                      arr[i] = { ...arr[i], name: e.target.value };
                      setForm((f) => ({ ...f, ingredients: arr }));
                    }}
                  />
                  <input
                    className="rounded-md border px-3 py-2"
                    placeholder="Amount (e.g., 200 g)"
                    value={ing.amount || ""}
                    onChange={(e) => {
                      const arr = [...(form.ingredients || [])];
                      arr[i] = { ...arr[i], amount: e.target.value };
                      setForm((f) => ({ ...f, ingredients: arr }));
                    }}
                  />
                  <button
                    title="Delete ingredient"
                    aria-label="Delete ingredient"
                    className="rounded-md border p-2 hover:bg-red-50 text-red-600"
                    onClick={() => {
                      const arr = [...(form.ingredients || [])];
                      arr.splice(i, 1);
                      setForm((f) => ({ ...f, ingredients: arr.length ? arr : [{ name: "", amount: "" }] }));
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>

            {/* Steps */}
            <div className="mt-6">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-sm font-medium">Steps</h3>
                <button
                  onClick={() => setForm((f) => ({ ...f, steps: [...(f.steps || []), ""] }))}
                  className="text-sm text-[#58e221]"
                >
                  + Add step
                </button>
              </div>
              {(form.steps || []).map((st, i) => (
                <div key={i} className="mb-2 grid gap-2 md:grid-cols-[1fr_40px]">
                  <textarea
                    className="min-h-[70px] rounded-md border px-3 py-2"
                    placeholder={`Step ${i + 1}`}
                    value={st}
                    onChange={(e) => {
                      const arr = [...(form.steps || [])];
                      arr[i] = e.target.value;
                      setForm((f) => ({ ...f, steps: arr }));
                    }}
                  />
                  <button
                    title="Delete step"
                    aria-label="Delete step"
                    className="rounded-md border p-2 hover:bg-red-50 text-red-600"
                    onClick={() => {
                      const arr = [...(form.steps || [])];
                      arr.splice(i, 1);
                      setForm((f) => ({ ...f, steps: arr.length ? arr : [""] }));
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}