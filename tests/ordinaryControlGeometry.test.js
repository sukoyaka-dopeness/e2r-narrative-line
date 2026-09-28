import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("related-card actions belong to the ordinary compact control family", () => {
  const styles = readFileSync("src/index.css", "utf8");

  assert.match(styles, /\.related-card__actions > button,/);
  assert.match(styles, /\.related-card__header > button,/);
  assert.match(
    styles,
    /\.related-card__header > button,\s*\.detail-primary-actions button,.*?min-height: 36px;.*?font-size: 15px;.*?line-height: 120%;/s,
  );
});

test("destructive Detail actions keep their hierarchy while sharing compact geometry", () => {
  const styles = readFileSync("src/index.css", "utf8");

  assert.match(
    styles,
    /\.danger-zone button,\s*\.timeline-card__edit-action\s*\{\s*min-height: 36px;\s*padding: 5px 9px;\s*border-radius: 4px;\s*font-size: 15px;\s*line-height: 120%;/s,
  );
  assert.match(styles, /\.danger-action \{\s*color: #b00020;/);
  assert.match(styles, /\.danger-zone button \{\s*width: 100%;/);
});

test("Timeline Edit and Entity Detail text controls use bounded compact/full-width ownership", () => {
  const styles = readFileSync("src/index.css", "utf8");
  const entityCreate = readFileSync("src/screens/EntityCreateScreen.tsx", "utf8");

  assert.match(
    styles,
    /\.timeline-card__edit-action\s*\{\s*min-height: 36px;\s*padding: 5px 9px;\s*border-radius: 4px;\s*font-size: 15px;/s,
  );
  assert.match(
    styles,
    /\.entity-text-field__control\s*\{\s*box-sizing: border-box;\s*display: block;\s*width: 100%;\s*max-width: 100%;/s,
  );
  assert.match(entityCreate, /<input[\s\S]*?className="entity-text-field__control"/);
  assert.match(entityCreate, /<textarea className="entity-text-field__control"/);
});

test("Perspective ordering keeps operable targets while reducing persistent density", () => {
  const styles = readFileSync("src/index.css", "utf8");
  const timeline = readFileSync("src/screens/TimelineScreen.tsx", "utf8");

  assert.match(
    styles,
    /\.timeline-order-actions button\s*\{\s*min-width: 32px;\s*min-height: 32px;\s*padding: 2px 6px;/s,
  );
  assert.match(styles, /\.timeline-order-feedback\s*\{[^}]*font-size: 0\.82rem;/s);
  assert.match(styles, /\.timeline-order-actions\s*\{\s*display: none;/s);
  assert.match(styles, /\.timeline-card--selected \.timeline-order-actions,\s*\.timeline-card:focus-within \.timeline-order-actions \{ display: flex; \}/);
  assert.match(timeline, /tabIndex=\{perspectiveTimeline\.canAuthor \? 0 : -1\}/);
  assert.match(timeline, /onKeyDown=\{\(keyEvent\) => \{[\s\S]*?keyEvent\.key !== "Enter" && keyEvent\.key !== " "/);
  assert.match(timeline, /isSelected && \([\s\S]*?timeline-order-actions__state/);
  assert.match(timeline, /<button[\s\S]*?aria-label=\{ja[\s\S]*?unplaced, using derived display/);
});
