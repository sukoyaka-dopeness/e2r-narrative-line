import { useState } from "react";
import type { Dataset } from "../models/Dataset";
import type { HistoryDate } from "../services/HistoryService.ts";
import { useLanguage } from "../i18n/LanguageContext";
import { createCoreObjectId } from "../services/IdentifierService.ts";
import { formatQuantitativeCandidateDate, getQuantitativeTimeCandidates } from "../services/QuantitativeTimeCandidateService.ts";
import {
  applyQuantitativeOperation,
  canCreateQuantitative,
  getQuantitativeRelations,
  type ElapsedUnit,
  type Granularity,
  type QuantitativeOperation,
  type QuantitativePayload,
} from "../services/QuantitativeRelativeTimeService.ts";
import { CALENDAR_GRANULE_FEATURE, ELAPSED_OFFSET_FEATURE } from "../services/RelativeTimeService.ts";

type Props = {
  dataset: Dataset;
  eventId: string;
  onOperation: (operation: QuantitativeOperation) => void;
  onUseCandidate: (date: HistoryDate) => void;
  canUseCandidate: (date: HistoryDate) => boolean;
};

const granules: Granularity[] = ["year", "month", "day", "hour", "minute", "second"];
const units: ElapsedUnit[] = ["second", "minute", "hour"];
const jaUnits: Record<Granularity, string> = {
  year: "年", month: "月", day: "日", hour: "時", minute: "分", second: "秒",
};

function PayloadEditor({ initial, onSave, disabled = false, ja }: {
  initial: QuantitativePayload;
  onSave: (payload: QuantitativePayload) => void;
  disabled?: boolean;
  ja: boolean;
}) {
  const [granularity, setGranularity] = useState<Granularity>(initial.type === CALENDAR_GRANULE_FEATURE ? initial.granularity : "day");
  const [displacement, setDisplacement] = useState(initial.type === CALENDAR_GRANULE_FEATURE ? String(initial.displacement) : "1");
  const [direction, setDirection] = useState<"before" | "after">(initial.type === ELAPSED_OFFSET_FEATURE ? initial.direction : "after");
  const [value, setValue] = useState(initial.type === ELAPSED_OFFSET_FEATURE ? String(initial.value) : "1");
  const [unit, setUnit] = useState<ElapsedUnit>(initial.type === ELAPSED_OFFSET_FEATURE ? initial.unit : "hour");
  const number = initial.type === CALENDAR_GRANULE_FEATURE ? Number(displacement) : Number(value);
  const valid = initial.type === CALENDAR_GRANULE_FEATURE
    ? displacement.trim() !== "" && Number.isSafeInteger(number)
    : value.trim() !== "" && Number.isSafeInteger(number) && number > 0;
  return (
    <div className="quantitative-relative-time__fields">
      {initial.type === CALENDAR_GRANULE_FEATURE ? <>
        <label>{ja ? "Calendar 単位" : "Calendar granule"}
          <select value={granularity} onChange={(event) => setGranularity(event.target.value as Granularity)}>
            {granules.map((item) => <option key={item} value={item}>{ja ? jaUnits[item] : item}</option>)}
          </select>
        </label>
        <label>{ja ? "移動数（0＝同じ単位、負＝前）" : "Displacement (0=same granule, negative=previous)"}
          <input type="number" step="1" value={displacement} onChange={(event) => setDisplacement(event.target.value)} />
        </label>
      </> : <>
        <label>{ja ? "方向" : "Direction"}
          <select value={direction} onChange={(event) => setDirection(event.target.value as "before" | "after")}>
            <option value="before">{ja ? "前" : "Before"}</option>
            <option value="after">{ja ? "後" : "After"}</option>
          </select>
        </label>
        <label>{ja ? "経過量（正の整数）" : "Elapsed amount (positive integer)"}
          <input type="number" min="1" step="1" value={value} onChange={(event) => setValue(event.target.value)} />
        </label>
        <label>{ja ? "単位" : "Unit"}
          <select value={unit} onChange={(event) => setUnit(event.target.value as ElapsedUnit)}>
            {units.map((item) => <option key={item} value={item}>{ja ? jaUnits[item] : item}</option>)}
          </select>
        </label>
      </>}
      <button type="button" disabled={disabled || !valid} onClick={() => onSave(initial.type === CALENDAR_GRANULE_FEATURE
        ? { type: CALENDAR_GRANULE_FEATURE, granularity, displacement: number, ...(initial.calendar ? { calendar: initial.calendar } : {}) }
        : { type: ELAPSED_OFFSET_FEATURE, direction, value: number, unit })}>
        {ja ? "記録する" : "Record"}
      </button>
    </div>
  );
}

