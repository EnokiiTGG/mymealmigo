"use client";

import { useEffect, useState } from "react";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";

type Chat = {
  id: string;
  userId: string;
  status: "open" | "resolved";
  consultRequested?: boolean;
  lastMessageAt?: any;
};

export default function ChatsPage() {
  const [chats, setChats] = useState<Chat[]>([]);

  useEffect(() => {
    const q = query(
      collection(db, "chats"),
      where("status", "==", "open"),
      orderBy("lastMessageAt", "desc")
    );
    const unsub = onSnapshot(q, (snap) => {
      setChats(snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<Chat,"id">) })));
    });
    return () => unsub();
  }, []);

  return (
    <div className="rounded-xl border bg-white">
      <div className="p-4 border-b font-medium">Open Chats</div>
      <div className="divide-y">
        {chats.map(c => (
          <a key={c.id} href={`/nutritionist/chats/${c.id}`} className="block p-4 hover:bg-gray-50">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600">User: {c.userId}</div>
                <div className="text-xs text-gray-500">
                  {c.consultRequested ? "Consultation requested" : "AI chat"}
                </div>
              </div>
              <div className="text-xs text-gray-500">
                {c.lastMessageAt?.toDate?.().toLocaleString?.() ?? ""}
              </div>
            </div>
          </a>
        ))}
        {chats.length === 0 && <div className="p-6 text-sm text-gray-500">No open chats.</div>}
      </div>
    </div>
  );
}
