"use client";

import { useEffect, useState } from "react";
import { collection, query, where, getCountFromServer } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function NutritionistDashboard() {
  const [foodsCount, setFoodsCount] = useState(0);
  const [pendingRecipes, setPendingRecipes] = useState(0);

  useEffect(() => {
    (async () => {
      try {
        // Count total foods in dictionary
        const foodsSnap = await getCountFromServer(collection(db, "foods"));
        setFoodsCount(foodsSnap.data().count);

        // Count recipes pending validation
        const recipesQ = query(collection(db, "recipes"), where("status", "==", "pending"));
        const recipesCount = await getCountFromServer(recipesQ);
        setPendingRecipes(recipesCount.data().count);
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        setFoodsCount(0);
        setPendingRecipes(0);
      }
    })();
  }, []);

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Foods Dictionary card */}
      <div className="rounded-xl border p-4 bg-white">
        <div className="text-sm text-gray-600">Foods in Dictionary</div>
        <div className="text-3xl font-semibold">{foodsCount}</div>
        <a
          href="/nutritionist/foods"
          className="text-[#58e221] text-sm mt-2 inline-block"
        >
          Go to Foods
        </a>
      </div>

      {/* Recipes pending validation card */}
      <div className="rounded-xl border p-4 bg-white">
        <div className="text-sm text-gray-600">Recipes Pending Validation</div>
        <div className="text-3xl font-semibold">{pendingRecipes}</div>
        <a
          href="/nutritionist/recipes"
          className="text-[#58e221] text-sm mt-2 inline-block"
        >
          Go to Recipes
        </a>
      </div>
    </div>
  );
}
