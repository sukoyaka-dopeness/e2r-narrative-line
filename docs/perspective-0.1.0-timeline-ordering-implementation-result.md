# Perspective 0.1.0 Timeline Ordering — Implementation Candidate

Status: **bounded UI refinement implemented; automated gates and focused Edge checks pass; post-refinement Human Acceptance remains pending.**

Authority: [E2R-SPEC Perspective `0.1.0` Candidate](../../e2r-spec/extensions/perspective-extension-candidate.md).

## Implemented boundary

The ordinary Timeline first derives its previous History-based order. For
eligible undated Relative Time groups, Derived band order permutes only the
group's existing display slots; disconnected groups and unrelated Events keep
their default slots. A supported, single Perspective then permutes only the
slots occupied by its listed Event IDs. Unlisted Events retain their
Derived/default slots and remain unplaced. A cyclic Relative Time group still
uses the accepted supplementary conflict treatment and contributes no band
ordering to the ordinary Timeline.

Each Event has native buttons to move one display position up or down. The
buttons can be reached and activated by keyboard, announce the Event and
direction, and report the result in a status message. A move adds the moved
Event and the crossed adjacent Event to the authored sequence. Existing
placed IDs retain their authored order unless crossed by the explicit move;
unaffected unplaced Events are not written to Perspective. Repeated moves can
place an undated Event between dated Events or move a band member elsewhere
in the display without changing temporal records or the Core Event array.
Drag and drop is not included.

The first move on a Dataset without Perspective creates one Dataset-level
`draft.github.sukoyaka-dopeness.perspective` `0.1.0` payload and an exact
Specification Extension use declaration when every already-used Extension
can be declared safely. Imported exact `0.1.0` data is consumed only with a
complete declaration and supported payload shape. With multiple applicable
Perspectives, Timeline uses Derived/default order and pauses authoring rather
than choosing an implicit default. Unsupported or malformed payloads are
preserved, and ordering writes are refused. No picker or manager was added.

Event add leaves the new Event unplaced; rename keeps placement by ID. Event
deletion removes its ID from every supported Perspective sequence within the
same Dataset mutation. Deletion is refused when an unsupported Perspective
payload cannot be safely updated. Imported dangling IDs are diagnosed and
preserved through unrelated edits and round-trips. History and Relative Time
changes do not rewrite the authored sequence. Dated and Derived-band order
mismatches are read-only diagnostics; warning acknowledgment is not serialized.

Perspective mutations use App's existing Dataset state, accepted baseline,
replacement guard, local persistence, and export/import path. Opening,
projection, and diagnosis are read-only and do not mark the Dataset modified.
Export does not normalize the sequence. The existing export operation remains
available when a mismatch warning is visible; this candidate does not add a
separate confirmation transaction.

## Responsibility and limits

`PerspectiveOrderingService` owns exact-version recognition, default display
composition, sparse sequence mutation, and diagnostics. `TimelineScreen` owns
controls and messages. App applies Dataset results. EventService performs
atomic Event/Perspective deletion cleanup. SpecificationDeclarationService
keeps exact declarations complete when the first stable History payload is
added or the last payload is removed by Event deletion. No Core, History,
Relative Time, E2R-SPEC, Validator, public sample, or other application source
was changed for this implementation.

The Timeline's native controls and status messages require Real Browser and
Human review for visual density, mobile layout, focus behavior, warning
comprehension, and the practical cost of repeated adjacent moves. That review
is the next acceptance checkpoint; automated gates do not constitute Human
acceptance.

## Human-observed browser follow-up — 2026-09-28

Human's preliminary browser observation reports that each Event's ↑/↓ controls
look visually large and become more prominent as the Event count grows. The
always-visible status labels `表示順を配置済み` and `未配置・導出表示` also
increase ordinary Timeline density. This observation is recorded for the
pending formal acceptance; it is not a completed acceptance or a request to
change this candidate's runtime in this checkpoint.

Formal Real Browser / Human Acceptance should review:

- whether ordering controls need to be strongly visible on every Event, or can
  be compact and contextual (including selection and keyboard focus) while
  remaining discoverable and operable without pointer hover;
- whether placed/unplaced is needed as constant user-facing text, while keeping
  the portable distinction and exposing diagnostics when a Human needs to act;
