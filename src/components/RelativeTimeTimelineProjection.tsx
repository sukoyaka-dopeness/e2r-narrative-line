import type { Dataset } from "../models/Dataset";
import { useLanguage } from "../i18n/LanguageContext";
import { projectRelativeTimeForTimeline } from "../services/RelativeTimeService.ts";

type RelativeTimeTimelineProjectionProps = {
  dataset: Dataset;
  onEditEvent: (eventId: string) => void;
};

export function RelativeTimeTimelineProjection({
  dataset,
  onEditEvent,
}: RelativeTimeTimelineProjectionProps) {
  const { language } = useLanguage();
  const ja = language === "ja";
  const projection = projectRelativeTimeForTimeline(dataset);
  if (projection.groups.length === 0 && projection.conflictedEventIds.length === 0) {
    return null;
  }
  const names = new Map(dataset.events.map((event) => [
    event.id,
    event.name || (ja ? "名前のないできごと" : "Unnamed Event"),
  ]));

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
            ? "表示帯は記録されたbefore/afterとその連鎖に基づく配置です。帯の番号や間隔は保存されず、日付・期間・追加の順序を意味しません。同じ帯の中のできごとの順序は定まりません。"
            : "Display bands are a presentation projection of recorded before/after assertions and their chains. Band positions are not saved and do not represent dates, durations, or extra assertions. Events in the same band are unordered."}
        </p>
        {projection.conflictedEventIds.length > 0 && (
          <div role="status" className="relative-time-conflict">
            <p>
              {ja
                ? "循環する相対順序があるため、影響するグループの相対配置を表示しません。既存のTimeline表示を維持し、Datasetは変更していません。"
                : "A cyclic relative-order group was found. Its Relative Time projection is suppressed; the existing Timeline display remains, and the Dataset was not changed."}
            </p>
            {projection.conflictedEventIds.map((ids) => (
              <p key={ids.join("|")}>
                {ids.map((id) => names.get(id) ?? id).join(ja ? "、" : ", ")}
              </p>
            ))}
          </div>
        )}
        {projection.groups.map((group, groupIndex) => (
          <div className="relative-time-projection-group" key={`${groupIndex}-${group.assertions[0]?.earlierEventId}`}>
            {group.eventIdsByDisplayBand.map((ids, bandIndex) => (
              <div className="relative-time-display-band" key={`${groupIndex}-${bandIndex}`}>
                <span className="relative-time-display-band__label">
                  {ja ? "表示用の配置" : "Display placement"}
                </span>
                <ul>
                  {ids.map((id) => (
                    <li key={id}>
                      <button className="relative-time-timeline__event" type="button" onClick={() => onEditEvent(id)}>
                        {names.get(id) ?? id}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            <ul className="relative-time-recorded-assertions">
              {group.assertions.map(({ earlierEventId, laterEventId }, index) => (
                <li key={`${earlierEventId}-${laterEventId}-${index}`}>
                  <button className="relative-time-timeline__event" type="button" onClick={() => onEditEvent(earlierEventId)}>
                    {names.get(earlierEventId) ?? earlierEventId}
                  </button>
                  <span aria-label={ja ? "より前" : "before"}> → </span>
                  <button className="relative-time-timeline__event" type="button" onClick={() => onEditEvent(laterEventId)}>
                    {names.get(laterEventId) ?? laterEventId}
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
                      {names.get(left) ?? left} — {names.get(right) ?? right}
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </div>
        ))}
      </section>
    </details>
  );
}
