export const dynamic = "force-dynamic";
export const revalidate = 0;

import { supabase } from "../lib/supabase";

function formatDate(dateString: string | null) {
  if (!dateString) return "未設定";
  return new Date(dateString).toLocaleString("zh-TW");
}

type EventItem = {
  id: string;
  title: string;
  description: string;
  max_players: number;
  is_open: boolean;
  event_date: string | null;
  registration_deadline: string | null;
  created_at: string;
};

type Registration = {
  event_id: string;
};

export default async function Home() {
  const now = new Date();

  const { data: events } = await supabase
    .from("events")
    .select("*")
    .order("created_at", { ascending: false });

  const { data: registrations } = await supabase
    .from("registrations")
    .select("event_id");

  const countMap = new Map<string, number>();

  (registrations as Registration[] | null)?.forEach((r) => {
    countMap.set(r.event_id, (countMap.get(r.event_id) || 0) + 1);
  });

  return (
    <main className="container">
      <h1 className="page-title">🎮 Allure 活動報名系統</h1>

      {(events as EventItem[] | null)?.map((event) => {
        const currentCount = countMap.get(event.id) || 0;
        const remaining = event.max_players - currentCount;
        const isFull = currentCount >= event.max_players;

        const isDeadlinePassed =
          event.registration_deadline &&
          new Date(event.registration_deadline) < now;

        let statusText = "🟢 開放報名";
        let statusClass = "success";

        if (!event.is_open) {
          statusText = "⚫ 報名已關閉";
          statusClass = "danger";
        } else if (isDeadlinePassed) {
          statusText = "🔴 報名時間已截止";
          statusClass = "danger";
        } else if (isFull) {
          statusText = "🔴 活動已額滿";
          statusClass = "danger";
        }

        return (
          <section key={event.id} className="card" style={{ marginBottom: 20 }}>
            <h2>{event.title}</h2>

            <p>{event.description}</p>

            <p>📅 活動開始：{formatDate(event.event_date || event.created_at)}</p>

            <p>⏰ 報名截止：{formatDate(event.registration_deadline)}</p>

            <p>
              👥 目前報名：
              <strong> {currentCount} / {event.max_players}</strong>
            </p>

            <p>
              🎯 剩餘名額：
              <strong> {remaining > 0 ? remaining : 0}</strong>
            </p>

            <p className={statusClass}>{statusText}</p>

            {event.is_open && !isDeadlinePassed && !isFull && (
              <a href={`/register/${event.id}`}>
                <button>我要報名</button>
              </a>
            )}
          </section>
        );
      })}
    </main>
  );
}