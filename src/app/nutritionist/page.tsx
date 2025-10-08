"use client";

import { useEffect, useState } from "react";
import { collection, query, where, getCountFromServer } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function NutritionistDashboard() {
  const [openChats, setOpenChats] = useState(0);
  const [pendingRecipes, setPendingRecipes] = useState(0);

  useEffect(() => {
    (async () => {
      const chatsRef = collection(db, "chats");
      const chatsQ = query(chatsRef, where("status", "==", "open"));
      const chatsCount = await getCountFromServer(chatsQ);
      setOpenChats(chatsCount.data().count);

      const recipesRef = collection(db, "recipes");
      const recipesQ = query(recipesRef, where("status", "==", "pending"));
      const recipesCount = await getCountFromServer(recipesQ);
      setPendingRecipes(recipesCount.data().count);
    })();
  }, []);

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="rounded-xl border p-4 bg-white">
        <div className="text-sm text-gray-600">Open Chats</div>
        <div className="text-3xl font-semibold">{openChats}</div>
        <a href="/nutritionist/chats" className="text-[#58e221] text-sm mt-2 inline-block">Go to Chats</a>
      </div>
      <div className="rounded-xl border p-4 bg-white">
        <div className="text-sm text-gray-600">Recipes Pending Validation</div>
        <div className="text-3xl font-semibold">{pendingRecipes}</div>
        <a href="/nutritionist/recipes" className="text-[#58e221] text-sm mt-2 inline-block">Go to Recipes</a>
      </div>
    </div>
  );
}
