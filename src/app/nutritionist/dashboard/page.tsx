"use client";

import { useEffect, useState } from "react";
import { collection, query, where, getCountFromServer } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function NutritionistDashboardPage() {
  const [foodsCount, setFoodsCount] = useState<number | null>(null);
  const [pendingRecipes, setPendingRecipes] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      try {
        // Count foods in dictionary
        const foodsSnap = await getCountFromServer(collection(db, "foods"));
        setFoodsCount(foodsSnap.data().count);

        // Count pending recipes
        const recipesQ = query(collection(db, "recipes"), where("status", "==", "pending"));
        const recipesCount = await getCountFromServer(recipesQ);
        setPendingRecipes(recipesCount.data().count);
      } catch (e) {
        console.error(e);
        setFoodsCount(0);
        setPendingRecipes(0);
      }
    })();
  }, []);

  return (
    <div className="space-y-6">
      {/* KPI cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border bg-white p-5">
          <div className="text-sm text-gray-600">Foods in Dictionary</div>
          <div className="text-3xl font-semibold mt-1">{foodsCount ?? "—"}</div>
          <a
            href="/nutritionist/foods"
            className="text-[#58e221] text-sm mt-3 inline-block"
          >
            Go to Foods
          </a>
        </div>

        <div className="rounded-xl border bg-white p-5">
          <div className="text-sm text-gray-600">Recipes Pending Validation</div>
          <div className="text-3xl font-semibold mt-1">{pendingRecipes ?? "—"}</div>
          <a
            href="/nutritionist/recipes"
            className="text-[#58e221] text-sm mt-3 inline-block"
          >
            Go to Recipes
          </a>
        </div>
      </div>

      {/* Quick actions */}
      <div className="rounded-xl border bg-white">
        <div className="p-4 border-b font-medium">Quick Actions</div>
        <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-3">
          <a
            href="/nutritionist/foods"
            className="text-center px-4 py-2 rounded-md bg-[#58e221] text-white hover:opacity-90"
          >
            Manage Foods
          </a>
          <a
            href="/nutritionist/recipes"
            className="text-center px-4 py-2 rounded-md border hover:bg-gray-50"
          >
            Validate Recipes
          </a>
          <a
            href="/nutritionist/recipes"
            className="text-center px-4 py-2 rounded-md border hover:bg-gray-50"
          >
            See Pending Recipes
          </a>
        </div>
      </div>
    </div>
  );
}
