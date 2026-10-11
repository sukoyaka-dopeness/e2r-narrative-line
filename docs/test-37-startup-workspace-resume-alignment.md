# Test 37 Follow-up: Startup Workspace Persistence and Resume Alignment

Date: 2026-10-11

Status: HUMAN ACCEPTED - Tests 37-NL-01 through 37-NL-09, tested scope only. Overall Test
37 remains Partial PASS - tested scope only. Cross-Context Workspace Safety
remains Pending; PUBLIC RELEASE remains NO-GO.

## Decision applied

The built-in sample remains the in-memory initial Dataset when no recoverable
Dataset exists. The untouched startup sample is not written to
`narrativeline.lastDataset`. Browser-local persistence starts when a saved
Dataset was restored, a Dataset source is explicitly accepted, or a Dataset
mutation begins an active session.

Resume retains the accepted NL-H1B meaning: it navigates to the current or
restored Dataset session. It does not fetch storage again, acquire a Dataset,
accept a replacement, or bypass replacement protection. Home offers Resume for
a session initialized from a saved Dataset or started in the current tab; a
late storage change from another tab does not turn this tab's fallback sample
into a Resume target. Reload remains the way to initialize from the latest
saved Workspace.

## Evidence and implementation

The Test 37 Human observation found that Resume was absent on the initial Home,
then later appeared and opened the 15-Event Berlin Wall sample. The exact
writer and timestamp were not measured, so the historical observation does
not prove which tab or operation wrote the value.

Source inspection found that the Dataset persistence effect ran for the
initial in-memory sample. The old Resume visibility check reread localStorage
on every render, while its click handler navigated the already-mounted
in-memory Dataset. These separate behaviors could make a newly appearing
storage value expose Resume without changing this tab's Dataset state.

The implementation now gates the autosave effect until a saved Dataset has
been restored or the current tab explicitly starts a Dataset session. Resume
visibility follows that mounted session rather than a later incidental
localStorage read. The startup source precedence and the NL-H1A/H1B contracts
remain unchanged.

## Verification

- Added a StrictMode integration regression test proving that an untouched
  startup sample remains in memory, is not persisted after a rerender, and is
  not offered as Resume.
- The rerender is driven by clicking a required Home language control and is
  verified by checking the document language changed. Missing controls fail the
  test; no optional click can silently skip the transition.
- The same test explicitly opens the Berlin Wall sample, confirms its 15 Events
  are saved, returns Home, and confirms Resume returns to the current Timeline.
- Focused cross-tab/startup regression set: PASS, 5/5.
- Full suite: `npm.cmd test` PASS, 366/366.
- Lint: `npm.cmd run lint` PASS.
- Build: `npm.cmd run build` PASS (`tsc -b` and Vite production build).
- Existing React `act(...)` warnings remain in unrelated integration tests; the
  suite exits successfully.
- Human acceptance preview serves the built `dist` output at
  `http://127.0.0.1:5341/e2r-narrative-line/`, on an origin separate from the
  earlier Test 37 server at port 5340. The HTML and referenced JavaScript both
  returned HTTP 200. Served bundle SHA-256:
  `1C0A0F0101E3076A885873A5EDF3A50B1DE6D5C16EAE6ECFE07CAC304553DACE`.
- At the time this implementation checkpoint was written, Human
  reconfirmation was pending. The later Human Browser Acceptance below
  resolves that pending status only for Tests 37-NL-01 through 37-NL-09; the earlier
  unexpected Resume observation and unknown writer/timestamp remain part of
  the incident history.

## Human Browser Acceptance - Test 37-NL-01 through 37-NL-09

Date: 2026-10-11
Environment: Microsoft Edge InPrivate at
`http://127.0.0.1:5341/e2r-narrative-line/`, a separate origin from the earlier
Test 37 environment on port 5340. The Human reviewed the modified production
build identified by asset `index-CGmMy7hR.js`, SHA-256
`1C0A0F0101E3076A885873A5EDF3A50B1DE6D5C16EAE6ECFE07CAC304553DACE`.

| Test | Human-observed result | Status |
| --- | --- | --- |
| 37-NL-01 | Initial Home showed no Resume; it remained absent during an untouched wait. | PASS |
| 37-NL-02 | After changing the UI language and causing a real rerender, Resume remained absent. | PASS |
| 37-NL-03 | Read-only DevTools check found no `narrativeline.lastDataset` (`datasetSaved: false`). | PASS |
| 37-NL-04 | Human explicitly opened the Berlin Wall sample; its Timeline showed 15 Events. | PASS |
| 37-NL-05 | Read-only check after acquisition found `narrativeline.lastDataset` (`datasetSaved: true`). | PASS |
| 37-NL-06 | Returning from Timeline to Home showed Continue Editing. | PASS |
| 37-NL-07 | Continue Editing returned to the same Berlin Wall 15-Event Timeline without a replacement dialog or conflict warning. | PASS |
| 37-NL-08 | After F5 Reload, Home showed Continue Editing. | PASS |
| 37-NL-09 | Continue Editing after Reload restored the same Berlin Wall Dataset with 15 Events. | PASS |

**Acceptance:** HUMAN ACCEPTED / PASS for Tests 37-NL-01 through 37-NL-09 and the
observations listed above. The storage-key checks established key absence or
presence only; they did not compare the complete saved value byte-for-byte or
exercise every conflict pattern. These Human results do not expand to all of
Test 37 or Cross-Context Workspace Safety as a whole.

The earlier Test 37 observation remains historical evidence: Resume appeared
later and opened the Berlin Wall sample, but the writer and write time were not
established. The acceptance above confirms the revised startup/resume behavior
in the stated environment; it does not retroactively identify that earlier
write's source.

## Preserved safety boundaries

Saved Workspace initialization, guarded replacement, exact-revision checks,
Web Lock coordination, failed-write reporting, and BFCache re-registration
were not redesigned. An edit in a session that began from the fallback sample
enables the existing guarded save path; a concurrent saved revision still
causes the existing fail-closed refusal. Resume remains navigation only.

This checkpoint does not claim full Cross-Context Workspace Safety acceptance,
all-form coverage, production-origin verification, or release readiness.
Overall Test 37 remains Partial PASS - tested scope only. Cross-Context
Workspace Safety remains Pending and PUBLIC RELEASE remains NO-GO.
