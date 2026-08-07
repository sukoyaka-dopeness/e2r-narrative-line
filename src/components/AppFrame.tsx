import { useState } from "react";
import type { ReactNode } from "react";
import { useLanguage } from "../i18n/LanguageContext";
import { ModalDialog } from "./ModalDialog";

type AppFrameProps = {
  children: ReactNode;
};

export function AppFrame({ children }: AppFrameProps) {
  const { language, setLanguage } = useLanguage();
  const [isCreditsOpen, setIsCreditsOpen] = useState(false);
  const ja = language === "ja";

  return (
    <div className="app-frame">
      <header className="app-header">
        <a className="app-brand" href={import.meta.env.BASE_URL}>
          NarrativeLine
        </a>
      </header>

      <div className="app-content">{children}</div>

      <footer className="app-footer">
        <small>{ja ? "E2R\u30bf\u30a4\u30e0\u30e9\u30a4\u30f3\u30a8\u30c7\u30a3\u30bf\u30fc" : "E2R timeline editor"}</small>
        <button type="button" onClick={() => setLanguage(ja ? "en" : "ja")}>
          {ja ? "English" : "\u65e5\u672c\u8a9e"}
        </button>
        <button
          type="button"
          className="credits-button"
          onClick={() => setIsCreditsOpen(true)}
        >
          {ja ? "\u30af\u30ec\u30b8\u30c3\u30c8" : "Credits"}
        </button>
      </footer>

      {isCreditsOpen && (
        <ModalDialog
          ariaLabelledby="credits-heading"
          onDismiss={() => setIsCreditsOpen(false)}
        >
          <h2 id="credits-heading">{ja ? "\u30af\u30ec\u30b8\u30c3\u30c8" : "Credits"}</h2>
          <p>NarrativeLine 0.1.0</p>
          <p>Created by sukoyaka-dopeness</p>
          <p>Released 2026-08-06</p>
          <p>
            With gratitude to all the AI systems that contributed to this
            project.
          </p>
          <p>
            <a href="https://github.com/sukoyaka-dopeness/e2r-narrative-line" target="_blank" rel="noreferrer">
              NarrativeLine repository
            </a>
            <br />
            <a href="https://github.com/sukoyaka-dopeness/e2r-spec" target="_blank" rel="noreferrer">
              E2R specification repository
            </a>
          </p>
          <div className="modal-actions">
            <button type="button" onClick={() => setIsCreditsOpen(false)}>
              {ja ? "\u9589\u3058\u308b" : "Close"}
            </button>
          </div>
        </ModalDialog>
      )}
    </div>
  );
}
