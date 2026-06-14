"use client";

import { use, useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";

const units = [
  "長槍兵",
  "長矛兵",
  "長戈兵",
  "陌刀兵",
  "長劍兵",
  "雙槍兵",
  "刀盾兵",
  "重盾兵",
  "槍盾兵",
  "錘盾兵",
  "劍盾兵",
  "斧盾兵",
  "長弓兵",
  "連弩兵",
  "毒弓兵",
  "獵人",
  "強弩兵",
  "火弓兵",
  "劍騎兵",
  "槍騎兵",
  "大刀騎兵",
  "重騎兵",
  "弓騎兵",
  "斧騎兵",
];

const ranks = [
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
];

type EventItem = {
  id: string;
  title: string;
  max_players: number;
  is_open: boolean;
  registration_deadline: string | null;
  require_game_name: boolean;
  require_game_id: boolean;
  require_discord: boolean;
  require_rank: boolean;
  require_unit_1: boolean;
  require_unit_2: boolean;
  require_note: boolean;
};

export default function RegisterPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const eventId = id;

  const [event, setEvent] = useState<EventItem | null>(null);

  const [gameName, setGameName] = useState("");
  const [gameId, setGameId] = useState("");
  const [discordName, setDiscordName] = useState("");
  const [rank, setRank] = useState("");
  const [unit1, setUnit1] = useState("");
  const [unit2, setUnit2] = useState("");
  const [note, setNote] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadEvent() {
      const { data } = await supabase
        .from("events")
        .select("*")
        .eq("id", eventId)
        .single();

      setEvent(data);
    }

    loadEvent();
  }, [eventId]);

  async function submitForm(e: React.FormEvent) {
    e.preventDefault();

    if (!event) {
      setMessage("❌ 活動資料載入中");
      return;
    }

    if (event.require_game_name && !gameName.trim()) {
      setMessage("請輸入遊戲名稱");
      return;
    }

    if (event.require_game_id && !gameId.trim()) {
      setMessage("請輸入遊戲UID");
      return;
    }

    if (event.require_discord && !discordName.trim()) {
      setMessage("請輸入 Discord");
      return;
    }

    if (event.require_rank && !rank) {
      setMessage("請選擇段位");
      return;
    }

    if (event.require_unit_1 && !unit1) {
      setMessage("請選擇主要兵種");
      return;
    }

    if (event.require_unit_2 && !unit2) {
      setMessage("請選擇次要兵種");
      return;
    }

    if (event.require_note && !note.trim()) {
      setMessage("請填寫備註");
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
      unit_1: unit1,
      unit_2: unit2,
      note,
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
      setUnit1("");
      setUnit2("");
      setNote("");
    }
  }

  return (
    <main className="container">
      <section className="card" style={{ maxWidth: 620, margin: "40px auto" }}>
        <h1 className="page-title">🎮 活動報名</h1>

        {event && <h2>{event.title}</h2>}

        <form onSubmit={submitForm}>
          <p>遊戲名稱 {event?.require_game_name ? "*" : ""}</p>
          <input
            value={gameName}
            onChange={(e) => setGameName(e.target.value)}
            style={{ width: "100%" }}
          />

          <p>遊戲UID {event?.require_game_id ? "*" : ""}</p>
          <input
            value={gameId}
            onChange={(e) => setGameId(e.target.value)}
            style={{ width: "100%" }}
          />

          <p>Discord {event?.require_discord ? "*" : ""}</p>
          <input
            value={discordName}
            onChange={(e) => setDiscordName(e.target.value)}
            style={{ width: "100%" }}
          />

          <p>段位 {event?.require_rank ? "*" : ""}</p>
          <select
            value={rank}
            onChange={(e) => setRank(e.target.value)}
            style={{ width: "100%" }}
          >
            <option value="">請選擇段位</option>
            {ranks.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>

          <p>主要兵種 {event?.require_unit_1 ? "*" : ""}</p>
          <select
            value={unit1}
            onChange={(e) => setUnit1(e.target.value)}
            style={{ width: "100%" }}
          >
            <option value="">請選擇主要兵種</option>
            {units.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>

          <p>次要兵種 {event?.require_unit_2 ? "*" : ""}</p>
          <select
            value={unit2}
            onChange={(e) => setUnit2(e.target.value)}
            style={{ width: "100%" }}
          >
            <option value="">請選擇次要兵種</option>
            {units.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>

          <p>備註 {event?.require_note ? "*" : ""}</p>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            style={{ width: "100%", minHeight: 90 }}
          />

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