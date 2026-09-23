import { useState } from "react";
import type { ReactNode } from "react";
import { useLanguage } from "../i18n/LanguageContext";
import { getPresentationMessages } from "../i18n/messages";
import { ModalDialog } from "./ModalDialog";

type AppFrameProps = {
  children: ReactNode;
  showFooter?: boolean;
  footerId?: string;
  onHome?: () => void;
  onLanguageChange?: (language: "en" | "ja") => void;
  headerNavigationAction?: {
    label: string;
    onClick: () => void;
  };
};

export function AppFrame({
  children,
  showFooter = false,
  footerId,
  onHome,
  onLanguageChange,
  headerNavigationAction,
}: AppFrameProps) {
  const { language, setLanguage } = useLanguage();
  const [isCreditsOpen, setIsCreditsOpen] = useState(false);
  const ja = language === "ja";
  const copy = getPresentationMessages(language);

  return (
    <div className="app-frame">
      <header className={headerNavigationAction ? "app-header app-header--with-navigation-action" : "app-header"}>
        <a
          className="app-brand"
          href={import.meta.env.BASE_URL}
          onClick={onHome ? (event) => { event.preventDefault(); onHome(); } : undefined}
        >
          NarrativeLine
        </a>
        {headerNavigationAction && (
          <button type="button" onClick={headerNavigationAction.onClick}>
            {headerNavigationAction.label}
          </button>
        )}
        <button type="button" onClick={() => {
          const nextLanguage = ja ? "en" : "ja";
          if (onLanguageChange) {
            onLanguageChange(nextLanguage);
          } else {
            setLanguage(nextLanguage);
          }
        }}>
          {ja ? "English" : "日本語"}
        </button>
      </header>

      <div className="app-content">{children}</div>

      {showFooter && (
        <footer id={footerId} className="app-footer">
          <small>{ja ? "E2R\u30bf\u30a4\u30e0\u30e9\u30a4\u30f3\u30a8\u30c7\u30a3\u30bf\u30fc" : "E2R timeline editor"}</small>
          <button
            type="button"
            className="credits-button"
            onClick={() => setIsCreditsOpen(true)}
          >
            {ja ? "\u30af\u30ec\u30b8\u30c3\u30c8" : "Credits"}
          </button>
        </footer>
      )}

      {isCreditsOpen && (
        <ModalDialog
          ariaLabelledby="credits-heading"
          onDismiss={() => setIsCreditsOpen(false)}
          onBackdropDismiss={() => setIsCreditsOpen(false)}
        >
          <h2 id="credits-heading">{ja ? "\u30af\u30ec\u30b8\u30c3\u30c8" : "Credits"}</h2>
          <p>NarrativeLine 0.1.0</p>
          <p>{copy.creditsCreatedByLabel}: sukoyaka-dopeness</p>
          <p>{copy.creditsReleasedLabel}: 2026-08-06</p>
          <p>{copy.creditsGratitude}</p>
          <p>
            <a href="https://github.com/sukoyaka-dopeness/e2r-narrative-line" target="_blank" rel="noreferrer">
              {copy.creditsNarrativeLineRepository}
            </a>
            <br />
            <a href="https://github.com/sukoyaka-dopeness/e2r-spec" target="_blank" rel="noreferrer">
              {copy.creditsSpecificationRepository}
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
