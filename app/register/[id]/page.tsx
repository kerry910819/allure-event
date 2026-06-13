"use client";

import { use, useState } from "react";
import { supabase } from "../../../lib/supabase";

export default function RegisterPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const eventId = id;

  const [gameName, setGameName] = useState("");
  const [gameId, setGameId] = useState("");
  const [discordName, setDiscordName] = useState("");
  const [rank, setRank] = useState("");
  const [message, setMessage] = useState("");

  async function submitForm(e: React.FormEvent) {
    e.preventDefault();

    if (!gameName.trim()) {
      setMessage("請輸入遊戲名稱");
      return;
    }

    if (!gameId.trim()) {
      setMessage("請輸入遊戲UID");
      return;
    }

    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("max_players, is_open, registration_deadline")
      .eq("id", eventId)
      .single();

    if (eventError || !event) {
      setMessage("❌ 找不到活動資料");
      return;
    }

    if (!event.is_open) {
      setMessage("❌ 此活動已關閉報名");
      return;
    }

    if (
      event.registration_deadline &&
      new Date(event.registration_deadline) < new Date()
    ) {
      setMessage("❌ 報名時間已截止");
      return;
    }

    const { count } = await supabase
      .from("registrations")
      .select("*", { count: "exact", head: true })
      .eq("event_id", eventId);

    if ((count ?? 0) >= event.max_players) {
      setMessage("❌ 此活動已額滿");
      return;
    }

    const { data: existing } = await supabase
      .from("registrations")
      .select("id")
      .eq("event_id", eventId)
      .eq("game_id", gameId)
      .maybeSingle();

    if (existing) {
      setMessage("❌ 你已經報名過此活動");
      return;
    }

    const { error } = await supabase.from("registrations").insert({
      event_id: eventId,
      game_name: gameName,
      game_id: gameId,
      discord_name: discordName,
      rank,
      status: "報名成功",
    });

    if (error) {
      setMessage("❌ 報名失敗：" + error.message);
    } else {
      setMessage("✅ 報名成功！");
      setGameName("");
      setGameId("");
      setDiscordName("");
      setRank("");
    }
  }

  return (
    <main className="container">
      <section className="card" style={{ maxWidth: 560, margin: "40px auto" }}>
        <h1 className="page-title">🎮 活動報名</h1>

        <form onSubmit={submitForm}>
          <p>遊戲名稱 *</p>
          <input
            value={gameName}
            onChange={(e) => setGameName(e.target.value)}
            style={{ width: "100%" }}
          />

          <p>遊戲UID *</p>
          <input
            value={gameId}
            onChange={(e) => setGameId(e.target.value)}
            style={{ width: "100%" }}
          />

          <p>Discord</p>
          <input
            value={discordName}
            onChange={(e) => setDiscordName(e.target.value)}
            style={{ width: "100%" }}
          />

          <p>段位</p>
          <select
            value={rank}
            onChange={(e) => setRank(e.target.value)}
            style={{ width: "100%" }}
          >
            <option value="">請選擇段位</option>
            {[
              "黑鐵III",
              "黑鐵II",
              "黑鐵I",
              "青銅III",
              "青銅II",
              "青銅I",
              "白銀III",
              "白銀II",
              "白銀I",
              "黃金III",
              "黃金II",
              "黃金I",
              "鉑金IV",
              "鉑金III",
              "鉑金II",
              "鉑金I",
              "鑽石V",
              "鑽石IV",
              "鑽石III",
              "鑽石II",
              "鑽石I",
              "大師III",
              "大師II",
              "大師I",
              "王者",
            ].map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>

          <div style={{ marginTop: 24 }}>
            <button type="submit">送出報名</button>

            <a href="/" style={{ marginLeft: 10 }}>
              <button type="button">返回首頁</button>
            </a>
          </div>
        </form>

        {message && (
          <p
            className={message.includes("✅") ? "success" : "danger"}
            style={{ marginTop: 20 }}
          >
            {message}
          </p>
        )}
      </section>
    </main>
  );
}