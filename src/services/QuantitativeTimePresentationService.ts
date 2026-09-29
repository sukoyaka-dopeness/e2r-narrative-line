import type { HistoryDate } from "./HistoryService.ts";
import type { QuantitativePayload } from "./QuantitativeRelativeTimeService.ts";

type Language = "ja" | "en";

export function calendarDisplacementFromInput(magnitude: number, direction: "before" | "same" | "after"): number {
  return direction === "same" ? 0 : direction === "before" ? -magnitude : magnitude;
}

const granules = {
  year: ["年", "year"], month: ["月", "month"], day: ["日", "day"],
  hour: ["時", "hour"], minute: ["分", "minute"], second: ["秒", "second"],
} as const;

export function quantitativeRelationMovement(
  payload: QuantitativePayload, currentIsTarget: boolean, language: Language,
): string {
  const ja = language === "ja";
  if (payload.type === "elapsed-offset") {
    const after = (payload.direction === "after") === currentIsTarget;
    if (ja) return `${payload.value}${granules[payload.unit][0]}間${after ? "後" : "前"}`;
    return `${payload.value} ${payload.unit}${payload.value === 1 ? "" : "s"} ${after ? "after" : "before"}`;
  }
  const steps = currentIsTarget ? payload.displacement : -payload.displacement;
  const [jaGranule, enGranule] = granules[payload.granularity];
  if (steps === 0) return ja ? `同じ${jaGranule}` : `Same ${enGranule} granule`;
  if (Math.abs(steps) === 1) {
    return ja ? `${steps > 0 ? "次" : "前"}の${jaGranule}` : `${steps > 0 ? "Next" : "Previous"} ${enGranule}`;
  }
  return ja
    ? `${jaGranule}で見ると${Math.abs(steps)}つ${steps > 0 ? "後" : "前"}`
    : `${enGranule[0].toUpperCase()}${enGranule.slice(1)} granule, ${Math.abs(steps)} steps ${steps > 0 ? "ahead" : "back"}`;
}

export function quantitativeRelationLabel(
  payload: QuantitativePayload, currentIsTarget: boolean, otherName: string, language: Language,
): string {
  const movement = quantitativeRelationMovement(payload, currentIsTarget, language);
  return language === "ja" ? movement.startsWith("同じ") ? `${otherName} と${movement}`
    : payload.type === "calendar-granule-relation" && Math.abs(payload.displacement) > 1
      ? `${otherName} より、${movement}` : `${otherName} の${movement}`
    : payload.type === "elapsed-offset" ? `${movement} ${otherName}` : `${movement} relative to ${otherName}`;
}

export function quantitativeCandidateBasis(
  payload: QuantitativePayload, currentIsTarget: boolean, anchorName: string, language: Language,
): string {
  const movement = quantitativeRelationMovement(payload, currentIsTarget, language);
  return language === "ja"
    ? `${anchorName} の記録日時と「${movement}」から計算`
    : `Calculated from ${anchorName}'s recorded time and “${movement.toLowerCase()}”.`;
}

export function formatQuantitativeCandidateForDisplay(date: HistoryDate, language: Language): {
  value: string; precision: string | undefined;
} {
  const ja = language === "ja";
  const year = date.year ?? "";
  const value = ja
    ? `${year}年${date.month === undefined ? "" : `${date.month}月`}${date.day === undefined ? "" : `${date.day}日`}`
    : `${year}${date.month === undefined ? "" : `-${String(date.month).padStart(2, "0")}`}${date.day === undefined ? "" : `-${String(date.day).padStart(2, "0")}`}`;
  const time = date.hour === undefined ? "" : ` ${String(date.hour).padStart(2, "0")}${date.minute === undefined ? "" : `:${String(date.minute).padStart(2, "0")}`}${date.second === undefined ? "" : `:${String(date.second).padStart(2, "0")}`}`;
  const precision = date.month === undefined ? (ja ? "年単位の候補" : "Year precision candidate")
    : date.day === undefined ? (ja ? "月単位の候補" : "Month precision candidate") : undefined;
  return { value: value + time, precision };
}
