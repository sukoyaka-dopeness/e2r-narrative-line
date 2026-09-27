import { useMemo, useState } from "react";
import type { Dataset } from "../models/Dataset";
import { useLanguage } from "../i18n/LanguageContext";
import { formatRelativeTimeSummary, getPresentationMessages } from "../i18n/messages";
import {
  canStartRelativeTimeAuthoring,
  createRelativeTimeAssertion,
  getEditableRelativeTimeAssertions,
  updateRelativeTimeAssertion,
  type RelativeTimeOperation,
} from "../services/RelativeTimeService.ts";
import { createCoreObjectId } from "../services/IdentifierService.ts";

type RelativeTimeAuthoringPanelProps = {
  dataset: Dataset;
  eventId: string;
  onOperation: (operation: RelativeTimeOperation) => void;
};

type UpdateFeedbackKind = "contradiction" | "unsupported" | "updated";
type CreateFeedbackKind = "contradiction" | "unsupported" | "added";

export function RelativeTimeAuthoringPanel({
  dataset,
  eventId,
  onOperation,
}: RelativeTimeAuthoringPanelProps) {
  const { language } = useLanguage();
  const ja = language === "ja";
  const copy = getPresentationMessages(language);
  const event = dataset.events.find(({ id }) => id === eventId);
  const canAuthor = canStartRelativeTimeAuthoring(dataset);
  const assertions = useMemo(
    () => getEditableRelativeTimeAssertions(dataset, eventId),
    [dataset, eventId],
  );
  const [otherEventId, setOtherEventId] = useState("");
  const [currentBeforeOther, setCurrentBeforeOther] = useState(true);
  const [drafts, setDrafts] = useState<Record<string, boolean>>({});
  const [updateFeedback, setUpdateFeedback] = useState<Record<string, UpdateFeedbackKind>>({});
  const [createFeedback, setCreateFeedback] = useState<CreateFeedbackKind | "">("");
  const updateFeedbackText = (kind: UpdateFeedbackKind) => {
    if (kind === "contradiction") {
      return ja
        ? "反対向きの記録があるため変更できません。既存データは保持されています。"
        : "A direct opposite assertion prevents this change. Existing data was preserved.";
    }
    if (kind === "unsupported") {
      return ja
        ? "このDatasetでは相対時間を安全に編集できません。"
        : "Relative Time cannot be safely edited in this Dataset.";
    }
    return ja ? "選択した記録を更新しました。" : "Updated the selected recorded relation.";
  };
  const createFeedbackText = (kind: CreateFeedbackKind) => {
    if (kind === "contradiction") {
      return ja
        ? "反対向きの記録があるため追加できません。既存データは保持されています。"
        : "A direct opposite assertion prevents this addition. Existing data was preserved.";
    }
    if (kind === "unsupported") {
      return ja
        ? "このEventの組み合わせには追加できません。既存データは保持されています。"
        : "This Event pair cannot be edited in this Dataset. Existing data was preserved.";
    }
    return ja ? "新しい前後関係を追加しました。" : "Added a new time relation.";
  };
  const otherEvents = dataset.events.filter(
    (candidate) => candidate.id !== eventId,
  );

  if (!event || !canAuthor) return null;

  const applyUpdate = (relationId: string, value: boolean) => {
    const result = updateRelativeTimeAssertion(dataset, relationId, eventId, value);
    if (!result.ok) {
      setUpdateFeedback((current) => ({
        ...current,
        [relationId]: result.reason === "contradiction" ? "contradiction" : "unsupported",
      }));
      return;
    }
    onOperation({
      type: "update",
      relationId,
      currentEventId: eventId,
      currentBeforeOther: value,
    });
    setUpdateFeedback((current) => ({ ...current, [relationId]: "updated" }));
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
      setCreateFeedback(result.reason === "contradiction" ? "contradiction" : "unsupported");
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
    setCreateFeedback("added");
  };

  return (
    <div className="relative-time-authoring">
      <details className="relative-time-authoring__details relative-time-authoring__details--recorded">
        <summary>
          <span>{copy.relativeTimeRecordedHeading}</span>
          <span className="relative-time-authoring__count">
            {formatRelativeTimeSummary(language, assertions.length)}
          </span>
        </summary>
        <div className="relative-time-authoring__content">
          {assertions.length > 0 ? (
            <ul className="relative-time-assertions">
              {assertions.map(({ relation, otherEventId: otherId, currentBeforeOther: value }) => {
                const other = dataset.events.find(({ id }) => id === otherId);
                const otherName = other?.name || copy.unnamedEvent;
                const pairLabel = `${event.name || copy.unnamedEvent} / ${otherName}`;
                return (
                  <li key={relation.id} data-relative-time-relation-id={relation.id}>
                    <article className="relative-time-assertion">
                      <div className={`relative-time-assertion__sentence${ja ? " relative-time-assertion__sentence--ja" : ""}`}>
                        <span>{copy.relativeTimeCurrentEventIs}</span>
                        <span className="relative-time-assertion__reference">{otherName}</span>
                        {ja && <span>より</span>}
                        <select
                          aria-label={`${copy.relativeTimeCurrentEventIs}: ${pairLabel}`}
                          value={(drafts[relation.id] ?? value) ? "before" : "after"}
                          onChange={(change) => setDrafts((current) => ({
                            ...current,
                            [relation.id]: change.target.value === "before",
                          }))}
                        >
                          <option value="before">{copy.relativeTimeRecordedBeforeOption}</option>
                          <option value="after">{copy.relativeTimeRecordedAfterOption}</option>
                        </select>
                        <button
                          type="button"
                          aria-label={ja ? `${pairLabel}の記録を更新` : `Update recorded relation: ${pairLabel}`}
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
                          {ja ? "更新" : "Update"}
                        </button>
                      </div>
                      {updateFeedback[relation.id] && (
                        <p role="status" className="relative-time-boundary relative-time-assertion__feedback">
                          {updateFeedbackText(updateFeedback[relation.id])}
                        </p>
                      )}
                    </article>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p>{ja ? "記録済みの時間関係はありません。" : "No recorded time relations yet."}</p>
          )}
          {assertions.length > 0 && (
            <p className="relative-time-boundary">
              {(ja
                ? [
                    "この記録はできごとの前後関係を保存します。",
                    "日付やHistoryの順序は作成しません。",
                    "各記録は個別に保持され、逆向きの記録を自動作成したり、既存記録を統合したりしません。",
                  ]
                : [
                    "These records preserve qualitative Event relations.",
                    "They do not create dates or History ordering.",
                    "Each record remains separate; the app does not create inverse relations or merge records.",
                  ]
              ).map((sentence) => <span key={sentence}>{sentence}</span>)}
            </p>
          )}
        </div>
      </details>

      <details className="relative-time-authoring__details relative-time-authoring__details--create">
        <summary>{copy.relativeTimeAddOptional}</summary>
        <div className="relative-time-authoring__content">
          <p className="relative-time-create__boundary relative-time-boundary">
            {ja
              ? "同じできごとの組み合わせに新しい前後関係を追加できるのは1件までです。"
              : "Only one new relation can be added for an Event pair in this authoring slice."}
          </p>
          <div className={`relative-time-create__sentence${ja ? " relative-time-create__sentence--ja" : ""}`}>
            {!ja && <span>{copy.relativeTimeReferencePrefix}</span>}
            <select
              aria-label={copy.relativeTimeReferenceEvent}
              value={otherEventId}
              onChange={(change) => setOtherEventId(change.target.value)}
            >
              <option value="">{copy.relativeTimeReferencePlaceholder}</option>
              {otherEvents.map((candidate) => (
                <option key={candidate.id} value={candidate.id}>
                  {candidate.name || copy.unnamedEvent}
                </option>
              ))}
            </select>
            <span>{copy.relativeTimeReferenceSuffix}</span>
            <select
              aria-label={copy.relativeTimeCurrentEventIs}
              value={currentBeforeOther ? "before" : "after"}
              onChange={(change) => setCurrentBeforeOther(change.target.value === "before")}
            >
              <option value="before">{copy.relativeTimeBefore}</option>
              <option value="after">{copy.relativeTimeAfter}</option>
            </select>
            <button type="button" disabled={!otherEventId} onClick={addAssertion}>
              {ja ? "追加" : "Add"}
            </button>
          </div>
          {createFeedback && (
            <p role="status" className="relative-time-boundary relative-time-create__feedback">
              {createFeedbackText(createFeedback)}
            </p>
          )}
        </div>
      </details>
    </div>
  );
}
