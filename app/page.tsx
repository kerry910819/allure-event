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
        const isFull = currentCount >= event.max_players;

        const isDeadlinePassed =
          event.registration_deadline &&
          new Date(event.registration_deadline) < now;

        return (
          <section key={event.id} className="card" style={{ marginBottom: 20 }}>
            <h2>{event.title}</h2>
            <p>{event.description}</p>

            <p>📅 活動日期：{formatDate(event.event_date)}</p>
            <p>⏰ 報名截止：{formatDate(event.registration_deadline)}</p>

            <p>
              👥 目前報名：
              <strong> {currentCount} / {event.max_players}</strong>
            </p>

            {!event.is_open ? (
              <p className="danger">報名已關閉</p>
            ) : isDeadlinePassed ? (
              <p className="danger">報名時間已截止</p>
            ) : isFull ? (
              <p className="danger">活動已額滿</p>
            ) : (
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