"use client";

import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot, doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";

type Recipe = {
  id: string;
  title: string;
  status: "draft" | "pending" | "approved" | "rejected";
  validationNotes?: string;
  validatedBy?: string;
  validatedAt?: any;
};

export default function RecipesReviewPage() {
  const { user } = useAuth();
  const [recipes, setRecipes] = useState<Recipe[]>([]);

  useEffect(() => {
    const q = query(collection(db, "recipes"), where("status", "==", "pending"));
    const unsub = onSnapshot(q, snap => {
      setRecipes(snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<Recipe,"id">) })));
    });
    return () => unsub();
  }, []);

  const approve = async (id: string) => {
    await updateDoc(doc(db, "recipes", id), {
      status: "approved",
      validatedBy: user?.uid || null,
      validatedAt: serverTimestamp(),
      validationNotes: "",
    });
  };

  const reject = async (id: string) => {
    const notes = prompt("Reason / notes for changes:");
    await updateDoc(doc(db, "recipes", id), {
      status: "rejected",
      validatedBy: user?.uid || null,
      validatedAt: serverTimestamp(),
      validationNotes: notes || "",
    });
  };

  return (
    <div className="rounded-xl border bg-white">
      <div className="p-4 border-b font-medium">Recipes Pending Validation</div>
      <div className="divide-y">
        {recipes.map(r => (
          <div key={r.id} className="p-4 flex items-center justify-between">
            <div>
              <div className="font-medium">{r.title || "(Untitled recipe)"}</div>
              <div className="text-xs text-gray-500">status: {r.status}</div>
            </div>
            <div className="space-x-2">
              <button onClick={() => approve(r.id)} className="px-3 py-1 text-sm bg-[#58e221] text-white rounded-md">Approve</button>
              <button onClick={() => reject(r.id)} className="px-3 py-1 text-sm border rounded-md hover:bg-gray-50">Request changes</button>
            </div>
          </div>
        ))}
        {recipes.length === 0 && <div className="p-6 text-sm text-gray-500">Nothing to review.</div>}
      </div>
    </div>
  );
}
