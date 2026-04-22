import React from "react";

export function AuthGuardFallback({ message = "Checking your session" }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100%",
        display: "grid",
        placeItems: "center",
        padding: 24,
        background:
          "radial-gradient(circle at 20% 18%, rgba(245, 158, 11, 0.12), transparent 30%), linear-gradient(180deg, #fbfaf8 0%, #f5f0ea 100%)",
        color: "rgba(27,16,46,0.9)",
      }}
    >
      <div
        style={{
          display: "grid",
          gap: 12,
          justifyItems: "center",
          textAlign: "center",
          fontFamily:
            "Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
        }}
      >
        <span
          style={{
            width: 44,
            height: 44,
            borderRadius: "999px",
            border: "3px solid rgba(242,193,78,0.35)",
            borderTopColor: "rgba(42,20,80,0.9)",
            animation: "authGuardSpin 0.9s linear infinite",
          }}
          aria-hidden="true"
        />
        <strong style={{ fontSize: 16 }}>{message}</strong>
        <style>{`
          @keyframes authGuardSpin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  );
}

export function AuthGuardError({
  message = "Your session expired. Please sign in again.",
  onRetry,
}) {
  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100%",
        display: "grid",
        placeItems: "center",
        padding: 24,
        background:
          "radial-gradient(circle at 20% 18%, rgba(245, 158, 11, 0.13), transparent 30%), linear-gradient(180deg, #fbfaf8 0%, #f5f0ea 100%)",
        color: "rgba(27,16,46,0.92)",
      }}
    >
      <section
        style={{
          width: "min(440px, 92vw)",
          padding: "28px 24px",
          borderRadius: 26,
          border: "1px solid rgba(42,20,80,0.12)",
          background: "rgba(255,255,255,0.94)",
          boxShadow: "0 24px 70px rgba(15,23,42,0.10)",
          textAlign: "center",
          fontFamily:
            "Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
        }}
      >
        <h1
          style={{
            margin: 0,
            fontSize: 24,
            lineHeight: 1.1,
            color: "rgba(27,16,46,0.96)",
          }}
        >
          Session needs a refresh
        </h1>
        <p
          style={{
            margin: "12px auto 0",
            maxWidth: "32ch",
            fontSize: 14,
            lineHeight: 1.6,
            color: "rgba(27,16,46,0.68)",
          }}
        >
          {message}
        </p>
        <button
          type="button"
          onClick={onRetry}
          style={{
            marginTop: 20,
            minHeight: 46,
            border: "1px solid rgba(42,20,80,0.16)",
            borderRadius: 16,
            padding: "0 18px",
            background:
              "linear-gradient(180deg, rgba(42,20,80,1), rgba(42,20,80,0.86))",
            color: "#fff",
            fontWeight: 800,
            cursor: "pointer",
          }}
        >
          Back to sign in
        </button>
      </section>
    </div>
  );
}
