export async function waitForPersistedDataset(window, predicate, timeoutMs = 1_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() <= deadline) {
    const raw = window.localStorage.getItem("narrativeline.lastDataset");
    if (raw) {
      const dataset = JSON.parse(raw);
      if (predicate(dataset)) return dataset;
    }
    await new Promise((resolve) => setTimeout(resolve, 5));
  }
  throw new Error("NarrativeLine Dataset was not persisted before the test timeout.");
}
