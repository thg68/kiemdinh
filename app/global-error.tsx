"use client";

export default function GlobalError({
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <html lang="vi">
      <body style={{ margin: 0 }}>
        <title>Có lỗi xảy ra</title>
        <main
          style={{
            alignItems: "center",
            background: "#f9f8f6",
            color: "#171417",
            display: "flex",
            fontFamily: "system-ui, sans-serif",
            minHeight: "100vh",
            padding: 24,
          }}
        >
          <div
            style={{
              background: "#ffffff",
              border: "1px solid #f0e9e1",
              borderRadius: 16,
              margin: "0 auto",
              maxWidth: 640,
              padding: 28,
              width: "100%",
            }}
          >
            <h1 style={{ color: "#0c1754", fontSize: 28, margin: 0 }}>
              Có lỗi xảy ra
            </h1>
            <p style={{ color: "#4d4a4d", fontSize: 15, lineHeight: 1.7, marginTop: 12 }}>
              Vui lòng thử lại. Nếu lỗi vẫn tiếp diễn, hãy quay lại sau ít phút.
            </p>
            <button
              onClick={() => retry()}
              style={{
                background: "#2545ff",
                border: 0,
                borderRadius: 999,
                color: "#ffffff",
                cursor: "pointer",
                fontWeight: 700,
                marginTop: 20,
                minHeight: 44,
                padding: "12px 20px",
              }}
              type="button"
            >
              Thử lại
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
