# NarrativeLine Home action width — independent visual refinement

Date: 2026-11-06 JST
Status: LOCAL CANDIDATE / AUTOMATED GATES PASS / OFFICIAL BROWSER USE BLOCKED /
PRIORITY 2 HUMAN ACCEPTANCE PENDING / NO COMMIT, PUSH OR DEPLOYMENT.

## Scope and source comparison

Human direction: align NarrativeLine Home primary-operation width with the other
apps while retaining central Desktop placement, natural Narrow fit, button
labels/order/hierarchy and Dataset-dependent Continue behavior. Priority 1 Locale
question typography is a separate candidate and acceptance decision, recorded in
locale-conflict-bilingual-ui-2026-11-05.md.

NarrativeLine's content container is min(100%,22rem), without inner horizontal
padding; the action group fills it (including inline width:100%). That yields a
larger maximum than the reference apps. LiaisonScape Home uses a border-box
min(352px,100%) container with 16px inner padding each side; ParameterPlotter
home-main likewise caps at 352px with 16px horizontal padding. Their ordinary
maximum usable action width is therefore 320px. These are source findings, not
new browser-measured rectangles.

Change only .home-screen .home-actions in src/index.css: retain width:100% and
add max-width:320px. Existing centered parent alignment caps the whole group;
all current nested buttons still use their existing full group width. The parent
content, title/description, warnings, import-feedback area, Guide, Hub link,
support links, Header and Footer are not resized. Labels, sample ordering,
callbacks and Dataset semantics are untouched. Existing button wrapping and
box-sizing rules remain. No Layout or Home rule in LiaisonScape/ParameterPlotter
is changed by Priority 2.

## Responsive assessment and remaining distinction

The following is a simplified CSS-box-model estimate with no scrollbar width or
additional runtime layout effects. It is NOT rendered measurement or PASS evidence:

| Viewport | NarrativeLine before -> candidate | LiaisonScape reference | ParameterPlotter reference |
| --- | --- | --- | --- |
| 1280px | about 396 -> 320px | about 320px | about 320px |
| 390px | about 352 -> 320px | about 320px | about 320px |
| 320px | about 288 -> 288px | about 256px | about 288px |

The references themselves have different outer padding at the smallest viewport.
The candidate uses their common normal maximum and shrinks to available width,
aligning with ParameterPlotter's small-width source model. Exact three-way
pixel equality at 320px is not established or claimed. If Human wants that as
an additional invariant, changing LiaisonScape/ParameterPlotter's existing outer
layout would require a separate Human decision; neither was changed here.

## Automated verification

New tests/homeActionPresentationIntegration.test.js checks English/Japanese with
and without a resumable Dataset (four states): primary button labels/order,
Create/Continue/sample callbacks, file-picker opening without Dataset import,
loading-state disabling, and unchanged locale-only Home-to-Hub href. It does not
pretend jsdom provides real text layout or clipping measurements.

Fresh NarrativeLine full suite 411/411, lint and build PASS. The complete suite
retains existing Dataset/Locale/Handoff/History safety coverage. Source separation
checks prove Priority 2 is only the Home action-group max-width change relative
to the Priority 1 snapshot; reverting it reconstructs that exact snapshot.
Evidence: workspace/diagnostics/cross-app-ui-consistency-2026-11-06/priority-2-edit.json,
source-check-results.json, p1-narrative.css and fresh gate logs.

Official Browser Use again returned "The browser access host is unavailable";
no isolated target identity was established and no alternate browser control was
used. Actual 1280/390/320px rectangles, central placement, long EN/JA text fit,
overflow/focus appearance, Dataset-state rendered differences and other-surface
visual spillover remain BLOCKED / NOT VERIFIED for this candidate. Older screenshots
and CDP results are historical references, not new official Browser Use PASS.

## Preservation and independent acceptance

Existing button-dimension refinement, NarrativeLine's prior 500 heading emphasis,
Locale and Home-to-Hub publication addenda and untracked work are preserved.
No Header/Footer/Workspace/Detail/Dataset code or Locale/Handoff/Core/Extension
contract was changed. No staging, Commit, Push, Deployment, Human Acceptance or
Publication Closure was performed. Priority 1 and Priority 2 source edits share
one stylesheet but have separate manifests, scope checks and evidence records.

Applied Accepted knowledge: responsibility-local incremental modularization
(one Home-only rule), dirty-worktree baseline preservation, bounded public-evidence
separation, and approved diagnostic workspace placement. Screen-reader speech,
other engines and all editing/save-failure states remain NOT VERIFIED.

Human should review the independent Home-width candidate and the Narrow reference
padding distinction when official isolated Browser Use or Human visual review is
available. Acceptance/publication of Priority 1 does not automatically accept
Priority 2 or close either earlier publication workstream.

## Narrow review and acceptance readiness — 2026-11-06

Priority numbering in this follow-up: Priority 1 is Home width; Priority 2 is
Locale Dialog readiness. Earlier dated numbering is preserved as history.
No CSS or Runtime is changed in this review.