export function QuantitativeRelativeTimePanel({ dataset, eventId, onOperation, onUseCandidate, canUseCandidate }: Props) {
  const { language } = useLanguage();
  const ja = language === "ja";
  const [otherId, setOtherId] = useState("");
  const [feature, setFeature] = useState<QuantitativePayload["type"]>(CALENDAR_GRANULE_FEATURE);
  const [deletePending, setDeletePending] = useState<string | null>(null);
  const [feedback, setFeedback] = useState("");
  const relations = getQuantitativeRelations(dataset, eventId);
  const candidates = getQuantitativeTimeCandidates(dataset, eventId);
  const eventName = (id: string) => dataset.events.find((event) => event.id === id)?.name || id;
  const apply = (operation: QuantitativeOperation) => {
    const result = applyQuantitativeOperation(dataset, operation);
    if (!result.ok) {
      setFeedback(ja ? "このDatasetでは安全に変更できません。" : "This Dataset cannot be changed safely.");
      return;
    }
    onOperation(operation);
    setFeedback(ja ? "記録を更新しました。" : "Recorded assertion updated.");
    setDeletePending(null);
  };
  const initial: QuantitativePayload = feature === CALENDAR_GRANULE_FEATURE
    ? { type: CALENDAR_GRANULE_FEATURE, granularity: "day", displacement: 1 }
    : { type: ELAPSED_OFFSET_FEATURE, direction: "after", value: 1, unit: "hour" };
  return (
    <section className="quantitative-relative-time" aria-label={ja ? "量的な相対時間" : "Quantitative relative time"}>
      <details>
        <summary>{ja ? "量的な相対時間の記録と日時候補" : "Quantitative relative time and date candidates"} ({relations.length})</summary>
        <p>{ja ? "各Relationは独立した記録です。Calendar単位の移動と経過時間は別の意味です。" : "Each Relation is an independent recorded assertion. Calendar displacement and elapsed duration have different meanings."}</p>
        {relations.length > 0 && <ul className="quantitative-relative-time__list">
          {relations.map(({ relation, payload }) => <li key={relation.id}>
            <strong>{eventName(relation.sourceId)} → {eventName(relation.targetId)}</strong>
            <span> — {payload.type === CALENDAR_GRANULE_FEATURE
              ? (ja ? `Calendar ${jaUnits[payload.granularity]}単位で ${payload.displacement}` : `${payload.displacement} ${payload.granularity} (calendar granules)`)
              : (ja ? `経過時間: ${payload.value}${jaUnits[payload.unit]}${payload.direction === "after" ? "後" : "前"}` : `${payload.direction} ${payload.value} ${payload.unit} (elapsed)`)}
            </span>
            <details><summary>{ja ? "この記録を編集" : "Edit this assertion"}</summary>
              <PayloadEditor key={relation.id} initial={payload} ja={ja} onSave={(next) => apply({ type: "update", relationId: relation.id, payload: next })} />
              {deletePending === relation.id
                ? <><button type="button" className="danger-action" onClick={() => apply({ type: "delete", relationId: relation.id })}>{ja ? "削除を確定" : "Confirm delete"}</button>
                    <button type="button" onClick={() => setDeletePending(null)}>{ja ? "キャンセル" : "Cancel"}</button></>
                : <button type="button" onClick={() => setDeletePending(relation.id)}>{ja ? "この記録を削除" : "Delete this assertion"}</button>}
            </details>
          </li>)}
        </ul>}
        <details><summary>{ja ? "量的な記録を追加" : "Add quantitative assertion"}</summary>
          <p>{ja ? "このEventを基準（source）とし、選択したEventをtargetとして記録します。" : "This Event is the reference (source); the selected Event is the target."}</p>
          <label>{ja ? "対象Event" : "Target Event"}
            <select value={otherId} onChange={(event) => setOtherId(event.target.value)}>
              <option value="">{ja ? "選択してください" : "Select an Event"}</option>
              {dataset.events.filter(({ id }) => id !== eventId).map((event) => <option key={event.id} value={event.id}>{event.name || event.id} ({event.id})</option>)}
            </select>
          </label>
          <label>{ja ? "記録の種類" : "Assertion type"}
            <select value={feature} onChange={(event) => setFeature(event.target.value as QuantitativePayload["type"])}>
              <option value={CALENDAR_GRANULE_FEATURE}>{ja ? "Calendar 単位の移動" : "Calendar granule displacement"}</option>
              <option value={ELAPSED_OFFSET_FEATURE}>{ja ? "経過時間" : "Elapsed duration"}</option>
            </select>
          </label>
          <PayloadEditor key={feature} initial={initial} ja={ja} disabled={!otherId || !canCreateQuantitative(dataset, feature)}
            onSave={(payload) => apply({ type: "create", sourceId: eventId, targetId: otherId, payload, relationId: createCoreObjectId(dataset) })} />
          {!canCreateQuantitative(dataset, feature) && <p role="status">{ja ? "このDatasetでは安全に記録を追加できません。" : "Authoring is unavailable for this Dataset."}</p>}
        </details>
        {candidates.length > 0 && <div className="quantitative-relative-time__candidates">
          <h3>{ja ? "日時候補（未記録）" : "Date candidates (not recorded)"}</h3>
          <p>{ja ? "各候補は直接Relation 1本とRecorded Historyから計算しています。Time Zone / DSTは未考慮です。候補を選んでも保存されず、History欄で確認して通常の保存を行ってください。" : "Each candidate uses one direct Relation and recorded History. Time zone and DST are not evaluated. Choosing a candidate only fills the History editor; review it and save normally."}</p>
          <ul>{candidates.map((candidate) => <li key={candidate.relationId}>
            {formatQuantitativeCandidateDate(candidate.date)} — {eventName(candidate.anchorEventId)} · {candidate.relationId}
            {canUseCandidate(candidate.date)
              ? <button type="button" onClick={() => onUseCandidate(candidate.date)}>{ja ? "History欄へ入力" : "Use in History editor"}</button>
              : <span> {ja ? "（このHistory欄へ安全に入力できません）" : "(cannot safely fill this History editor)"}</span>}
          </li>)}</ul>
        </div>}
        {feedback && <p role="status">{feedback}</p>}
      </details>
    </section>
  );
}
