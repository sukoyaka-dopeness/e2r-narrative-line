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
