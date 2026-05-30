"use client";

import { useState } from "react";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import type { EventDetail } from "@/lib/events/types";
import {
  EventDetailsCard,
  LocationBlock,
  ResourcesBlock,
  ScheduleBlock,
  WhatToExpect,
} from "./event-detail-parts";
import { MessageForm } from "./message-form";

const TABS = ["Overview", "Schedule", "Resources", "Location", "Message"] as const;
type Tab = (typeof TABS)[number];

/** Post-registration ("Detail B") tabbed view. */
export function DetailTabs({ event }: { event: EventDetail }) {
  const [tab, setTab] = useState<Tab>("Overview");

  return (
    <div>
      {/* You're all set banner */}
      <div className="mb-5 flex items-center gap-3 rounded-2xl bg-[#eef6e3] p-4">
        <CheckCircle2 size={22} className="shrink-0 text-[#6f9a3f]" />
        <div className="flex-1">
          <p className="font-display text-sm font-bold text-ink">You&apos;re all set!</p>
          <p className="text-sm text-ink-soft">You have successfully enrolled in this event.</p>
        </div>
        <button
          type="button"
          onClick={() => setTab("Message")}
          className="hidden items-center gap-1 text-sm font-semibold text-[#6f9a3f] hover:underline sm:flex"
        >
          Contact Organizer <ArrowRight size={15} />
        </button>
      </div>

      {/* Tab bar */}
      <div className="mb-5 flex gap-5 overflow-x-auto border-b border-black/10">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`whitespace-nowrap border-b-2 pb-3 text-sm font-semibold transition-colors ${
              tab === t
                ? "border-[#9cc766] text-ink"
                : "border-transparent text-ink-soft hover:text-ink"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Panels */}
      <div className="space-y-6">
        {tab === "Overview" && (
          <>
            <EventDetailsCard event={event} />
            <WhatToExpect event={event} />
          </>
        )}
        {tab === "Schedule" && <ScheduleBlock event={event} />}
        {tab === "Resources" && <ResourcesBlock event={event} />}
        {tab === "Location" && <LocationBlock event={event} canJoin />}
        {tab === "Message" && <MessageForm eventId={event.id} />}
      </div>
    </div>
  );
}
