"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

type EventItem = {
  id: string;
  title: string;
  description: string;
  max_players: number;
  is_open: boolean;
  event_date: string | null;
  registration_deadline: string | null;
  require_game_name: boolean;
  require_game_id: boolean;
  require_discord: boolean;
  require_rank: boolean;
  require_unit_1: boolean;
  require_unit_2: boolean;
  require_note: boolean;
};

type Registration = {
  id: string;
  event_id: string;
  game_name: string;
  game_id: string;
  discord_name: string;
  rank: string;
  unit_1: string;
  unit_2: string;
  note: string;
  status: string;
  created_at: string;
  events?: { title: string };
};

type Blacklist = {
  id: string;
  game_name: string;
  game_id: string;
  reason: string;
};

function formatDate(dateString: string | null) {
  if (!dateString) return "未設定";
  return new Date(dateString).toLocaleString("zh-TW");
}

export default function AdminPage() {
  const [isLogin, setIsLogin] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [events, setEvents] = useState<EventItem[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [blacklist, setBlacklist] = useState<Blacklist[]>([]);

  const [search, setSearch] = useState("");
  const [selectedEventId, setSelectedEventId] = useState("all");

  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newMaxPlayers, setNewMaxPlayers] = useState(30);
  const [newEventDate, setNewEventDate] = useState("");
  const [newDeadline, setNewDeadline] = useState("");

  const [requireGameName, setRequireGameName] = useState(true);
  const [requireGameId, setRequireGameId] = useState(true);
  const [requireDiscord, setRequireDiscord] = useState(false);
  const [requireRank, setRequireRank] = useState(false);
  const [requireUnit1, setRequireUnit1] = useState(false);
  const [requireUnit2, setRequireUnit2] = useState(false);
  const [requireNote, setRequireNote] = useState(false);

  const [blackName, setBlackName] = useState("");
  const [blackId, setBlackId] = useState("");
  const [blackReason, setBlackReason] = useState("");

  const [message, setMessage] = useState("");

  function login(e: React.FormEvent) {
    e.preventDefault();

    if (username === "Allure" && password === "Aa123456") {
      localStorage.setItem("allure_admin_login", "true");
      setIsLogin(true);
      loadData();
    } else {
      setMessage("帳號或密碼錯誤");
    }
  }

  function logout() {
    localStorage.removeItem("allure_admin_login");
    setIsLogin(false);
  }

  async function loadData() {
    const { data: eventData } = await supabase
      .from("events")
      .select("*")
      .order("created_at", { ascending: false });

    const { data: regData } = await supabase
      .from("registrations")
      .select(`*, events(title)`)
      .order("created_at", { ascending: false });

    const { data: blackData } = await supabase.from("blacklist").select("*");

    setEvents(eventData || []);
    setRegistrations(regData || []);
    setBlacklist(blackData || []);
  }

  async function createEvent(e: React.FormEvent) {
    e.preventDefault();

    if (!newTitle.trim()) {
      alert("請輸入活動名稱");
      return;
    }

    const { error } = await supabase.from("events").insert({
      title: newTitle,
      description: newDesc,
      max_players: newMaxPlayers,
      is_open: true,
      event_date: newEventDate ? new Date(newEventDate).toISOString() : null,
      registration_deadline: newDeadline
        ? new Date(newDeadline).toISOString()
        : null,
      require_game_name: requireGameName,
      require_game_id: requireGameId,
      require_discord: requireDiscord,
      require_rank: requireRank,
      require_unit_1: requireUnit1,
      require_unit_2: requireUnit2,
      require_note: requireNote,
    });

    if (error) {
      alert("新增活動失敗：" + error.message);
      return;
    }

    setNewTitle("");
    setNewDesc("");
    setNewMaxPlayers(30);
    setNewEventDate("");
    setNewDeadline("");

    loadData();
  }

  async function toggleEvent(event: EventItem) {
    const { error } = await supabase
      .from("events")
      .update({ is_open: !event.is_open })
      .eq("id", event.id);

    if (error) {
      alert("更新失敗：" + error.message);
      return;
    }

    loadData();
  }

  async function deleteEvent(id: string) {
    if (!confirm("確定刪除活動？報名資料也會一起刪除。")) return;

    const { error } = await supabase.from("events").delete().eq("id", id);

    if (error) {
      alert("刪除失敗：" + error.message);
      return;
    }

    loadData();
  }

  async function deleteRegistration(id: string) {
    if (!confirm("確定刪除這筆報名資料嗎？")) return;

    const { error } = await supabase.from("registrations").delete().eq("id", id);

    if (error) {
      alert("刪除失敗：" + error.message);
      return;
    }

    loadData();
  }

  async function editRegistration(item: Registration) {
    const gameName = prompt("遊戲名稱", item.game_name || "");
    if (gameName === null) return;

    const gameId = prompt("遊戲UID", item.game_id || "");
    if (gameId === null) return;

    const discord = prompt("Discord", item.discord_name || "");
    if (discord === null) return;

    const rank = prompt("段位", item.rank || "");
    if (rank === null) return;

    const unit1 = prompt("主要兵種", item.unit_1 || "");
    if (unit1 === null) return;

    const unit2 = prompt("次要兵種", item.unit_2 || "");
    if (unit2 === null) return;

    const note = prompt("備註", item.note || "");
    if (note === null) return;

    const { error } = await supabase
      .from("registrations")
      .update({
        game_name: gameName,
        game_id: gameId,
        discord_name: discord,
        rank,
        unit_1: unit1,
        unit_2: unit2,
        note,
      })
      .eq("id", item.id);

    if (error) {
      alert("修改失敗：" + error.message);
      return;
    }

    loadData();
  }

  async function addBlacklist(e: React.FormEvent) {
    e.preventDefault();

    if (!blackName.trim() && !blackId.trim()) {
      alert("遊戲名稱或UID至少填一個");
      return;
    }

    const { error } = await supabase.from("blacklist").insert({
      game_name: blackName,
      game_id: blackId,
      reason: blackReason,
    });

    if (error) {
      alert("加入黑名單失敗：" + error.message);
      return;
    }

    setBlackName("");
    setBlackId("");
    setBlackReason("");
    loadData();
  }

  async function deleteBlacklist(id: string) {
    if (!confirm("確定移除黑名單？")) return;
    await supabase.from("blacklist").delete().eq("id", id);
    loadData();
  }

  function countByEvent(eventId: string) {
    return registrations.filter((r) => r.event_id === eventId).length;
  }

  function isBlacklisted(item: Registration) {
    return blacklist.find((b) => {
      const sameId =
        b.game_id && item.game_id && b.game_id.trim() === item.game_id.trim();

      const sameName =
        b.game_name &&
        item.game_name &&
        b.game_name.trim() === item.game_name.trim();

      return sameId || sameName;
    });
  }

  const filteredRegistrations = registrations.filter((item) => {
    const keyword = search.toLowerCase();
    const matchEvent =
      selectedEventId === "all" || item.event_id === selectedEventId;

    const matchSearch =
      item.game_name?.toLowerCase().includes(keyword) ||
      item.game_id?.toLowerCase().includes(keyword) ||
      item.discord_name?.toLowerCase().includes(keyword) ||
      item.rank?.toLowerCase().includes(keyword) ||
      item.unit_1?.toLowerCase().includes(keyword) ||
      item.unit_2?.toLowerCase().includes(keyword) ||
      item.note?.toLowerCase().includes(keyword) ||
      item.events?.title?.toLowerCase().includes(keyword);

    return matchEvent && matchSearch;
  });

  function exportCsv() {
    const header = [
      "活動名稱",
      "遊戲名稱",
      "遊戲UID",
      "Discord",
      "段位",
      "主要兵種",
      "次要兵種",
      "備註",
      "狀態",
      "黑名單警示",
      "黑名單原因",
      "報名時間",
    ];

    const rows = filteredRegistrations.map((item) => {
      const black = isBlacklisted(item);

      return [
        item.events?.title || "",
        item.game_name || "",
        item.game_id || "",
        item.discord_name || "",
        item.rank || "",
        item.unit_1 || "",
        item.unit_2 || "",
        item.note || "",
        item.status || "",
        black ? "是" : "否",
        black?.reason || "",
        new Date(item.created_at).toLocaleString("zh-TW"),
      ];
    });

    const csvContent =
      "\uFEFF" +
      [header, ...rows]
        .map((row) =>
          row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
        )
        .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;

    const selectedEvent = events.find((e) => e.id === selectedEventId);
    link.download =
      selectedEventId === "all"
        ? "Allure全部報名名單.csv"
        : `${selectedEvent?.title || "活動"}報名名單.csv`;

    link.click();
    URL.revokeObjectURL(url);
  }

  useEffect(() => {
    if (localStorage.getItem("allure_admin_login") === "true") {
      setIsLogin(true);
      loadData();
    }
  }, []);

  if (!isLogin) {
    return (
      <main className="container">
        <section className="card" style={{ maxWidth: 420, margin: "80px auto" }}>
          <h1 className="page-title">🔐 Allure 後台登入</h1>

          <form onSubmit={login}>
            <p>帳號</p>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={{ width: "100%" }}
            />

            <p>密碼</p>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ width: "100%" }}
            />

            <br />
            <br />

            <button type="submit">登入</button>
          </form>

          {message && <p className="danger">{message}</p>}
        </section>
      </main>
    );
  }

  return (
    <main className="container">
      <h1 className="page-title">📋 Allure 活動後台</h1>

      <section className="card" style={{ marginBottom: 20 }}>
        <button onClick={logout} style={{ marginRight: 10 }}>
          登出
        </button>
        <button onClick={loadData} style={{ marginRight: 10 }}>
          重新整理
        </button>
        <button onClick={exportCsv}>匯出目前篩選名單</button>
      </section>

      <section className="card" style={{ marginBottom: 20 }}>
        <h2>新增活動</h2>

        <form onSubmit={createEvent}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <input
              placeholder="活動名稱"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
            />

            <input
              placeholder="活動說明"
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
            />

            <input
              type="number"
              value={newMaxPlayers}
              onChange={(e) => setNewMaxPlayers(Number(e.target.value))}
              style={{ width: 110 }}
            />

            <input
              type="datetime-local"
              value={newEventDate}
              onChange={(e) => setNewEventDate(e.target.value)}
            />

            <input
              type="datetime-local"
              value={newDeadline}
              onChange={(e) => setNewDeadline(e.target.value)}
            />
          </div>

          <div style={{ marginTop: 15, display: "flex", gap: 12, flexWrap: "wrap" }}>
            <label>
              <input
                type="checkbox"
                checked={requireGameName}
                onChange={(e) => setRequireGameName(e.target.checked)}
              />
              遊戲名稱必填
            </label>

            <label>
              <input
                type="checkbox"
                checked={requireGameId}
                onChange={(e) => setRequireGameId(e.target.checked)}
              />
              UID必填
            </label>

            <label>
              <input
                type="checkbox"
                checked={requireDiscord}
                onChange={(e) => setRequireDiscord(e.target.checked)}
              />
              Discord必填
            </label>

            <label>
              <input
                type="checkbox"
                checked={requireRank}
                onChange={(e) => setRequireRank(e.target.checked)}
              />
              段位必填
            </label>

            <label>
              <input
                type="checkbox"
                checked={requireUnit1}
                onChange={(e) => setRequireUnit1(e.target.checked)}
              />
              主要兵種必填
            </label>

            <label>
              <input
                type="checkbox"
                checked={requireUnit2}
                onChange={(e) => setRequireUnit2(e.target.checked)}
              />
              次要兵種必填
            </label>

            <label>
              <input
                type="checkbox"
                checked={requireNote}
                onChange={(e) => setRequireNote(e.target.checked)}
              />
              備註必填
            </label>
          </div>

          <div style={{ marginTop: 15 }}>
            <button type="submit">新增活動</button>
          </div>
        </form>
      </section>

      <section className="card" style={{ marginBottom: 20 }}>
        <h2>活動管理</h2>

        <div style={{ overflowX: "auto" }}>
          <table border={1} cellPadding={8} style={{ borderCollapse: "collapse", width: "100%" }}>
            <thead>
              <tr>
                <th>活動名稱</th>
                <th>說明</th>
                <th>活動日期</th>
                <th>報名截止</th>
                <th>目前人數</th>
                <th>上限</th>
                <th>狀態</th>
                <th>操作</th>
              </tr>
            </thead>

            <tbody>
              {events.map((event) => (
                <tr key={event.id}>
                  <td>{event.title}</td>
                  <td>{event.description}</td>
                  <td>{formatDate(event.event_date)}</td>
                  <td>{formatDate(event.registration_deadline)}</td>
                  <td>{countByEvent(event.id)}</td>
                  <td>{event.max_players}</td>
                  <td>{event.is_open ? "開放中" : "已關閉"}</td>
                  <td>
                    <button onClick={() => toggleEvent(event)}>
                      {event.is_open ? "關閉報名" : "開放報名"}
                    </button>

                    <button
                      onClick={() => deleteEvent(event.id)}
                      style={{ marginLeft: 8 }}
                    >
                      刪除
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card" style={{ marginBottom: 20 }}>
        <h2>黑名單管理</h2>

        <form onSubmit={addBlacklist}>
          <input
            placeholder="遊戲名稱"
            value={blackName}
            onChange={(e) => setBlackName(e.target.value)}
            style={{ marginRight: 8 }}
          />

          <input
            placeholder="遊戲UID"
            value={blackId}
            onChange={(e) => setBlackId(e.target.value)}
            style={{ marginRight: 8 }}
          />

          <input
            placeholder="原因"
            value={blackReason}
            onChange={(e) => setBlackReason(e.target.value)}
            style={{ marginRight: 8 }}
          />

          <button type="submit">加入黑名單</button>
        </form>

        <div style={{ overflowX: "auto", marginTop: 12 }}>
          <table border={1} cellPadding={8} style={{ borderCollapse: "collapse", width: "100%" }}>
            <thead>
              <tr>
                <th>遊戲名稱</th>
                <th>UID</th>
                <th>原因</th>
                <th>操作</th>
              </tr>
            </thead>

            <tbody>
              {blacklist.map((b) => (
                <tr key={b.id}>
                  <td>{b.game_name}</td>
                  <td>{b.game_id}</td>
                  <td>{b.reason}</td>
                  <td>
                    <button onClick={() => deleteBlacklist(b.id)}>移除</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card">
        <h2>報名名單：{filteredRegistrations.length} 人</h2>

        <div style={{ marginBottom: 15 }}>
          <select
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
            style={{ marginRight: 10 }}
          >
            <option value="all">全部活動</option>

            {events.map((event) => (
              <option key={event.id} value={event.id}>
                {event.title}
              </option>
            ))}
          </select>

          <input
            placeholder="搜尋活動 / 玩家 / UID / Discord / 段位 / 兵種"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: 320 }}
          />
        </div>

        <div style={{ overflowX: "auto" }}>
          <table border={1} cellPadding={8} style={{ borderCollapse: "collapse", width: "100%" }}>
            <thead>
              <tr>
                <th>活動名稱</th>
                <th>遊戲名稱</th>
                <th>UID</th>
                <th>Discord</th>
                <th>段位</th>
                <th>主要兵種</th>
                <th>次要兵種</th>
                <th>備註</th>
                <th>狀態</th>
                <th>黑名單</th>
                <th>報名時間</th>
                <th>操作</th>
              </tr>
            </thead>

            <tbody>
              {filteredRegistrations.map((item) => {
                const black = isBlacklisted(item);

                return (
                  <tr key={item.id} style={{ backgroundColor: black ? "#ffe0e0" : "white" }}>
                    <td>{item.events?.title}</td>
                    <td>{item.game_name}</td>
                    <td>{item.game_id}</td>
                    <td>{item.discord_name}</td>
                    <td>{item.rank}</td>
                    <td>{item.unit_1}</td>
                    <td>{item.unit_2}</td>
                    <td>{item.note}</td>
                    <td>{item.status}</td>
                    <td>
                      {black ? (
                        <span className="danger">
                          ⚠ {black.reason || "未填原因"}
                        </span>
                      ) : (
                        "正常"
                      )}
                    </td>
                    <td>{new Date(item.created_at).toLocaleString("zh-TW")}</td>
                    <td>
                      <button onClick={() => editRegistration(item)}>修改</button>
                      <button
                        onClick={() => deleteRegistration(item.id)}
                        style={{ marginLeft: 8 }}
                      >
                        刪除
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}