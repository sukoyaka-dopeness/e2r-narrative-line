import { useState } from "react";
import type { Dataset } from "../models/Dataset";
import type { HistoryDate } from "../services/HistoryService.ts";
import { useLanguage } from "../i18n/LanguageContext";
import { createCoreObjectId } from "../services/IdentifierService.ts";
import { getQuantitativeTimeCandidates } from "../services/QuantitativeTimeCandidateService.ts";
import { calendarDisplacementFromInput, formatQuantitativeCandidateForDisplay, quantitativeCandidateBasis, quantitativeRelationLabel } from "../services/QuantitativeTimePresentationService.ts";
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

function PayloadEditor({ initial, onSave, disabled = false, ja, sourceName, targetName }: {
  initial: QuantitativePayload;
  onSave: (payload: QuantitativePayload) => void;
  disabled?: boolean;
  ja: boolean;
  sourceName: string;
  targetName: string;
}) {
  const [granularity, setGranularity] = useState<Granularity>(initial.type === CALENDAR_GRANULE_FEATURE ? initial.granularity : "day");
  const [magnitude, setMagnitude] = useState(initial.type === CALENDAR_GRANULE_FEATURE ? String(Math.abs(initial.displacement) || 1) : "1");
  const [granuleDirection, setGranuleDirection] = useState<"before" | "same" | "after">(
    initial.type === CALENDAR_GRANULE_FEATURE && initial.displacement === 0 ? "same"
      : initial.type === CALENDAR_GRANULE_FEATURE && initial.displacement < 0 ? "before" : "after",
  );
  const [direction, setDirection] = useState<"before" | "after">(initial.type === ELAPSED_OFFSET_FEATURE ? initial.direction : "after");
  const [value, setValue] = useState(initial.type === ELAPSED_OFFSET_FEATURE ? String(initial.value) : "1");
  const [unit, setUnit] = useState<ElapsedUnit>(initial.type === ELAPSED_OFFSET_FEATURE ? initial.unit : "hour");
  const number = initial.type === CALENDAR_GRANULE_FEATURE ? Number(magnitude) : Number(value);
  const valid = initial.type === CALENDAR_GRANULE_FEATURE
    ? granuleDirection === "same" || (magnitude.trim() !== "" && Number.isSafeInteger(number) && number > 0)
    : value.trim() !== "" && Number.isSafeInteger(number) && number > 0;
  return (
    <div className="quantitative-relative-time__fields">
      {initial.type === CALENDAR_GRANULE_FEATURE ? <>
        <span>{ja ? `${targetName} は ${sourceName} と比べて` : "By"}</span>
        <label className="quantitative-relative-time__inline-control">
          <span className="visually-hidden">{ja ? "暦の単位" : "Calendar granule"}</span>
          <select aria-label={ja ? "暦の単位" : "Calendar granule"} value={granularity} onChange={(event) => setGranularity(event.target.value as Granularity)}>
            {granules.map((item) => <option key={item} value={item}>{ja ? jaUnits[item] : item}</option>)}
          </select>
        </label>
        <span>{ja ? "で見ると" : `granules, ${targetName} is`}</span>
        {granuleDirection !== "same" && <>
          <label className="quantitative-relative-time__inline-control">
            <span className="visually-hidden">{ja ? "移動する数" : "Number of granule steps"}</span>
            <input aria-label={ja ? "移動する数" : "Number of granule steps"} type="number" min="1" step="1" value={magnitude} onInput={(event) => setMagnitude(event.currentTarget.value)} />
          </label>
          <span>{ja ? "つ" : "step(s)"}</span>
        </>}
        <label className="quantitative-relative-time__inline-control">
          <span className="visually-hidden">{ja ? "前後の方向" : "Granule direction"}</span>
          <select aria-label={ja ? "前後の方向" : "Granule direction"} value={granuleDirection} onChange={(event) => setGranuleDirection(event.target.value as "before" | "same" | "after")}>
            <option value="before">{ja ? "前" : "before"}</option>
            <option value="same">{ja ? "同じ" : "in the same granule as"}</option>
            <option value="after">{ja ? "後" : "after"}</option>
          </select>
        </label>
        <span>{ja ? "です。" : `${sourceName}.`}</span>
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
        ? { type: CALENDAR_GRANULE_FEATURE, granularity, displacement: calendarDisplacementFromInput(number, granuleDirection), ...(initial.calendar ? { calendar: initial.calendar } : {}) }
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
  const [candidatesOpen, setCandidatesOpen] = useState(true);
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
        <summary>{ja ? "量的な相対時間" : "Quantitative relative time"}</summary>
        <p>{ja ? "各時間関係は独立した記録です。暦の単位で見た前後と、経過時間は別の意味です。" : "Each Relation is an independent recorded assertion. Calendar-granule displacement and elapsed time have different meanings."}</p>
        <div className="quantitative-relative-time__recorded">
          <h3>{ja ? "記録済みの時間関係" : "Recorded time relations"}</h3>
        {relations.length > 0 && <ul className="quantitative-relative-time__list">
          {relations.map(({ relation, payload }) => <li key={relation.id}>
            <strong>{quantitativeRelationLabel(payload, relation.targetId === eventId,
              eventName(relation.sourceId === eventId ? relation.targetId : relation.sourceId), language)}</strong>
            <details><summary>{ja ? "この記録を編集" : "Edit this assertion"}</summary>
              <PayloadEditor key={relation.id} initial={payload} ja={ja}
                sourceName={eventName(relation.sourceId)} targetName={eventName(relation.targetId)}
                onSave={(next) => apply({ type: "update", relationId: relation.id, payload: next })} />
              <div className="quantitative-relative-time__delete-action">
              {deletePending === relation.id
                ? <><button type="button" className="danger-action" onClick={() => apply({ type: "delete", relationId: relation.id })}>{ja ? "削除を確定" : "Confirm delete"}</button>
                    <button type="button" onClick={() => setDeletePending(null)}>{ja ? "キャンセル" : "Cancel"}</button></>
                : <button type="button" className="danger-action" onClick={() => setDeletePending(relation.id)}>{ja ? "この記録を削除" : "Delete this assertion"}</button>}
              </div>
            </details>
          </li>)}
        </ul>}
        <details><summary>{ja ? "量的な時間関係を追加" : "Add quantitative time relation"}</summary>
          <p>{ja ? "このできごとを基準に、選択したできごととの時間関係を記録します。" : "Record one time relation from this Event to the selected Event."}</p>
          <label>{ja ? "対象Event" : "Target Event"}
            <select value={otherId} onChange={(event) => setOtherId(event.target.value)}>
              <option value="">{ja ? "選択してください" : "Select an Event"}</option>
              {dataset.events.filter(({ id }) => id !== eventId).map((event) => <option key={event.id} value={event.id}>{event.name || event.id} ({event.id})</option>)}
            </select>
          </label>
          <label>{ja ? "記録の種類" : "Assertion type"}
            <select value={feature} onChange={(event) => setFeature(event.target.value as QuantitativePayload["type"])}>
              <option value={CALENDAR_GRANULE_FEATURE}>{ja ? "暦の単位で見た前後" : "Calendar granule displacement"}</option>
              <option value={ELAPSED_OFFSET_FEATURE}>{ja ? "経過時間" : "Elapsed duration"}</option>
            </select>
          </label>
          <PayloadEditor key={feature} initial={initial} ja={ja}
            sourceName={eventName(eventId)} targetName={otherId ? eventName(otherId) : (ja ? "対象のできごと" : "The selected Event")}
            disabled={!otherId || !canCreateQuantitative(dataset, feature)}
            onSave={(payload) => apply({ type: "create", sourceId: eventId, targetId: otherId, payload, relationId: createCoreObjectId(dataset) })} />
          {!canCreateQuantitative(dataset, feature) && <p role="status">{ja ? "このDatasetでは安全に記録を追加できません。" : "Authoring is unavailable for this Dataset."}</p>}
        </details>
        </div>
        {candidates.length > 0 && <details className="quantitative-relative-time__candidates" open={candidatesOpen}
          onToggle={(event) => setCandidatesOpen(event.currentTarget.open)}>
          <summary>{ja ? "日時候補（未記録）" : "Date/time candidates (not recorded)"}
            <span className="relative-time-authoring__count">{ja ? `${candidates.length}件` : `${candidates.length}`}</span>
          </summary>
          <div className="quantitative-relative-time__candidate-content">
          <p>{ja ? "相対時間の記録と記録済みの日時から計算した、まだ日時として保存していない候補です。タイムゾーン / サマータイムは考慮していません。候補を選んでも保存されません。日時編集欄で確認し、通常の保存を行ってください。" : "These candidates are calculated from a direct Relative Time Relation and Recorded History. Time Zone / DST are not evaluated. Selecting a candidate does not save it. Review it in the History editor and use the normal Save action."}</p>
          <ul>{candidates.map((candidate) => <li key={candidate.relationId}>
            <strong>{formatQuantitativeCandidateForDisplay(candidate.date, language).value}</strong>
            {formatQuantitativeCandidateForDisplay(candidate.date, language).precision &&
              <span className="quantitative-relative-time__precision">{formatQuantitativeCandidateForDisplay(candidate.date, language).precision}</span>}
            <span className="quantitative-relative-time__basis">{quantitativeCandidateBasis(candidate.payload,
              dataset.relations.find(({ id }) => id === candidate.relationId)?.targetId === eventId,
              eventName(candidate.anchorEventId), language)}</span>
            {canUseCandidate(candidate.date)
              ? <button type="button" onClick={() => onUseCandidate(candidate.date)}>{ja ? "日時を確認・編集" : "Review in History"}</button>
              : <span>{ja ? "この候補は現在の日時編集欄には安全に入力できません。" : "This candidate cannot be safely entered into the current History editor."}</span>}
          </li>)}</ul>
          </div>
        </details>}
        {feedback && <p role="status">{feedback}</p>}
      </details>
    </section>
  );
}