- whether an explicit `表示順を編集` mode, possibly entered through the
  Timeline More menu, improves the ordinary read-oriented Timeline. Both the
  mode and its More-menu location are unselected alternatives; contextual
  controls alone remain an option;
- keyboard access, focus visibility/return, localized labels, narrow layouts,
  and the practical effort of moving Events through repeated adjacent moves;
- whether the existing Relative Time mismatch warning is sufficient when
  saving/exporting a Dataset, or whether that operation requires an explicit
  Human confirmation. Perspective `0.1.0` continues to preserve authored
  order, derive diagnostics, and avoid serializing an acknowledgment; no
  confirmation transaction is implemented in this checkpoint.

The current keyboard-accessible move operation remains the acceptance baseline.
Drag and drop is deferred; if considered later, it is a supplementary input
for the same ordering operation, not a pointer-only portable meaning. Exact
button dimensions, CSS tokens, component APIs, a Cross-App control hierarchy,
edit-mode adoption, More placement, and export confirmation remain Human
decisions. Any accepted bounded UI refinement must be browser-reviewed again
before Perspective ordering workstream closure.

This documentation checkpoint does not change runtime, CSS, Candidate
semantics, schema, Dataset data, or temporal authority. Quantitative Relative
Time is a separate post-closure audit/design checkpoint, not part of this
acceptance or an implementation authorization; current planning and sequence
are maintained by the E2R-SPEC Roadmap.

## Bounded UI refinement — 2026-09-28

This follow-up addresses the Human-observed control-density, same-name Event,
and move-feedback issues without changing Perspective, Relative Time, History,
or Core meaning.

- The always-visible native move buttons remain in place at 32 by 32 CSS px.
  Per-Event placed/unplaced text is shown only on the selected card; every move
  button retains an accessible label that names its Event, direction, and
  placed or derived state. Existing keyboard activation and disabled
  boundaries remain intact.
- A successful move restores focus to the moved Event's same-direction button
  after list reordering. At a disabled edge it focuses that Event's opposite
  direction button. The EN/JA result is a low-prominence status message. The
  Japanese copy now says `「Event名」を表示順で上へ/下へ移動しました。`.
- Event Detail Relative Time choices and recorded references now use the
  existing candidate-local identity resolver. The supplementary Relative Time
  projection already used that resolver and remains unchanged. In authoring,
  ambiguous names show recorded chronology when it
  distinguishes the candidates and otherwise use the existing collision-safe
  short-ID fallback. Event callbacks and option values continue to use full
  canonical IDs. Timeline composition and identity policy outside these
  Relative Time reference surfaces are unchanged.
- Export remains available with a Perspective mismatch warning. No additional
  confirmation, animation, edit mode, drag-and-drop, shared identity
  architecture, or Cross-App control standard was introduced.

Verification on this source checkpoint: `npm test` passed 309/309;
`npm run lint` and `npm run build` passed. The focused Timeline, Relative Time,
and control-geometry tests passed. Edge at a temporary local Vite port showed
the 15-Event Timeline in Japanese and English; keyboard moves produced the
localized result, retained `:focus-visible` on the moved Event, and used the
opposite control at the first-item boundary. A temporary same-name Event in
that isolated browser origin was distinguishable in the Relative Time choice
and recorded reference. The pre-existing user Edge tab and its Dataset were
left untouched. This browser check did not test a 360px viewport, native
picker/download, or count as Human acceptance.

The post-refinement Human checklist is limited to H1 density/discoverability,
H2 narrow layout, H3 same-name target comprehension, H4 actual focus and
feedback review, and H6 native picker/export/re-open. The OS picker preflight
is now Human-confirmed. H5's Human preference to keep the current no-extra-
confirmation export behavior is recorded and retained; it does not decide
portable semantics. Formal Human Acceptance remains pending until the remaining
Human checks are complete.

## Human interaction direction and bounded motion refinement — 2026-09-28

The latest Human evidence closes H2 (post-refinement view at about 360 CSS px,
with no clipping/overlap/horizontal-layout failure reported), H3 (same-name
targets were identifiable), and H6 (native open/export/re-open reported OK).
H5's decision to keep export available without extra pre-export confirmation
is confirmed; diagnostic comprehension remains separately pending. H1 now has
a selected direction: ordering ↑/↓ controls should not be constantly visible
in ordinary Timeline. The disclosure model is not selected. The runtime still
shows the controls on each row until Human chooses among selected-Event
controls, a dedicated accessible ordering mode (possibly from More), or
non-hover contextual disclosure. Any chosen path must preserve keyboard/touch
access and leave room for direct ordinary-Timeline drag-and-drop later.

