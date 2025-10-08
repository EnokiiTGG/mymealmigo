"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { db } from "@/lib/firebase";
import {
  doc, getDoc, updateDoc,
  collection, addDoc, query, orderBy, onSnapshot, serverTimestamp
} from "firebase/firestore";

type Message = {
  id: string;
  sender: "user" | "ai" | "nutritionist";
  text: string;
  createdAt?: any;
};

export default function ChatDetailPage() {
  const { chatId } = useParams<{ chatId: string }>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const q = query(collection(doc(db, "chats", chatId), "messages"), orderBy("createdAt", "asc"));
    const unsub = onSnapshot(q, snap => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<Message,"id">) })));
      endRef.current?.scrollIntoView({ behavior: "smooth" });
    });
    return () => unsub();
  }, [chatId]);

  const sendReply = async () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    await addDoc(collection(doc(db, "chats", chatId), "messages"), {
      sender: "nutritionist",
      text: trimmed,
      createdAt: serverTimestamp(),
    });
    await updateDoc(doc(db, "chats", chatId), { lastMessageAt: serverTimestamp() });
    setInput("");
  };

  const markResolved = async () => {
    await updateDoc(doc(db, "chats", chatId), { status: "resolved", consultRequested: false });
  };

  return (
    <div className="grid gap-4">
      <div className="rounded-xl border bg-white p-4 h-[60vh] overflow-auto">
        {messages.map(m => (
          <div key={m.id} className={`my-2 ${m.sender === "nutritionist" ? "text-right" : "text-left"}`}>
            <div className={`inline-block rounded-xl px-3 py-2 ${m.sender === "nutritionist" ? "bg-[#eaffea]" : "bg-gray-100"}`}>
              <div className="text-xs text-gray-500 mb-1">{m.sender}</div>
              <div className="text-sm">{m.text}</div>
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      <div className="rounded-xl border bg-white p-3 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1 border rounded-md px-3 py-2"
          placeholder="Write a reply..."
        />
        <button onClick={sendReply} className="px-4 py-2 bg-[#58e221] text-white rounded-md hover:opacity-90">
          Send
        </button>
        <button onClick={markResolved} className="px-4 py-2 border rounded-md hover:bg-gray-50">
          Mark resolved
        </button>
      </div>
    </div>
  );
}
