import "./globals.css";

export const metadata = {
  title: "Allure 活動報名系統",
  description: "Allure 活動報名系統",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-Hant">
      <body>{children}</body>
    </html>
  );
}