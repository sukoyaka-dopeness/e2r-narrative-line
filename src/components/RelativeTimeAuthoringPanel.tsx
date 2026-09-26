import { useMemo, useState } from "react";
import type { Dataset } from "../models/Dataset";
import { useLanguage } from "../i18n/LanguageContext";
import {
  canStartRelativeTimeAuthoring,
  createRelativeTimeAssertion,
  getEditableRelativeTimeAssertions,
  isRelativeTimeEligibleEvent,
  supportsRelativeTimeAuthoring,
  updateRelativeTimeAssertion,
  type RelativeTimeOperation,
} from "../services/RelativeTimeService.ts";
import { createCoreObjectId } from "../services/IdentifierService.ts";

type RelativeTimeAuthoringPanelProps = {
  dataset: Dataset;
  eventId: string;
  onOperation: (operation: RelativeTimeOperation) => void;
};

export function RelativeTimeAuthoringPanel({
  dataset,
  eventId,
  onOperation,
}: RelativeTimeAuthoringPanelProps) {
  const { language } = useLanguage();
  const ja = language === "ja";
  const event = dataset.events.find(({ id }) => id === eventId);
  const canAuthor = canStartRelativeTimeAuthoring(dataset);
  const eligible = event !== undefined && isRelativeTimeEligibleEvent(dataset, event);
  const assertions = useMemo(
    () => getEditableRelativeTimeAssertions(dataset, eventId),
    [dataset, eventId],
  );
  const [otherEventId, setOtherEventId] = useState("");
  const [currentBeforeOther, setCurrentBeforeOther] = useState(true);
  const [drafts, setDrafts] = useState<Record<string, boolean>>({});
  const [feedback, setFeedback] = useState("");
  const otherEvents = dataset.events.filter(
    (candidate) => candidate.id !== eventId &&
      isRelativeTimeEligibleEvent(dataset, candidate),
  );

  if (!event || (!eligible && !supportsRelativeTimeAuthoring(dataset))) return null;
  if (!eligible) {
    return (
      <section className="relative-time-authoring" aria-labelledby="relative-time-heading">
        <h2 id="relative-time-heading">{ja ? "相対時間" : "Relative Time"}</h2>
        <p role="status">
          {ja
            ? "日付またはHistory情報があるできごとでは、この最初の入力機能を利用できません。既存データは変更されません。"
            : "This first authoring slice is unavailable for Events with dates or History data. Existing data is unchanged."}
        </p>
      </section>
    );
  }
  if (!canAuthor) return null;

  const applyUpdate = (relationId: string, value: boolean) => {
    const result = updateRelativeTimeAssertion(dataset, relationId, eventId, value);
    if (!result.ok) {
      setFeedback(result.reason === "contradiction"
        ? (ja ? "反対向きの記録があるため変更できません。既存データは保持されています。" : "A direct opposite assertion prevents this change. Existing data was preserved.")
        : (ja ? "このDatasetでは相対時間を安全に編集できません。" : "Relative Time cannot be safely edited in this Dataset."));
      return;
    }
    onOperation({
      type: "update",
      relationId,
      currentEventId: eventId,
      currentBeforeOther: value,
    });
    setFeedback(ja ? "相対時間を保存しました。" : "Relative Time saved.");
  };

  const addAssertion = () => {
    const relationId = createCoreObjectId(dataset);
    const result = createRelativeTimeAssertion(
      dataset,
      eventId,
      otherEventId,
      currentBeforeOther,
      relationId,
    );
    if (!result.ok) {
      setFeedback(result.reason === "contradiction"
        ? (ja ? "反対向きの記録があるため追加できません。既存データは保持されています。" : "A direct opposite assertion prevents this addition. Existing data was preserved.")
        : (ja ? "このEventの組み合わせには追加できません。既存データは保持されています。" : "This Event pair cannot be edited in this Dataset. Existing data was preserved."));
      return;
    }
    onOperation({
      type: "create",
      currentEventId: eventId,
      otherEventId,
      currentBeforeOther,
      relationId,
    });
    setOtherEventId("");
    setFeedback(ja ? "相対時間を保存しました。" : "Relative Time saved.");
  };

  return (
    <section className="relative-time-authoring" aria-labelledby="relative-time-heading">
      <h2 id="relative-time-heading">{ja ? "相対時間" : "Relative Time"}</h2>
      <p>
        {ja
          ? "記録するのはできごと間の定性的な順序です。日付、期間、Historyの順序は作成しません。"
          : "Record a qualitative relation between Events. This does not create dates, durations, or History ordering."}
      </p>
      {assertions.length > 0 && (
        <ul className="relative-time-assertions">
          {assertions.map(({ relation, otherEventId: otherId, currentBeforeOther: value }) => {
            const other = dataset.events.find(({ id }) => id === otherId);
            return (
              <li key={relation.id}>
                <span>
                  {event.name || (ja ? "名前のないできごと" : "Unnamed Event")}
                  {value ? (ja ? " は " : " is before ") : (ja ? " は " : " is after ")}
                  {other?.name || (ja ? "名前のないできごと" : "Unnamed Event")}
                  <small> ({relation.id.slice(0, 8)})</small>
                </span>
                <label>
                  <span className="visually-hidden">
                    {ja
                      ? `${event.name || "名前のないできごと"}と${other?.name || "名前のないできごと"}の順序（Relation ${relation.id}）`
                      : `Relative order for ${event.name || "Unnamed Event"} and ${other?.name || "Unnamed Event"} (Relation ${relation.id})`}
                  </span>
                  <select
                    value={(drafts[relation.id] ?? value) ? "before" : "after"}
                    onChange={(change) => setDrafts((current) => ({
                      ...current,
                      [relation.id]: change.target.value === "before",
                    }))}
                  >
                    <option value="before">{ja ? "このできごとが先" : "This Event is before"}</option>
                    <option value="after">{ja ? "このできごとが後" : "This Event is after"}</option>
                  </select>
                </label>
                <button
                  type="button"
                  aria-label={ja ? `Relation ${relation.id}を更新` : `Update Relation ${relation.id}`}
                  disabled={(drafts[relation.id] ?? value) === value}
                  onClick={() => {
                    const next = drafts[relation.id] ?? value;
                    applyUpdate(relation.id, next);
                    setDrafts((current) => {
                      const nextDrafts = { ...current };
                      delete nextDrafts[relation.id];
                      return nextDrafts;
                    });
                  }}
                >{ja ? "この記録を更新" : "Update this assertion"}</button>
              </li>
            );
          })}
        </ul>
      )}
      <div className="relative-time-create">
        <label>
          {ja ? "相手のできごと" : "Other Event"}
          <select value={otherEventId} onChange={(change) => setOtherEventId(change.target.value)}>
            <option value="">{ja ? "選択してください" : "Choose an Event"}</option>
            {otherEvents.map((candidate) => (
              <option key={candidate.id} value={candidate.id}>
                {candidate.name || (ja ? "名前のないできごと" : "Unnamed Event")}
              </option>
            ))}
          </select>
        </label>
        <label>
          {ja ? "順序" : "Position"}
          <select
            value={currentBeforeOther ? "before" : "after"}
            onChange={(change) => setCurrentBeforeOther(change.target.value === "before")}
          >
            <option value="before">{ja ? "このできごとが先" : "This Event is before"}</option>
            <option value="after">{ja ? "このできごとが後" : "This Event is after"}</option>
          </select>
        </label>
        <button type="button" disabled={!otherEventId} onClick={addAssertion}>
          {ja ? "相対時間を追加" : "Add Relative Time"}
        </button>
      </div>
      {feedback && <p role="status">{feedback}</p>}
      {assertions.length > 0 && (
        <p className="relative-time-boundary">
          {ja
            ? "各記録は個別に保持されます。アプリは逆向きのRelationを作成せず、既存の複数記録を統合しません。"
            : "Assertions remain separate. The app does not create inverse Relations or merge existing assertions."}
        </p>
      )}
    </section>
  );
}