The Human also selected motion for both Event reorder and top/bottom Timeline
navigation. This bounded runtime refinement measures keyed Timeline rows
before a successful move and applies a transform transition to rows whose
display positions changed. Keyboard focus restoration and Dataset update do
not wait for animation. Top/bottom actions smoothly move the viewport. Both
use reduced motion: row transitions are skipped when
`prefers-reduced-motion: reduce` applies, and navigation uses immediate
behavior. Event reorder changes Perspective display order; top/bottom changes
only the viewport. The two arrow families retain these distinct roles.

No edit-mode decision, drag-and-drop, label/icon change, export workflow,
Dataset state, or Perspective/temporal behavior was changed. Formal Human
Acceptance remains pending H1 disclosure choice, H4 post-motion browser review
(focus ring, repeated movement, localized feedback and perceived motion), and
H5 diagnostic comprehension. Automated and browser checks for this runtime
change passed: `npm test` (309/309), `npm run lint`, and `npm run build`. An
isolated Edge tab on Vite port 5179 loaded the 15-Event Berlin Wall sample; the
browser reported the row transform transition, a move changed the first two
Events, and focus remained on the moved Event's direction control. The user's
existing Edge tab and Dataset at port 5173 were left untouched. The reduced-
motion branch is covered for top/bottom navigation by the Timeline shell test;
the operating-system reduced-motion setting was not changed or separately
emulated in Edge. Machine browser evidence does not replace the remaining
Human review.

## Contextual controls and local mismatch discovery — 2026-09-28

H1's Human-selected non-hover contextual direction is implemented using the
existing Event row and selection pattern. Ordering controls are hidden in the
ordinary read-oriented Timeline and appear only on the selected or focused
Event. When authoring is available, rows are keyboard-focusable; Enter or
Space selects a focused row, and the native move buttons are next in its Tab
sequence. Pointer selection uses the existing row click; a touch tap follows
that same selection path. No edit mode or More-menu action was added. Future
drag-and-drop remains possible in ordinary Timeline without a mode. Actual
touch-device review remains part of H1 Human acceptance.

The always-visible ordering paragraph was removed. A short localized safety
note appears beside disclosed controls: display-order changes do not alter
dates or Relative Time records. The EN and JA user guides explain the Placed /
Unplaced · derived display labels and how to inspect a warning beside an
affected Event.

Move feedback now comes from the existing EN/JA message catalog. The Event
name is inserted unchanged into localized direction wording. EN says “Moved
{event} up/down in display order”; JA uses the natural “を表示順で上/下へ移動
しました” wording.

Mismatch diagnostics retain their existing source, comparison, severity,
export behavior, and persisted-data boundary. The top of the Timeline now has
a compact count and a collapsed full diagnostic list. Every affected Event
also has a local “Review display order” disclosure with the existing
History- or Relative Time-specific detail. Dangling IDs stay in the full list
because they have no matching Event row. No diagnostic is acknowledged or
removed.

Event reorder transitions, top/bottom smooth navigation, and reduced-motion
handling from the preceding checkpoint are unchanged. No motion state is
persisted.

Verification on this checkpoint: `npm test` passed 313/313;
`npm run lint` and `npm run build` passed. E2R-SPEC `npm run validate` passed.
Focused coverage checks initial hidden controls, keyboard row selection and
move access, EN/JA feedback with an untranslated Japanese Event name, and
local details for both History and Relative Time Derived mismatches.

An isolated Edge tab on Vite port 5180 loaded the 15-Event Berlin Wall sample.
The ordinary Timeline showed zero ordering button rows. Keyboard Enter on a
row revealed controls on only that row; Tab reached the move button; Enter
moved the Event and retained focus. EN feedback was English, then JA feedback
was Japanese while the Event name remained unchanged. A pointer-selected row
also disclosed only its controls. The local History mismatch disclosure opened
beside the affected Event while the full-list disclosure stayed collapsed.
The user's existing Edge tab and Dataset at port 5173 were untouched. Browser
review did not simulate a touch device; touch access still needs Human review.

