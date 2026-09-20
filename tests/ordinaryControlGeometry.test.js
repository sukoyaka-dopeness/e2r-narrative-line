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
    /\.detail-header button,\s*\.danger-zone button\s*\{\s*min-height: 36px;\s*padding: 5px 9px;\s*border-radius: 4px;\s*font-size: 15px;\s*line-height: 120%;/s,
  );
  assert.match(styles, /\.danger-action \{\s*color: #b00020;/);
  assert.match(styles, /\.danger-zone button \{\s*width: 100%;/);
});
