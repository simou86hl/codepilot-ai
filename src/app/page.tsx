"use client";

import React, { useState } from "react";
import { ChatView } from "@/components/chat/chat-view";
import { SettingsPanel } from "@/components/chat/settings-panel";

export default function Home() {
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <>
      <ChatView onOpenSettings={() => setSettingsOpen(true)} />
      <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </>
  );
}
