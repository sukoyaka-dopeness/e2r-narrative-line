# Cedar Observatory showcase — local release candidate

Date: 2026-09-30
Original status (2026-09-30): NarrativeLine `0.2.0` application-owned sample candidate; sample-data policy selected, Human Browser Acceptance and publication pending

## Current disposition — 2026-10-19

The original Cedar EN/JA story was published with NarrativeLine `0.2.0` and
its Hub Gallery entry. The four-Dimension, 15-Assessment update described below
was subsequently Human-adopted as content and received bounded ParameterPlotter
sample-integration Human Browser Acceptance. Human selected both updated owner
files for the **local NarrativeLine `0.2.1` release candidate**. They remain
unpublished at this revision; content adoption and application review do not
substitute for the separate public-write decision. Hub's Cedar Raw JSON links
follow NarrativeLine `main`, so publishing this candidate would also change
the Dataset retrieved through the existing Hub entry. NarrativeLine preserves
the Dimension Assessment Candidate `0.2.0` payload as an unknown Extension;
this does not promote that Candidate or imply native Assessment editing.
The 2026-10-19 integrated `0.2.1` Human Browser Review accepted Cedar EN/JA
acquisition and display within its bounded RC scope; it did not authorize
publication or a new cross-app sample contract.
See the [0.2.1 candidate record](release-candidate-0.2.1-preparation-2026-10-19.md)
for the exact source and release-review boundary. The dated statements below
retain their original preparation context.

## Content adoption and subsequent revision — 2026-10-09

Human first adopted five Cedar Dimensions and 16 Assessments per locale. A
subsequent Human decision removed `cedar.technical-role-expertise` and Ren
Sato's Assessment on that Dimension. The current NarrativeLine owner EN/JA
Dataset pair contains four Dimensions and 15 Assessments per locale at
Candidate `0.2.0`; the earlier adoption remains historical evidence. This
content revision does not itself establish Browser Acceptance, change the
recorded application release status, or authorize publication. See the
[E2R-SPEC implementation result](../../e2r-spec/docs/public-samples/lighthouse-cedar-dimension-assessment-implementation-result-2026-10-09.md)
for the owner-source and provenance disposition.

## Role and content

The new [English](../src/sample/cedar-observatory-showcase.en.e2r.json) and
[Japanese](../src/sample/cedar-observatory-showcase.ja.e2r.json) files are a
fictional neighborhood observatory's open-night story. They are separate from
the existing Berlin Wall onboarding sample and from E2R-SPEC canonical samples.
Hub now has a Cedar entry after the existing five samples in its Gallery,
with NarrativeLine and LiaisonScape Handoff targets; this does not confer canonical
cross-app status. Home offers a second supplemental action; it opens
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
to the five-family canonical Gallery ledger. No Dataset-level `metadata.license`
field, LiaisonScape sample mirror, or canonical cross-app authority is created.
Hub's Cedar entry links both consumers to this NarrativeLine-owned EN/JA
source pair through the existing HTTPS Handoff contract after publication;
Hub does not own a separate content copy. LiaisonScape can load the Dataset as
an Entity graph, but its Validator 0.6.0 retains the known Relative Time 0.2.0
specification-version warning. Human Browser Acceptance and public-write
approval remain pending.

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
