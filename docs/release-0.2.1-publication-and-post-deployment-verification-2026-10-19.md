# NarrativeLine 0.2.1 publication and post-deployment verification

Date: 2026-10-19

Public release: **PUBLISHED / DEPLOYMENT SUCCEEDED**. Post-deployment
verification: **PASS (BOUNDED)**, including a completed public HTTPS E2R JSON
download and file inspection in an isolated Chrome profile. This is Codex
browser evidence, not new Human Browser Acceptance.

## Publication identity

Human authorized publication of exactly
`54bc709b695b98de382c75e90459fd53cd85caff`. Before the push, local
`main` was clean at that SHA and remote `main` was
`eb583720df89797a1acf682b5cea747bc25e0cc6`; the approved 13 commits
were fast-forwardable. The normal push completed, and remote `main` was
verified at the authorized SHA after publication and again during this
reconciliation. [GitHub Pages run 39243870213](https://github.com/sukoyaka-dopeness/e2r-narrative-line/actions/runs/39243870213)
completed successfully for the same SHA. No tag or GitHub Release was made.

The [public app](https://sukoyaka-dopeness.github.io/e2r-narrative-line/)
returned successfully in the publication check. Its served JS and CSS were
byte-identical to the production build of the authorized source. The public
Credits displayed `NarrativeLine 0.2.1` and the 2026-10-19 update date.
These are publication and Codex/automated observations, not a new Human
Browser review. The [local release-candidate record](release-candidate-0.2.1-preparation-2026-10-19.md)
retains its own bounded Human Acceptance and preparation-time decisions.

## Public HTTPS evidence

The initial post-deployment check used a disposable Edge profile and test
Workspace. Codex observed ordinary Home and Timeline startup, title editing,
browser-Workspace save, Home / Continue Editing, Reload / Resume, and title
and 15-Event retention. Public Cedar EN and JA each opened with 12 Events.
Their public Raw JSON bytes matched the respective Git blobs in the authorized
commit; each contains four Dimensions and 15 Assessments at Dimension
Assessment Candidate `0.2.0`. Public HTTPS Cedar EN Dataset Handoff opened
and saved the 12-Event Dataset. The expected unknown-Extension and
specification-unavailable diagnostics did not prevent that bounded check.
This does not verify other consumers or all HTTPS/CORS Handoff conditions.

The initial Edge Export action produced an inspectable Blob JSON with the
test title and 15 Events, but no completed file appeared in the isolated
download directory. Blob inspection is not evidence of download completion.
The earlier local RC Human Browser review separately reported a completed
download and supplied a JSON file; it did not operate on the public HTTPS
deployment.

On 2026-10-19, a second public HTTPS Export attempt used a fresh, isolated
Edge profile and the built-in Berlin test Dataset with 15 Events. The app
remained on Timeline, showed no blocking alert, and the test's page-level
error/rejection listeners recorded no error. No file appeared in the dedicated
download directory; Edge's Downloads view reported a download error for the
expected E2R JSON filename. An independent isolated Chrome profile produced
the same no-file result. In that Chrome profile, a simple test-only JSON Blob
download, independent of NarrativeLine's Export implementation, also failed
to produce a file. At that stage, these observations did not establish the
cause of the browser error or a NarrativeLine runtime defect. No downloaded
JSON was then available to parse or compare with the pre-Export Dataset. The
earlier Blob content check was not substituted for the missing file evidence.

The Timeline remained visible with 15 Events after the attempted Export.
Source Audit of `src/services/DatasetService.ts` found that
`downloadDatasetExport` creates a Blob and temporary download anchor without
writing to browser Workspace storage. Those early retries did not complete a
byte-level post-Export Workspace comparison.

Computer Use's browser inventory exposed only the user's existing Chrome and
Edge profiles, and its dedicated in-app browser was unavailable. Those
ordinary profiles were not operated. The fresh, disposable Edge and Chrome
profiles above were controlled through CDP and stopped after verification;
their observations are Codex browser evidence, not Computer Use or Human
Browser PASS. The failed test-only download was a control observation.

### Completed Export retry

A further 2026-10-19 retry used a separate disposable Chrome `155.0.8059.82`
profile on the public HTTPS app and the Berlin test Dataset. First, the same
CDP-controlled download still failed when its destination was passed with
forward slashes. The retry changed only the CDP `downloadPath` argument to
Windows backslash form. The actual browser download then completed. This
controlled result identifies the verification harness's path formatting as
the cause of its prior Chrome file-write interruption; it is not a Runtime
correction or a change to the public app. The user's ordinary browser and
Workspace were not used.

The acquired `The Road to the Opening of the Berlin Wall.e2r.json` file was
13,093 bytes (SHA-256
`8eed6123ad8a36b185ecb5c05ba252dd6836bef1cd972f349bd7583ecac2cbca`).
Independent file parsing confirmed valid JSON, Metadata title
`The Road to the Opening of the Berlin Wall`, and 15 Events. The test compared
the downloaded Events deeply with the pre-Export saved Dataset; they matched.
The browser Workspace's saved JSON string was byte-identical before and after
Export, and the Timeline still showed the same title and 15 Events. Page-level
error/rejection listeners and visible alerts were empty during this bounded
operation. The isolated browser was stopped afterward. These observations do
not cover all browsers, download configurations, or failure modes.

## Verdict and limits

| Gate | Current result | Evidence boundary |
| --- | --- | --- |
| Authorized push and remote `main` | **COMPLETED** | Exact SHA verified remotely; no alternative SHA published. |
| Pages deployment | **SUCCEEDED** | Run 39243870213 completed successfully for the exact SHA; served assets matched its production build. |
| Public HTTPS operation | **PASS (BOUNDED)** | Codex isolated-browser and byte-comparison checks listed above, including an actual downloaded Export file; not Human Browser Acceptance. |
| Post-deployment verification as a whole | **PASS (BOUNDED)** | The documented public startup, Workspace, Cedar EN/JA, HTTPS Handoff, and Export file checks completed within their stated test conditions. |

No required check remains for this bounded post-deployment verification. It
does not prove every browser, concurrency ordering, abnormal termination,
assistive-technology path, or HTTPS/CORS Handoff condition. The `0.2.1`
publication remains completed, and its RC Human Acceptance retains its
separate bounded scope.

This record does not extend the [RC Human Browser Acceptance](release-candidate-0.2.1-preparation-2026-10-19.md)
or the [startup revision-race bounded closure](startup-dataset-revision-race-fix-2026-10-19.md).
Cross-Context Workspace Safety overall remains PENDING. ParameterPlotter's
old Tab C remains historical with root cause UNRESOLVED and is not an
independent Product Acceptance blocker under the existing Human decision;
ParameterPlotter Product Acceptance remains PENDING and its Public Release
remains NO-GO. Dimension Assessment `0.2.0` remains CANDIDATE / NOT STABLE.
