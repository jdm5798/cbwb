"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { TabNav } from "./TabNav";

function getLocalDate(): string {
  return new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD in local time
}

export function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const [date, setDate] = useState(getLocalDate());

  function handleDateChange(value: string) {
    setDate(value);
    router.push(`/now?date=${value}`);
  }

  // Only show date picker when on the /now page
  const showDatePicker = pathname === "/now" || pathname.startsWith("/now");

  return (
    <header className="sticky top-0 z-50 bg-zinc-950 border-b border-zinc-800">
      <div className="max-w-5xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          {/* Logo / title */}
          <div className="flex items-center gap-3">
            <span className="text-lg font-bold text-white tracking-tight">
              🏀 Watch Buddy
            </span>
          </div>

          {/* Date picker (only on /now) */}
          {showDatePicker && (
            <input
              type="date"
              value={date}
              onChange={(e) => handleDateChange(e.target.value)}
              className="bg-zinc-900 border border-zinc-700 text-zinc-200 text-sm rounded px-2 py-1 focus:outline-none focus:border-orange-400"
            />
          )}
        </div>
        <TabNav />
      </div>
    </header>
  );
}
