/**
 * Gregorian <-> Jalali (Solar Hijri / "Hijri Shamsi") date helpers for the frontend.
 * Thin wrapper around the `jalaali-js` package (exact, tested conversion algorithm) —
 * do not hand-roll calendar math here.
 */
import { toJalaali, toGregorian, jalaaliMonthLength } from "jalaali-js";

export function gregorianToJalali(gy: number, gm: number, gd: number): { jy: number; jm: number; jd: number } {
  return toJalaali(gy, gm, gd);
}

/** Converts a Jalali (Solar Hijri) date to Gregorian. */
export function jalaliToGregorian(jy: number, jm: number, jd: number): { gy: number; gm: number; gd: number } {
  return toGregorian(jy, jm, jd);
}

/** Converts Jalali y/m/d to a Gregorian ISO date string ("YYYY-MM-DD") for storage/API use. */
export function isoFromJalali(jy: number, jm: number, jd: number): string {
  const { gy, gm, gd } = jalaliToGregorian(jy, jm, jd);
  return `${String(gy).padStart(4, "0")}-${String(gm).padStart(2, "0")}-${String(gd).padStart(2, "0")}`;
}

/** Converts an ISO date string ("YYYY-MM-DD" or a full ISO timestamp) to {jy, jm, jd}. */
export function jalaliFromIso(iso: string | null | undefined): { jy: number; jm: number; jd: number } | null {
  if (!iso) return null;
  const datePart = iso.slice(0, 10);
  const [y, m, d] = datePart.split("-").map(Number);
  if (!y || !m || !d) return null;
  return gregorianToJalali(y, m, d);
}

/** Converts an ISO date string ("YYYY-MM-DD" or a full ISO timestamp) to a formatted Jalali string. */
export function isoToJalaliString(iso: string | null | undefined): string {
  if (!iso) return "—";
  const j = jalaliFromIso(iso);
  if (!j) return iso.slice(0, 10);
  return `${j.jy}/${String(j.jm).padStart(2, "0")}/${String(j.jd).padStart(2, "0")}`;
}

/** Pashto names of the 12 Solar Hijri (Jalali) months, in order. */
export const PASHTO_MONTHS = [
  "وری",
  "غویی",
  "غبرګولی",
  "چنګاښ",
  "زمری",
  "وږی",
  "تله",
  "لړم",
  "لیندۍ",
  "مرغومی",
  "سلواغه",
  "کب",
] as const;

/** Number of days in a given Jalali month/year (handles leap years for month 12 / "کب"). */
export function daysInJalaliMonth(jy: number, jm: number): number {
  // Re-implemented via jalaali-js's own leap-year-aware month length.
  return jalaaliMonthLength(jy, jm);
}

/** Returns the current date as a Jalali {jy, jm, jd} triple. */
export function todayJalali(): { jy: number; jm: number; jd: number } {
  const now = new Date();
  return gregorianToJalali(now.getFullYear(), now.getMonth() + 1, now.getDate());
}

/** Returns today's date as a Gregorian ISO string ("YYYY-MM-DD"), for default form values. */
export function todayIso(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}
