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

export function ExistingSessionPanel({
  email,
  role,
  onContinue,
  onSignOut,
  signingOut = false,
}) {
  const normalizedRole = String(role || "user").toLowerCase();
  const roleLabel =
    normalizedRole === "admin"
      ? "Admin"
      : normalizedRole === "freelancer"
        ? "Freelancer"
        : "Customer";

  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100%",
        display: "grid",
        placeItems: "center",
        padding: 24,
        background:
          "radial-gradient(circle at 20% 18%, rgba(245, 158, 11, 0.13), transparent 30%), radial-gradient(circle at 82% 20%, rgba(124,58,237,0.10), transparent 34%), linear-gradient(180deg, #fbfaf8 0%, #f5f0ea 100%)",
        color: "rgba(27,16,46,0.92)",
      }}
    >
      <section
        style={{
          width: "min(480px, 92vw)",
          padding: "30px 26px",
          borderRadius: 28,
          border: "1px solid rgba(42,20,80,0.12)",
          background: "rgba(255,255,255,0.94)",
          boxShadow: "0 26px 80px rgba(15,23,42,0.11)",
          textAlign: "center",
          fontFamily:
            "Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: 12,
            fontWeight: 900,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            color: "rgba(128,90,24,0.78)",
          }}
        >
          Carvver
        </p>
        <h1
          style={{
            margin: "10px 0 0",
            fontSize: 28,
            lineHeight: 1.08,
            color: "rgba(27,16,46,0.96)",
          }}
        >
          You&apos;re already signed in
        </h1>
        <p
          style={{
            margin: "12px auto 0",
            maxWidth: "34ch",
            fontSize: 14,
            lineHeight: 1.65,
            color: "rgba(27,16,46,0.68)",
          }}
        >
          This browser is currently using a {roleLabel.toLowerCase()} account
          {email ? ` for ${email}` : ""}. Continue with it, or sign out to use
          another account.
        </p>
        <div
          style={{
            margin: "18px auto 0",
            width: "100%",
            display: "grid",
            gap: 10,
          }}
        >
          <button
            type="button"
            onClick={onContinue}
            style={{
              minHeight: 48,
              border: "1px solid rgba(42,20,80,0.16)",
              borderRadius: 16,
              padding: "0 18px",
              background:
                "linear-gradient(180deg, rgba(42,20,80,1), rgba(42,20,80,0.86))",
              color: "#fff",
              fontWeight: 850,
              cursor: "pointer",
            }}
          >
            Continue to dashboard
          </button>
          <button
            type="button"
            onClick={onSignOut}
            disabled={signingOut}
            style={{
              minHeight: 46,
              border: "1px solid rgba(42,20,80,0.12)",
              borderRadius: 16,
              padding: "0 18px",
              background: "rgba(255,255,255,0.76)",
              color: "rgba(42,20,80,0.9)",
              fontWeight: 850,
              cursor: signingOut ? "wait" : "pointer",
              opacity: signingOut ? 0.72 : 1,
            }}
          >
            {signingOut ? "Signing out..." : "Sign out and use another account"}
          </button>
        </div>
      </section>
    </div>
  );
}
