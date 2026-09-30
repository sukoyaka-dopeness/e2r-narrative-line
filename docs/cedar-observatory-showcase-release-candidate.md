# Cedar Observatory showcase — local release candidate

Date: 2026-09-30
Status: NarrativeLine `0.2.0` application-owned sample candidate; sample-data policy selected, Human Browser Acceptance and publication pending

## Role and content

The new [English](../src/sample/cedar-observatory-showcase.en.e2r.json) and
[Japanese](../src/sample/cedar-observatory-showcase.ja.e2r.json) files are a
fictional neighborhood observatory's open-night story. They are separate from
the existing Berlin Wall onboarding sample and from E2R-SPEC canonical samples
and Hub Gallery entries. Home offers a second supplemental action; it opens
either locale through the existing Dataset replacement path. Switching the
application language chooses the corresponding sample **when opening it**; it
does not translate an already active Dataset or silently replace its content.

Twelve Events and six Entities form a small Timeline and a useful relationship
graph. Eight Events have Recorded History: the open-night decision, volunteer
roles, route planning and safety check, the on-day briefing and welcome-desk
preparation, opening, and closing. Dome preparation and equipment checking
remain undated but connected by qualitative before/after relations.
Sending invitations has a direct **next calendar month** relation to a dated
planning Event; the first sky tour has a direct **two elapsed hours after**
relation to a dated opening Event. The resulting June 2026 month and 20:00
date/time are unrecorded Candidates. They do not move an Event into a Recorded
History position or become History until a person opens the date/time editor
and saves. Time zone and daylight-saving time remain unevaluated.

No Perspective payload was added merely to feature-list the sample. The story
is naturally chronological, while NarrativeLine still offers session-only
display-order editing to demonstrate its existing Perspective writer. Including
an authored non-temporal Perspective sequence in this sample would require a
separate content choice and would presently expose the expected Validator 0.7.0
Perspective recognition/availability diagnostics. Neither consumer support nor
the existing Perspective contract is changed here.

## Choice and provenance

A new application-owned story keeps Lighthouse and Ashen Crown canonical/public
content, roles, and Hub links intact. It avoids turning the QRT acceptance
fixture's deliberately long and duplicate names into showcase material. This
fictional story, names, descriptions, data structure, and EN/JA versions were
created with Codex for this checkpoint under Human direction. No factual
event chronology, third-party prose, images, or external assets were used.
This is an authorship/provenance statement about the local candidate, not a
claim of completed Human content review.

The Human selected the **same E2R sample-data licensing/provenance policy**
used for other eligible project-created E2R samples. The scoped
[sample content notice](../src/sample/README.md) applies the CC0 1.0 bucket to
eligible project-created content of this pair only where the project can grant
rights; third-party/imported material is excluded. The NarrativeLine software's
MIT license does not automatically license Dataset content. No external story,
text, or asset dependency has been identified in the current files. The
[E2R-SPEC provenance record](../../e2r-spec/docs/public-samples/public-sample-provenance.md)
lists this pair separately as an **unreleased candidate**, without adding it
to the five-family Gallery ledger. No Dataset-level `metadata.license` field,
Hub entry, LiaisonScape sample mirror, or canonical cross-app authority is
created here.

## Local evidence and release gates

The paired files have matching canonical object IDs and topology. The current
NarrativeLine import/export path uses Validator 0.7.0 and round-trips both
without diagnostics; focused tests assert the Calendar and elapsed Candidate
values, unrecorded targets, qualitative relations, and Home opening path.
This is automated evidence, not Human acceptance of story clarity or graph
readability in a real browser. The final verification record is in
[the release preparation result](release-preparation-0.2.0-result.md).

LiaisonScape's current `loadDataset` accepts the EN file and its Entity graph
contains six nodes and six Entity-to-Entity edges. It reports 22 Event-related
edges outside that Entity graph. Its pinned Validator **0.6.0** reports one
`specification_version_unsupported` warning for the Relative Time `0.2.0`
declaration, while NarrativeLine's Validator **0.7.0** accepts the same file
without diagnostics. The older consumer's warning must not be hidden or
described as full Relative Time interoperability. No LiaisonScape dependency
or runtime change is included in this NarrativeLine candidate.

Before public deployment, Human review is needed for (1) story/content and
EN/JA wording and (2) visible Timeline/Home presentation. If that review
finds unrecorded external material or a new rights issue, return to Human
stewardship before inclusion. A
LiaisonScape graph check can support readability, but does not promote this
sample to canonical cross-app status. The public-write approval remains a
separate release transaction.