At 320px, NL home-screen uses 16px horizontal padding once: 320-32=288px.
PP home-main uses 16px horizontal padding once: 320-32=288px. LS app-content
uses 16px horizontal padding and its border-box home-content adds another 16px
on each side: 320-32-32=256px. Their centered content containers create 16px
versus 32px action insets, rather than a button width declaration difference alone.
At 390px and 1280px the common action maximum remains 320px. These are simplified
source calculations, NOT rendered measurements. The current NL-only 320px maximum
is preserved.

The discrepancy is a meaningful candidate for visual unification because it
reduces LS action/label space by 32px at equal viewport width. It is not proven
to cause clipping or a functional defect. Existing label wrapping must remain;
actual fit needs browser measurement in JA/EN with and without resumable Dataset.
NL alone cannot equal both LS=256px and PP=288px at 320px. Reducing NL to 256px
would leave PP different and reduce label space; no NL-only patch is proposed.

Human design options (no implementation authorized or performed):

1. Recommended: retain NL/PP's single 16px inset model and remove LS's doubled
   horizontal inset only within normal Home, preserving the 320px action maximum,
   title/Guide/support hierarchy and all non-Home app-content padding. A possible
   direction is a Home-specific content modifier plus a centered Home container;
   exact CSS follows approved scope and rendered comparison. Expected widths are
   320/320/288px at 1280/390/320px.
2. Keep LS's extra small-screen breathing room intentionally and accept the
   bounded cross-app difference. This does not achieve exact width equality.

Changing shared app-content globally or resizing LS Workspace/Graph is not a
recommended shortcut. LS/PP Home have not changed. Human must choose whether to
authorize Home-only LS alignment or retain the exception before implementation.
A chosen correction needs effective innerWidth, container/action rectangles,
center alignment, wrapping/overflow/focus at 1280/390/320px, JA/EN, and relevant
Dataset-present/absent Home states; ordinary surfaces must remain unaffected.

Official Browser Use was retried and remains BLOCKED with "The browser access
host is unavailable"; no isolated tab/profile could be established. Current
rendered measurements and native operation checks are NOT VERIFIED. No alternate
browser path was used. Reused current-candidate full automatic gates remain NL
411, LS 680, PP 243 PASS with applicable lint/build/42-module syntax checks; no
Runtime/test changes justify repeating complete gates for this docs-only review.
Source separation was rerun and PASS. Human's resolved heading semantics and
20px/500/1.5 design remain settled, independently of Home-width acceptance.

Existing histories and dirty/untracked work are retained. No formal Human
Acceptance, staging, Commit, Push, Deployment or Publication Closure was recorded.


## B ? Bounded Human Acceptance, 2026-11-07

Current bounded authority: HUMAN ACCEPTED / LOCAL COMMIT AUTHORIZED ONLY.
The Human independently accepts NarrativeLine Home primary-action width alignment.
No further CSS adjustment or exact pixel equality is required.

Desktop Work official Browser Use measurements reported by the Human:

| Effective viewport | NarrativeLine | LiaisonScape | ParameterPlotter |
| --- | --- | --- | --- |
| 1280px | 320px | 320px | 320px |
| 360px | 320px | 320px | 320px |
| 320px | 286px | 288px | 288px |

The Human accepts the 2px Minimum-width difference. No clipping, missing controls
or horizontal overflow was observed in the reported scope. Human visual review
at Desktop/Narrow and Desktop/320px is distinct from the Desktop Work agent's
measurements. No such browser measurement was repeated in VS Code for this commit.

### Correction of the earlier source estimate and proposed design branch

The earlier 256px LiaisonScape estimate incorrectly applied app-content padding
to the normal Home: current Home renders home-content directly in app-frame,
not nested within app-content. Its 288px measured action area is consistent with
that DOM. The old recommendation to modify LiaisonScape Home padding and its
pending-choice language are superseded, NOT current design decisions. Historical
text above is retained to preserve the mistaken assumption and its correction.
NarrativeLine's 286px is consistent with its root's 1px borders plus Home inset.
The earlier simplified 288px NL source estimate omitted the borders. No LS/PP
Home layout change is needed or included.

### Evidence, scope and exclusions

The implementation remains one Home-only max-width:320px addition; primary
labels/order, Dataset-present/absent behavior, Header/Footer and Hub navigation
are preserved. VS Code evidence is the 412-test full PASS plus lint/build, including
the added English/Japanese and resumable/non-resumable Home integration test.
Local serving-source comparison PASS was subsequently reported; the current
source/test bytes match that restoration baseline. Existing A evidence is recorded
independently in locale-conflict-focus-geometry-2026-11-07.md. Shared src/index.css
is committed once with both accepted scopes, without granting new design authority.

Full dependency serving identity is NOT VERIFIED. Screen-reader speech, all
editing/save-failure states and unrelated features receive no expanded acceptance.
No new UI change, Handoff contract change, Dataset change or public operation is
implied. The Human instruction, not the test results, establishes B acceptance.

The owned commit includes src/index.css, tests/homeActionPresentationIntegration.test.js
and this record alongside A's files. Old mixed public addenda remain uncommitted
and byte-preserved. Earlier acceptance/publication history and independent
Publication Closure decisions are unchanged. Local Commit is authorized; Push,
Deployment and Publication Closure remain unauthorized and unperformed.
