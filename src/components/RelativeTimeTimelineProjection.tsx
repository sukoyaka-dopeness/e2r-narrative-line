import type { Dataset } from "../models/Dataset";
import { useLanguage } from "../i18n/LanguageContext";
import { resolveEventIdentityPresentations } from "../services/EventIdentityPresentationService";
import { projectRelativeTimeForTimeline } from "../services/RelativeTimeService.ts";

type RelativeTimeTimelineProjectionProps = {
  dataset: Dataset;
  onEditEvent: (eventId: string) => void;
  showWhenEmpty?: boolean;
  diagnostic?: boolean;
};

export function RelativeTimeTimelineProjection({
  dataset,
  onEditEvent,
  showWhenEmpty = false,
  diagnostic = false,
}: RelativeTimeTimelineProjectionProps) {
  const { language } = useLanguage();
  const ja = language === "ja";
  const projection = projectRelativeTimeForTimeline(dataset);
  if (!showWhenEmpty && projection.groups.length === 0 && projection.conflictedEventIds.length === 0) {
    return null;
  }
  const projectedEventIds = new Set<string>();
  projection.groups.forEach((group) => {
    group.eventIdsByDisplayBand.forEach((band) => band.forEach((id) => projectedEventIds.add(id)));
  });
  projection.conflictedEventIds.forEach((group) => group.forEach((id) => projectedEventIds.add(id)));
  const projectedEvents = dataset.events.filter((event) => projectedEventIds.has(event.id));
  const identities = resolveEventIdentityPresentations(projectedEvents, {
    getPrimary: (event) => event.name || (ja ? "名前のないできごと" : "Unnamed Event"),
    getChronology: () => undefined,
  });
  const names = new Map([...identities].map(([eventId, identity]) => [
    eventId,
    identity.shortIdHint
      ? `${identity.primary} (${identity.shortIdHint})`
      : identity.primary,
  ]));
  const labelFor = (eventId: string) => names.get(eventId) ?? eventId;

  return (
    <details className="relative-time-timeline">
      <summary className="relative-time-timeline__summary">
        {ja ? "相対時間（補助表示）" : "Relative Time (supplementary view)"}
      </summary>
      <section className="relative-time-timeline__content" aria-labelledby="relative-time-timeline-heading">
        <h2 id="relative-time-timeline-heading" className="visually-hidden">
          {ja ? "記録された相対順序（表示用）" : "Recorded relative order (display only)"}
        </h2>
        <p className="relative-time-timeline__description">
          {ja
            ? "表示上のまとまりは、記録されたbefore/afterとその連鎖を表すためのものです。まとまりの位置は保存されず、日付・期間・追加の前後関係を意味しません。同じまとまりのできごと同士の前後は定まりません。"
            : "Display groups present recorded before/after assertions and their chains. Group positions are not saved and do not represent dates, durations, or extra assertions. Events in the same group have no recorded order relative to one another."}
        </p>
        {projection.groups.length === 0 && projection.conflictedEventIds.length === 0 && (
          <p>{diagnostic
            ? (ja ? "一部のRelative Time情報はこの補助表示で解釈できません。Dataset内の情報は保持されています。" : "Some Relative Time information cannot be interpreted in this supplementary view. The Dataset information remains preserved.")
            : (ja ? "表示できるRelative Time記録はまだありません。Event Detailから追加できます。" : "There are no Relative Time records to display yet. Add one from Event Detail.")}</p>
        )}
        {projection.conflictedEventIds.length > 0 && (
          <div role="status" className="relative-time-conflict">
            <p>
              {ja
                ? "循環する相対順序があるため、影響するグループの相対配置を表示しません。既存のTimeline表示を維持し、Datasetは変更していません。"
                : "A cyclic relative-order group was found. Its Relative Time projection is suppressed; the existing Timeline display remains, and the Dataset was not changed."}
            </p>
            {projection.conflictedEventIds.map((ids) => (
              <p key={ids.join("|")}>
                {ids.map(labelFor).join(ja ? "、" : ", ")}
              </p>
            ))}
          </div>
        )}
        {projection.groups.map((group, groupIndex) => (
          <div className="relative-time-projection-group" key={`${groupIndex}-${group.assertions[0]?.earlierEventId}`}>
            {group.eventIdsByDisplayBand.map((ids, bandIndex) => (
              <ul className="relative-time-display-band" key={`${groupIndex}-${bandIndex}`}>
                {ids.map((id) => (
                  <li key={id}>
                    <button className="relative-time-timeline__event" type="button" onClick={() => onEditEvent(id)}>
                      {labelFor(id)}
                    </button>
                  </li>
                ))}
              </ul>
            ))}
          </div>
        ))}
        {projection.groups.some((group) => group.assertions.length > 0) && (
          <section className="relative-time-recorded-relations" aria-labelledby="relative-time-recorded-relations-heading">
            <h3 id="relative-time-recorded-relations-heading" className="relative-time-recorded-relations__heading">
              {ja ? "記録された前後関係" : "Recorded before/after relations"}
            </h3>
            {projection.groups.map((group, groupIndex) => (
              <div className="relative-time-recorded-relations__group" key={`${groupIndex}-${group.assertions[0]?.earlierEventId}`}>
                <ul className="relative-time-recorded-assertions">
                  {group.assertions.map(({ earlierEventId, laterEventId }, index) => (
                    <li key={`${earlierEventId}-${laterEventId}-${index}`}>
                      <button className="relative-time-timeline__event" type="button" onClick={() => onEditEvent(earlierEventId)}>
                        {labelFor(earlierEventId)}
                      </button>
                      <span className="relative-time-relation-arrow">
                        <span className="relative-time-relation-arrow__wide" aria-hidden="true">→</span>
                        <span className="relative-time-relation-arrow__narrow" aria-hidden="true">↓</span>
                        <span className="visually-hidden">{ja ? "より前" : "before"}</span>
                      </span>
                      <button className="relative-time-timeline__event" type="button" onClick={() => onEditEvent(laterEventId)}>
                        {labelFor(laterEventId)}
                      </button>
                    </li>
                  ))}
                </ul>
                {group.incomparablePairs.length > 0 && (
                  <details>
                    <summary>{ja ? "順序が定まらない組み合わせ" : "Pairs with no recorded ordering path"}</summary>
                    <ul>
                      {group.incomparablePairs.map(([left, right]) => (
                        <li key={`${left}-${right}`}>
                          {labelFor(left)} — {labelFor(right)}
                        </li>
                      ))}
                    </ul>
                  </details>
                )}
              </div>
            ))}
          </section>
        )}
      </section>
    </details>
  );
}
