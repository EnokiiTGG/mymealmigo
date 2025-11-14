"use client";

import { useState, useEffect } from "react";
import { Users, DollarSign, Activity, ShoppingCart } from "lucide-react";
import Link from "next/link";
import { collection, getDocs, query, where, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface DashboardStats {
  users: number;
  revenue: number;
  activeUsers: number;
  subscription: number;
}

interface QuickMetrics {
  freeUsers: number;
  premiumUsers: number;
}

const SUBSCRIPTION_PRICE = 9.99; // USD

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    users: 0,
    revenue: 0,
    activeUsers: 0,
    subscription: 0,
  });
  const [quick, setQuick] = useState<QuickMetrics>({
    freeUsers: 0,
    premiumUsers: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      try {
        const now = new Date();
        const thirtyDaysAgo = new Date(now);
        thirtyDaysAgo.setDate(now.getDate() - 30);

        // Total users
        const allUsersSnap = await getDocs(collection(db, "users"));
        const totalUsers = allUsersSnap.size;

        // Active users (last 30 days)
        const activeUsersQuery = query(
          collection(db, "users"),
          where("lastActive", ">=", Timestamp.fromDate(thirtyDaysAgo))
        );
        const activeUsers = (await getDocs(activeUsersQuery)).size;

        // Premium subscriptions (role == "premium" and subscription.active == true)
        const subsQuery = query(
          collection(db, "users"),
          where("role", "==", "premium"),
          where("subscription.active", "==", true)
        );
        const subscription = (await getDocs(subsQuery)).size;

        // Free vs Premium breakdown
        const freeSnap = await getDocs(query(collection(db, "users"), where("role", "==", "free")));
        const premiumSnap = await getDocs(query(collection(db, "users"), where("role", "==", "premium")));

        const revenue = subscription * SUBSCRIPTION_PRICE;

        setStats({ users: totalUsers, revenue, activeUsers, subscription });
        setQuick({ freeUsers: freeSnap.size, premiumUsers: premiumSnap.size });
      } catch (err) {
        console.error("Dashboard fetch error:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-gray-500 text-sm font-medium">Total Users</h3>
            <div className="p-2 bg-blue-50 rounded-full">
              <Users className="h-5 w-5 text-blue-500" />
            </div>
          </div>
          <div className="text-2xl font-bold">
            {isLoading ? "Loading..." : stats.users.toLocaleString()}
          </div>
          <p className="text-gray-500 text-sm mt-2">All registered users</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-gray-500 text-sm font-medium">Revenue</h3>
            <div className="p-2 bg-green-50 rounded-full">
              <DollarSign className="h-5 w-5 text-green-500" />
            </div>
          </div>
          <div className="text-2xl font-bold">
            {isLoading ? "Loading..." : `$${stats.revenue.toFixed(2)}`}
          </div>
          <p className="text-gray-500 text-sm mt-2">Estimated monthly</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-gray-500 text-sm font-medium">Active Users</h3>
            <div className="p-2 bg-purple-50 rounded-full">
              <Activity className="h-5 w-5 text-purple-500" />
            </div>
          </div>
          <div className="text-2xl font-bold">
            {isLoading ? "Loading..." : stats.activeUsers.toLocaleString()}
          </div>
          <p className="text-gray-500 text-sm mt-2">Last 30 days</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-gray-500 text-sm font-medium">Subscriptions</h3>
            <div className="p-2 bg-amber-50 rounded-full">
              <ShoppingCart className="h-5 w-5 text-amber-500" />
            </div>
          </div>
          <div className="text-2xl font-bold">
            {isLoading ? "Loading..." : stats.subscription.toLocaleString()}
          </div>
          <p className="text-gray-500 text-sm mt-2">Active premium subscriptions</p>
        </div>
      </div>

      {/* Quick Metrics (free vs premium) */}
      <div className="bg-white rounded-lg shadow mb-8">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-medium">User Breakdown</h3>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-gray-500 text-sm font-medium">Free Users</h4>
            <p className="text-2xl font-bold">
              {isLoading ? "Loading..." : quick.freeUsers.toLocaleString()}
            </p>
            <p className="text-gray-500 text-sm mt-2">Users on free plan</p>
          </div>

          <div>
            <h4 className="text-gray-500 text-sm font-medium">Premium Users</h4>
            <p className="text-2xl font-bold">
              {isLoading ? "Loading..." : quick.premiumUsers.toLocaleString()}
            </p>
            <p className="text-gray-500 text-sm mt-2">Users on premium plan</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-medium">Quick Actions</h3>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/admin/users"
            className="block w-full py-2 px-4 rounded-md bg-[#58e221] text-white text-center hover:opacity-90"
          >
            Manage Users
          </Link>
          <Link
            href="/admin/cms"
            className="block w-full py-2 px-4 rounded-md bg-white border border-gray-300 text-gray-700 text-center hover:bg-gray-50"
          >
            Edit Content
          </Link>

        </div>
      </div>
    </div>
  );
}