Formal Human Acceptance remains pending targeted H1 review of keyboard/touch
contextual access, H4 confirmation of EN/JA feedback, and H5 review of local
Relative Time warning discovery. The Human's motion/focus/repeated-movement
review and warning comprehension/export preference remain closed; H2, H3, and
H6 remain closed and are not reopened.

## On-demand ordering help, text-only mismatch disclosure, and live locale state — 2026-09-28

The affected-Event warning keeps the existing `Review display order` text and
native disclosure triangle. Its ambiguous circular `!` ornament is removed;
no icon or global warning vocabulary is introduced. Opening the local
disclosure still reveals the existing History or Derived Relative Time
mismatch detail. The compact Timeline count and full-list disclosure are
unchanged.

The always-visible safety note and selected-only Placed / Unplaced status no
longer occupy the Event content area. A collapsed native `About display order`
disclosure appears with the ordering controls when an authorable row is
selected or focused. Opening it explains that moves only change display order
and presents that Event's Placed or Unplaced meaning. The native summary is
operable by pointer, keyboard, and touch; the page does not depend on hover.
Both User Guides name this disclosure and remain the main explanation of the
placement states.

Live code inspection found that success and failure feedback text had been
formatted in the locale at move time and stored as a string. The state now
retains the move direction and Event name, then renders the message using the
current locale. This is bounded to the existing message catalog and does not
change locale architecture.

Verification: `npm test` passed 315/315; `npm run lint` and `npm run build`
passed. Regression coverage confirms EN and JA moves and EN → JA → EN locale
switches while the transient feedback remains visible and keeps the Event name.
The same tests confirm the local warning has no ambiguous `!` element and the
safety/placement help starts collapsed and is available through its disclosure.

An isolated Edge tab at `http://127.0.0.1:5181/e2r-narrative-line/#locale=en`
opened the built-in Berlin Wall sample. The ordinary Timeline showed no
ordering controls before focus. Enter on a keyboard-focused Event revealed
controls on that row; a move displayed English feedback and retained focus.
Switching the same runtime to Japanese translated the existing feedback; a
new Japanese move also displayed Japanese feedback. The Japanese screenshot
showed the warning as a text disclosure with a native triangle and the help
details expanded beneath the controls. The pre-existing Edge tab at port 5173
and its Dataset were untouched. No physical touch device was used; touch
accessibility relies on the existing row tap selection and native disclosure.

Human review remains pending for the final H1 warning/help presentation. H4
locale-switch feedback, H4 motion/focus/repeated movement, H5 comprehension,
export preference and accepted local-discovery direction, H2, H3, and H6
remain closed and must not be reopened. Formal Human Acceptance is not
complete until the targeted H1 presentation check is recorded.

## Plain-language Relative Time diagnostic and compact selected row — 2026-09-28

The user-facing EN and JA local mismatch details now state that saved display
order differs from the order indicated by recorded Relative Time
relationships. They no longer expose “Derived band” wording. The diagnosis is
still generated by the existing ordering comparison; its ownership, meaning,
severity, and behavior are unchanged. The Guides now explain Unplaced derived
display using available History dates and recorded Relative Time relationships
between Events, without presenting “band” as user-facing vocabulary.

The selected/focused card uses tighter vertical padding. The local
`Review display order` detail has a distinct gap before ordering controls, and
the collapsed `About display order` help sits alongside move controls where
the row has room. Existing move targets remain at least 32px. The interaction,
keyboard/focus operation, native disclosure behavior, and reduced-motion
handling are unchanged.

Verification: targeted Perspective integration and control-geometry tests
passed 15/15, including EN and JA Relative Time diagnostic copy. An isolated
Edge view at port 5181 showed the selected Japanese Berlin Wall Event, its
History mismatch disclosure, the separated ordering-help disclosure, and the
more compact collapsed card. This browser view did not contain a Relative Time
mismatch; the EN/JA Relative Time wording was verified by integration tests.
No physical touch device was used. The pre-existing Edge tab and Dataset at
port 5173 were not changed.

Only H1 final warning/help presentation remains for targeted Human review.
H2/H3/H4/H5/H6 and the accepted interaction direction remain closed. No
Perspective, Relative Time, History, Core, or persisted-data semantics,
schema, Validator, sample, or deployment changed.
