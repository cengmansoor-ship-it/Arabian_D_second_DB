import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Building2 } from "lucide-react";
import { useAuth } from "../lib/auth";
import { api, type CompanySettings } from "../lib/api";

const AUTO_ADVANCE_MS = 3000;

/**
 * Required post-login flow: Login → Welcome → Dashboard.
 * Shown once per fresh login (not on refresh/direct navigation), auto-advances
 * after ~3s, and Enter advances immediately while cancelling the timer.
 */
export default function WelcomePage() {
  const navigate = useNavigate();
  const { acknowledgeWelcome } = useAuth();
  const advancedRef = useRef(false);
  const { data: settings } = useQuery({
    queryKey: ["company-settings"],
    queryFn: () => api.get<CompanySettings>("/settings"),
  });

  function advance() {
    if (advancedRef.current) return;
    advancedRef.current = true;
    acknowledgeWelcome();
    navigate("/", { replace: true });
  }

  useEffect(() => {
    const timer = setTimeout(advance, AUTO_ADVANCE_MS);
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Enter") {
        clearTimeout(timer);
        advance();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("keydown", onKeyDown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const companyName = settings?.companyName || "Arabian D Residence";

  return (
    <div
      dir="rtl"
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "var(--sidebar-bg, #101828)",
        color: "#fff",
      }}
      role="status"
      aria-live="polite"
    >
      {/* Section 1: brand + Pashto welcome */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "32px 24px",
          textAlign: "center",
        }}
      >
        <div
          style={{
            width: 88,
            height: 88,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.1)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 24,
          }}
        >
          <Building2 size={40} color="#fff" />
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 12 }}>{companyName}</h1>
        <p style={{ fontSize: 18, fontWeight: 600, lineHeight: 1.9, maxWidth: 520 }}>
          د ښه هوساینه زموږ سره تجربه کړئ
        </p>
        <p style={{ fontSize: 15, opacity: 0.85, lineHeight: 1.9, maxWidth: 520, marginTop: 6 }}>
          باور ستاسو، کیفیت زموږ
        </p>
        <p style={{ fontSize: 15, opacity: 0.85, lineHeight: 1.9, maxWidth: 520, marginTop: 6 }}>
          د ښه معیار سمبول
        </p>
      </div>

      {/* Section 2: English equivalents + continue affordance */}
      <div
        dir="ltr"
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "32px 24px",
          textAlign: "center",
          background: "rgba(255,255,255,0.04)",
        }}
      >
        <p style={{ fontSize: 18, fontWeight: 600, lineHeight: 1.8, maxWidth: 520 }}>
          Experience a better lifestyle with us
        </p>
        <p style={{ fontSize: 15, opacity: 0.85, lineHeight: 1.8, maxWidth: 520, marginTop: 6 }}>
          Your trust, our quality
        </p>
        <p style={{ fontSize: 15, opacity: 0.85, lineHeight: 1.8, maxWidth: 520, marginTop: 6 }}>
          A symbol of excellence
        </p>

        <button
          onClick={advance}
          className="btn btn-primary"
          style={{ marginTop: 32, padding: "12px 32px", borderRadius: 8, fontWeight: 600 }}
        >
          Continue (Enter) · دوام ورکړئ
        </button>
      </div>
    </div>
  );
}
