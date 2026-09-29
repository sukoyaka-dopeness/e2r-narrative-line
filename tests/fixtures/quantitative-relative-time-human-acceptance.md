# QRT Human Browser Acceptance fixture

This local test fixture is for NarrativeLine browser review. It is not a public sample or a canonical Dataset:
[`quantitative-relative-time-human-acceptance.e2r.json`](./quantitative-relative-time-human-acceptance.e2r.json).

Start the local NarrativeLine app with `npm.cmd run dev`, then use **More → Open E2R Dataset** (JA: **その他 → E2R Datasetを開く**) to select the JSON file. Use the language control to review JA and EN. Reopen the file to restore the fixture after any authoring or History save exercise.

| Event | Browser review evidence |
| --- | --- |
| Long event name beginning “A very long event name” | Six separate direct candidates: `+1 day`, `-2 day`, `0 month`, elapsed `2 hours after`, and two independent Relations from same-name anchors. Candidate dates include 2024-02-01, month-precision 2024-02, 2024-02-01 01:00, and 2024-02-02. |
| Reverse source with one candidate | The Relation points from this undated source to the dated target. Its `+1 day` displacement produces a 2024-02-29 candidate on the source side. |
| Single candidate event | `+1 month` from 2024-01-31 gives the month-precision candidate 2024-02. It is a calendar position, not an elapsed-days addition. |
| Recorded event with an additional candidate | The recorded 2024-02-05 date remains the Timeline position while a different 2024-02-01 candidate is supplementary. This difference is intentional for review. |
| Two “Anchor” Events | Their different recorded dates distinguish them by chronology. |
| Two “Twin anchor” Events | Their equal names and dates require the existing presentation-only short-ID hints. |

For the Timeline disclosure, select another Event, then open and close this Event's candidate summary with a pointer and keyboard. The other Event should stay selected. Click the card body to select this Event normally. Compare the secondary summary and expanded content with **Review display order** where that diagnostic exists in the current acceptance Dataset.

In JA and EN, inspect the long-name card, the one-candidate card, and an Event Detail relation from each endpoint at ordinary and narrow widths. The candidate section in Event Detail starts expanded. Its Review date/time action only prefills the editor; use normal Save to record History, or discard the draft to leave History unchanged. Browser legibility, wrapping, focus, and interaction feel remain Human judgments.
