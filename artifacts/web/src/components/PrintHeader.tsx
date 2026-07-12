import { useQuery } from "@tanstack/react-query";
import { api, type CompanySettings } from "../lib/api";
import { useAuth } from "../lib/auth";
import { isoToJalaliString } from "../lib/jalali";

interface PrintHeaderProps {
  title: string;
  rangeLabel?: string;
}

/**
 * Shared print header shown only when printing (via CSS `.print-only` / `@media print`).
 * Every professional print view in the app renders this at the top: company name, logo,
 * address, phone, WhatsApp, email, website, print date (Gregorian + Hijri Shamsi), the
 * report's date range, and the user who prepared it.
 */
export default function PrintHeader({ title, rangeLabel }: PrintHeaderProps) {
  const { user } = useAuth();
  const { data: settings } = useQuery({
    queryKey: ["settings"],
    queryFn: () => api.get<CompanySettings>("/settings"),
  });

  const now = new Date();
  const printDate = now.toISOString().slice(0, 10);

  return (
    <div className="print-header" style={{ marginBottom: 20, borderBottom: "2px solid #000", paddingBottom: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          {settings?.logoUrl ? (
            <img src={settings.logoUrl} alt="logo" style={{ width: 56, height: 56, objectFit: "contain" }} />
          ) : null}
          <div>
            <div style={{ fontSize: 18, fontWeight: 700 }}>{settings?.companyName ?? "Arabian D Residence"}</div>
            <div style={{ fontSize: 12, color: "#333" }}>
              {[settings?.address, settings?.phone, settings?.whatsapp ? `WhatsApp: ${settings.whatsapp}` : null, settings?.email, settings?.website]
                .filter(Boolean)
                .join(" · ")}
            </div>
          </div>
        </div>
        <div style={{ textAlign: "left", fontSize: 12, color: "#333" }}>
          <div>چاپ نېټه: {printDate} ({isoToJalaliString(printDate)})</div>
          {rangeLabel ? <div>{rangeLabel}</div> : null}
          <div>چمتو کوونکی: {user?.fullName ?? user?.username ?? "—"}</div>
        </div>
      </div>
      <div style={{ fontSize: 16, fontWeight: 700, textAlign: "center", marginTop: 12 }}>{title}</div>
    </div>
  );
}
