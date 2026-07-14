import { jalaliFromIso, isoFromJalali, todayJalali, PASHTO_MONTHS, daysInJalaliMonth } from "../lib/jalali";

interface JalaliDateInputProps {
  /** Gregorian ISO date string ("YYYY-MM-DD"), used for storage/API compatibility. */
  value: string;
  onChange: (isoValue: string) => void;
  className?: string;
  required?: boolean;
  disabled?: boolean;
}

const currentJy = todayJalali().jy;
const YEAR_OPTIONS = Array.from({ length: currentJy - 1370 + 6 }, (_, i) => currentJy + 5 - i);

/**
 * Solar Hijri (Jalali) date picker made of three selects (day / month / year).
 * Emits a Gregorian ISO string via onChange so it is a drop-in replacement for
 * `<input type="date">` wherever a date is entered — the whole app must never
 * show a Gregorian calendar widget to the user.
 */
export default function JalaliDateInput({ value, onChange, className, required, disabled }: JalaliDateInputProps) {
  const j = jalaliFromIso(value) ?? todayJalali();
  const maxDay = daysInJalaliMonth(j.jy, j.jm);

  function update(next: { jy?: number; jm?: number; jd?: number }) {
    const jy = next.jy ?? j.jy;
    const jm = next.jm ?? j.jm;
    let jd = next.jd ?? j.jd;
    const clampMax = daysInJalaliMonth(jy, jm);
    if (jd > clampMax) jd = clampMax;
    onChange(isoFromJalali(jy, jm, jd));
  }

  return (
    <div className={`jalali-date-input ${className ?? ""}`} style={{ display: "flex", gap: 6 }}>
      <select
        className="form-input"
        value={j.jd}
        disabled={disabled}
        required={required}
        onChange={(e) => update({ jd: Number(e.target.value) })}
        style={{ flex: "0 1 70px" }}
        aria-label="ورځ"
      >
        {Array.from({ length: maxDay }, (_, i) => i + 1).map((d) => (
          <option key={d} value={d}>
            {d}
          </option>
        ))}
      </select>
      <select
        className="form-input"
        value={j.jm}
        disabled={disabled}
        required={required}
        onChange={(e) => update({ jm: Number(e.target.value) })}
        style={{ flex: "1 1 100px" }}
        aria-label="میاشت"
      >
        {PASHTO_MONTHS.map((name, idx) => (
          <option key={name} value={idx + 1}>
            {name}
          </option>
        ))}
      </select>
      <select
        className="form-input"
        value={j.jy}
        disabled={disabled}
        required={required}
        onChange={(e) => update({ jy: Number(e.target.value) })}
        style={{ flex: "0 1 90px" }}
        aria-label="کال"
      >
        {YEAR_OPTIONS.map((y) => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </select>
    </div>
  );
}
