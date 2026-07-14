/**
 * Gregorian <-> Jalali (Solar Hijri / "Hijri Shamsi") date helpers for the backend.
 * Thin wrapper around the `jalaali-js` package (exact, tested conversion algorithm) —
 * used to satisfy the brief's requirement that operational records and print views
 * show the Hijri Shamsi date, and that no Gregorian/English date appears in the UI.
 */
import { toJalaali, toGregorian } from "jalaali-js";

export interface JalaliDate {
  jy: number;
  jm: number;
  jd: number;
}

/** Converts a Gregorian y/m/d (m is 1-12) to its Jalali (Solar Hijri) equivalent. */
export function gregorianToJalali(gy: number, gm: number, gd: number): JalaliDate {
  return toJalaali(gy, gm, gd);
}

/** Converts a Jalali y/m/d back to a Gregorian Date. */
export function jalaliToGregorian(jy: number, jm: number, jd: number): Date {
  const { gy, gm, gd } = toGregorian(jy, jm, jd);
  return new Date(Date.UTC(gy, gm - 1, gd));
}

/** Converts a Jalali y/m/d to a Gregorian ISO date string ("YYYY-MM-DD"), for DATEONLY fields. */
export function isoFromJalali(jy: number, jm: number, jd: number): string {
  const { gy, gm, gd } = toGregorian(jy, jm, jd);
  return `${String(gy).padStart(4, "0")}-${String(gm).padStart(2, "0")}-${String(gd).padStart(2, "0")}`;
}

/** Converts an ISO date string ("YYYY-MM-DD" or a full ISO timestamp) to a formatted Jalali string. */
export function isoToJalaliString(iso: string | null | undefined): string {
  if (!iso) return "—";
  const datePart = iso.slice(0, 10);
  const [y, m, d] = datePart.split("-").map(Number);
  if (!y || !m || !d) return datePart;
  const { jy, jm, jd } = gregorianToJalali(y, m, d);
  return `${jy}/${String(jm).padStart(2, "0")}/${String(jd).padStart(2, "0")}`;
}
