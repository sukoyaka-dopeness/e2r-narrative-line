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
    setFeedback(
      ja
        ? "同じRelationの記録を更新しました。"
        : "Updated this assertion; its Relation ID is unchanged.",
    );
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
    setFeedback(
      ja
        ? "新しいRelationとして記録を追加しました。"
        : "Added a new assertion as a separate Relation.",
    );
  };

  return (
    <section className="relative-time-authoring" aria-labelledby="relative-time-heading">
      <h2 id="relative-time-heading">{ja ? "相対時間" : "Relative Time"}</h2>
      <p>
        {ja
          ? "記録するのはできごと間の定性的な順序です。日付、期間、Historyの順序は作成しません。"
          : "Record a qualitative relation between Events. This does not create dates, durations, or History ordering."}
      </p>
      <section aria-labelledby="relative-time-recorded-heading">
        <h3 id="relative-time-recorded-heading">
          {ja ? "記録された主張" : "Recorded assertions"}
        </h3>
        <p>
          {ja
            ? "各項目は独立したRelationです。編集は同じRelationの記録を置き換えます。新しいRelationの追加は下のフォームから行います。"
            : "Each item is one independent Relation. Editing replaces that same recorded assertion; use the separate form below to add a new Relation."}
        </p>
        {assertions.length > 0 ? (
          <ul className="relative-time-assertions">
            {assertions.map(({ relation, otherEventId: otherId, currentBeforeOther: value }) => {
              const other = dataset.events.find(({ id }) => id === otherId);
              return (
                <li key={relation.id} data-relative-time-relation-id={relation.id}>
                  <article className="relative-time-assertion">
                    <h4>{ja ? "記録された主張" : "Recorded assertion"}</h4>
                    <span>
                      {event.name || (ja ? "名前のないできごと" : "Unnamed Event")}
                      {value ? (ja ? " は " : " is before ") : (ja ? " は " : " is after ")}
                      {other?.name || (ja ? "名前のないできごと" : "Unnamed Event")}
                      <small> — Relation ID: {relation.id}</small>
                    </span>
                    <label>
                      <span className="visually-hidden">
                        {ja
                          ? `${event.name || "名前のないできごと"}と${other?.name || "名前のないできごと"}の順序（Relation ${relation.id}）`
                          : `Relative order for ${event.name || "Unnamed Event"} and ${other?.name || "Unnamed Event"} (Relation ${relation.id})`}
                      </span>
                      <select
                        aria-label={ja ? `Relation ${relation.id} の内容` : `Direction for Relation ${relation.id}`}
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
                      aria-label={ja ? `Relation ${relation.id} を更新` : `Save edit to Relation ${relation.id}`}
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
                    >
                      {ja ? "この記録を更新" : "Save this assertion"}
                    </button>
                  </article>
                </li>
              );
            })}
          </ul>
        ) : (
          <p>{ja ? "記録された主張はありません。" : "No recorded assertions yet."}</p>
        )}
      </section>
      <div className="relative-time-create">
        <h3>{ja ? "新しい主張を追加" : "Add a new assertion"}</h3>
        <p>
          {ja
            ? "新しい主張は別のRelationとして追加されます。この最初の入力範囲では、同じEvent pairへの新規Relative Time assertionは1件までです。"
            : "Adding creates a separate Relation. In this first authoring slice, only one new Relative Time assertion may be created for an Event pair."}
        </p>
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
          {ja ? "相対時間を追加" : "Add new assertion"}
        </button>
      </div>
      {feedback && <p role="status">{feedback}</p>}
      {assertions.length > 0 && (
        <p className="relative-time-boundary">
          {ja
            ? "各記録は個別に保持されます。アプリは逆向きのRelationを作成せず、既存の複数記録を統合しません。"
            : "Existing assertions remain separate and individually editable. Editing keeps the same Relation; adding creates a new one. The app does not create inverse Relations or merge assertions."}
        </p>
      )}
    </section>
  );
}
