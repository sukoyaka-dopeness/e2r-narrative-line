import { useCallback, useEffect, useRef, useState } from "react";
import { HomeScreen } from "./screens/HomeScreen";
import { TimelineScreen } from "./screens/TimelineScreen";
import { EventDetailScreen, type EventDetailDraft } from "./screens/EventDetailScreen";
import { EntityDetailScreen, type EntityDetailDraft } from "./screens/EntityDetailScreen";
import { EntityPickerScreen } from "./screens/EntityPickerScreen";
import { EntityCreateScreen, type EntityCreateDraft } from "./screens/EntityCreateScreen";
import { AppFrame } from "./components/AppFrame";
import { DatasetReplacementDialog } from "./components/DatasetReplacementDialog";
import { LocaleConflictDialog } from "./components/LocaleConflictDialog";
import { DetailBackConfirmationDialog } from "./components/DetailBackConfirmationDialog";
import type { DetailDiscardCopyKind } from "./services/DetailDiscardCopyService";
import {
  navigate,
  pushNavigationHistoryEntry,
  replaceCurrentNavigationEntry,
  readNarrativeLineHistoryState,
  readNarrativeLineNavigationIndex,
  rebaseCurrentNavigationEntry,
  reconcileRestoredNavigationState,
  replaceInitialHistoryEntry,
} from "./services/NavigationService";
import { sampleDataset, sampleDatasetEn } from "./sample/sampleDataset";
import type { AppState } from "./state/AppState";
import type { Dataset } from "./models/Dataset";
import {
  createDataset,
  exportDatasetJson,
  downloadDatasetExport,
  updateDatasetTitle,
  importDatasetJson,
  type DatasetImportWarning,
  type DatasetExportResult,
  type DatasetImportResult,
} from "./services/DatasetService";
import {
  addEvent,
  addEventEntityRelation,
  removeEventEntityRelations,
  updateEvent,
  deleteEvent,
  deleteRelation,
} from "./services/EventService";
import { addEntity, deleteEntity, updateEntity } from "./services/EntityService";
import type { HistoryDate } from "./services/HistoryService";
import { updateObjectCoordinate } from "./services/CoordinateService";
import {
  isDatasetModified,
  serializeDatasetBaseline,
} from "./services/DatasetBaselineService";
import {
  hasLossRisk,
  hasPendingUserWork,
  registerBeforeUnloadProtection,
} from "./services/PendingWorkService";
import {
  acceptDatasetCandidate,
  clearDatasetCandidate,
  stageDatasetCandidate,
  type DatasetCandidate,
  type DatasetCandidateSource,
} from "./services/DatasetCandidateService";
import { useLanguage } from "./i18n/LanguageContext";
import { getPresentationMessages } from "./i18n/messages";
import {
  parseRequestedLocale,
  clearTemporaryLocaleResolution,
  readPersistedLocale,
  readTemporaryLocaleResolution,
  resolveLocaleChoice,
  resolveStartupLocale,
  shouldStartHandoff,
  type Locale,
  type LocaleResolution,
  writeTemporaryLocaleResolution,
} from "./services/LocalePreferenceService";
import {
  fetchDatasetHandoff,
  parseDatasetHandoffFragment,
  type DatasetHandoffFragment,
} from "./services/DatasetHandoffService";
import {
  removeDatasetUrlFromCurrentLocation,
  setLocaleInCurrentLocation,
  shouldRemoveDatasetUrlForAcceptedSource,
} from "./services/DatasetHandoffFragmentService";
import {
  buildRelationHandoffUrl,
  classifyRelationHandoffAvailability,
  resolveLiaisonScapeBaseUrl,
} from "./services/CapabilityHandoffSenderService";

type GuardedBackIntent =
  | { kind: "event-changes"; eventId: string; screen: AppState["currentScreen"] }
  | { kind: "event-draft"; eventId: string; screen: AppState["currentScreen"] }
  | { kind: "entity-changes"; entityId: string; screen: AppState["currentScreen"] }
  | { kind: "entity-create-draft"; screen: AppState["currentScreen"] };

type BrowserTraversalConfirmation = {
  kind: DetailDiscardCopyKind;
  eventId?: string;
  entityId?: string;
  currentIndex: number;
  targetIndex: number;
  delta: number;
};

type BrowserTraversalPhase =
  | { kind: "rolling-back"; intent: BrowserTraversalConfirmation }
  | { kind: "replaying"; intent: BrowserTraversalConfirmation }
  | { kind: "rolling-back-header"; targetIndex: number; currentIndex: number };

function App() {
  const { language, setLanguage, setTemporaryLanguage } = useLanguage();
  const copy = getPresentationMessages(language);
  const [requestedLocale] = useState(() => parseRequestedLocale(window.location.hash));
  const [persistedLocale] = useState(() => readPersistedLocale(window.localStorage));
  const [temporaryLocaleResolution, setTemporaryLocaleResolution] = useState(() => {
    try {
      return readTemporaryLocaleResolution(window.sessionStorage);
    } catch {
      return undefined;
    }
  });
  const initialLocaleDecision = resolveStartupLocale(
    requestedLocale,
    persistedLocale,
    temporaryLocaleResolution,
  );
  const [localeResolution, setLocaleResolution] = useState<LocaleResolution>(() =>
    initialLocaleDecision.resolution,
  );
  const [localeConflict, setLocaleConflict] = useState<Locale | null>(() => {
    return initialLocaleDecision.resolution === "unresolved" && requestedLocale.kind === "valid"
      ? requestedLocale.locale
      : null;
  });
  const [startupHandoff] = useState<DatasetHandoffFragment>(() =>
    parseDatasetHandoffFragment(window.location.hash),
  );
  const sample = language === "ja" ? sampleDataset : sampleDatasetEn;
  const storedDataset = (() => {
    try {
      const source = window.localStorage.getItem("narrativeline.lastDataset");
      return source ? importDatasetJson(source).dataset : undefined;
    } catch {
      return undefined;
    }
  })();
  const [state, setState] = useState<AppState>({
    currentScreen: "home",
    currentDialog: null,
    selectedEvent: null,
    selectedEntity: null,
    returnEventId: null,
    returnEntityId: null,
    draftEventId: null,
  });
  const startupLocaleAppliedRef = useRef(false);

  const [dataset, setDataset] = useState<Dataset>(storedDataset ?? sample);
  const datasetRef = useRef(dataset);
  useEffect(() => {
    datasetRef.current = dataset;
  }, [dataset]);
  const [acceptedDatasetBaseline, setAcceptedDatasetBaseline] = useState(() =>
    serializeDatasetBaseline(storedDataset ?? sample),
  );
  const [sourceDatasetUrl, setSourceDatasetUrl] = useState<string | undefined>();
  const [datasetCandidate, setDatasetCandidate] = useState<DatasetCandidate | null>(null);
  const [replacementError, setReplacementError] = useState(false);
  const [handoffLoading, setHandoffLoading] = useState(
    shouldStartHandoff(startupHandoff.kind === "valid", localeResolution),
  );
  const [handoffFailure, setHandoffFailure] = useState<string | null>(() =>
    startupHandoff.kind === "invalid"
      ? "The Dataset handoff link is invalid."
      : null,
  );
  const [pendingSources, setPendingSources] = useState<Record<string, boolean>>({});
  const [eventDraft, setEventDraft] = useState<
    { eventId: string; draft: EventDetailDraft } | undefined
  >();
  const [entityDraft, setEntityDraft] = useState<
    { entityId: string; draft: EntityDetailDraft } | undefined
  >();
  const [entityCreateDraft, setEntityCreateDraft] = useState<EntityCreateDraft>();
  const [guardedBackIntent, setGuardedBackIntent] = useState<GuardedBackIntent | null>(null);
  const [browserTraversalIntent, setBrowserTraversalIntent] = useState<BrowserTraversalConfirmation | null>(null);
  const [shouldAutofocusEntityCreateName, setShouldAutofocusEntityCreateName] = useState(false);
  const datasetModified = isDatasetModified(dataset, acceptedDatasetBaseline);
  const pendingUserWork = hasPendingUserWork(pendingSources);
  const backLabel = language === "ja" ? "\u623b\u308b" : "Back";
  const currentAppStateRef = useRef(state);
  const pendingSourcesRef = useRef(pendingSources);
  const currentNavigationIndexRef = useRef<number | undefined>(undefined);
  const browserTraversalPhaseRef = useRef<BrowserTraversalPhase | null>(null);
  const guardedBackIntentRef = useRef(guardedBackIntent);
  const browserTraversalIntentRef = useRef(browserTraversalIntent);

  useEffect(() => {
    currentAppStateRef.current = state;
    pendingSourcesRef.current = pendingSources;
    guardedBackIntentRef.current = guardedBackIntent;
    browserTraversalIntentRef.current = browserTraversalIntent;
  }, [browserTraversalIntent, guardedBackIntent, pendingSources, state]);

  const localizedHandoffFailure = handoffFailure && language === "ja"
    ? handoffFailure === "The Dataset handoff link is invalid."
      ? "Dataset引き継ぎリンクが無効です。"
      : handoffFailure === "Could not retrieve the Dataset from the handoff link."
        ? "引き継ぎリンクからDatasetを取得できませんでした。"
        : handoffFailure === "The Dataset from the handoff link is not valid JSON."
          ? "引き継ぎリンクのDatasetは有効なJSONではありません。"
          : handoffFailure === "The Dataset from the handoff link failed E2R validation."
            ? "引き継ぎリンクのDatasetはE2R検証に失敗しました。"
            : "引き継ぎリンクのDatasetを開けませんでした。"
    : handoffFailure;
  const setPendingSource = useCallback((source: string, pending: boolean) => {
    pendingSourcesRef.current = { ...pendingSourcesRef.current, [source]: pending };
    setPendingSources((current) =>
      current[source] === pending ? current : { ...current, [source]: pending },
    );
  }, []);
  const handleEventPendingWork = useCallback(
    (pending: boolean) => setPendingSource("eventDetail", pending),
    [setPendingSource],
  );
  const handleEventDraftChange = useCallback(
    (eventId: string, draft: EventDetailDraft) => {
      setEventDraft({ eventId, draft });
    },
    [],
  );
  const handleClearEventDraft = useCallback((eventId: string) => {
    setEventDraft((current) =>
      current?.eventId === eventId ? undefined : current,
    );
    setPendingSource("eventDetail", false);
  }, [setPendingSource]);
  const handleEntityDraftChange = useCallback((entityId: string, draft: EntityDetailDraft) => {
    setEntityDraft({ entityId, draft });
  }, []);
  const handleClearEntityDraft = useCallback((entityId: string) => {
    setEntityDraft((current) => current?.entityId === entityId ? undefined : current);
    setPendingSource("entityDetail", false);
  }, [setPendingSource]);
  const handleEntityCreateDraftChange = useCallback((draft: EntityCreateDraft) => {
    setEntityCreateDraft(draft);
  }, []);
  const handleClearEntityCreateDraft = useCallback(() => {
    setEntityCreateDraft(undefined);
    setPendingSource("entityCreate", false);
  }, [setPendingSource]);
  const handleEntityPendingWork = useCallback(
    (pending: boolean) => setPendingSource("entityDetail", pending),
    [setPendingSource],
  );
  const handleEntityCreatePendingWork = useCallback(
    (pending: boolean) => setPendingSource("entityCreate", pending),
    [setPendingSource],
  );

  useEffect(() => {
    document.documentElement.dataset.pendingUserWork = pendingUserWork ? "true" : "false";
    return () => { delete document.documentElement.dataset.pendingUserWork; };
  }, [pendingUserWork]);

  useEffect(
    () => registerBeforeUnloadProtection(
      window,
      hasLossRisk(datasetModified, pendingUserWork),
    ),
    [datasetModified, pendingUserWork],
  );
  const [importWarnings, setImportWarnings] = useState<DatasetImportWarning[]>([]);
  const restoringHistoryRef = useRef(false);
  const historyInitializedRef = useRef(false);
  const previousScreenRef = useRef(state.currentScreen);
  const startupHandoffStartedRef = useRef(false);
  const effectiveLocale = localeResolution === "unresolved"
    ? language
    : requestedLocale.kind === "valid" && temporaryLocaleResolution?.requestedLocale === requestedLocale.locale
      ? temporaryLocaleResolution.effectiveLocale
      : localeResolution === "requested" && requestedLocale.kind === "valid"
        ? requestedLocale.locale
        : language;
  const liaisonScapeBaseUrl = resolveLiaisonScapeBaseUrl({
    configuredUrl: import.meta.env.VITE_LIAISONSCAPE_URL,
    locationOrigin: window.location.origin,
  });
  const relationHandoffAvailability = classifyRelationHandoffAvailability({
    datasetModified,
    pendingUserWork,
    sourceDatasetUrl,
    recipientBaseUrl: liaisonScapeBaseUrl,
  });
  const getRelationHandoffHref = useCallback((relationId: string) => {
    if (relationHandoffAvailability.kind !== "available") return undefined;
    if (!dataset.relations.some((relation) => relation.id === relationId)) return undefined;
    return buildRelationHandoffUrl({
      recipientBaseUrl: liaisonScapeBaseUrl!,
      datasetUrl: sourceDatasetUrl!,
      targetObjectId: relationId,
      targetObjectType: "Relation",
      requiredCapability: "relation.inspect",
      targetContractVersion: "1",
      locale: effectiveLocale,
    });
  }, [dataset.relations, effectiveLocale, liaisonScapeBaseUrl, relationHandoffAvailability.kind, sourceDatasetUrl]);

  const handleManualLanguageChange = useCallback((nextLanguage: Locale) => {
    setTemporaryLocaleResolution(undefined);
    clearTemporaryLocaleResolution(window.sessionStorage);
    setLanguage(nextLanguage);
    setLocaleInCurrentLocation(window.history, window.location, nextLanguage);
  }, [setLanguage]);

  const resolveSavedLocaleConflict = useCallback(() => {
    const choice = localeConflict
      ? resolveLocaleChoice(language, localeConflict, "saved")
      : undefined;
    if (choice) {
      const temporary = {
        requestedLocale: localeConflict!,
        effectiveLocale: choice.effectiveLocale,
      };
      setTemporaryLocaleResolution(temporary);
      try {
        writeTemporaryLocaleResolution(window.sessionStorage, temporary);
      } catch {
        // Session persistence is optional; the current resolution still applies.
      }
    }
    if (startupHandoff.kind === "valid") setHandoffLoading(true);
    setLocaleResolution("saved");
    setLocaleConflict(null);
  }, [language, localeConflict, startupHandoff.kind]);

  const resolveRequestedLocaleConflict = useCallback(() => {
    if (localeConflict) {
      const choice = resolveLocaleChoice(language, localeConflict, "requested");
      const temporary = {
        requestedLocale: localeConflict,
        effectiveLocale: choice.effectiveLocale,
      };
      setTemporaryLocaleResolution(temporary);
      setTemporaryLanguage(choice.effectiveLocale);
      try {
        writeTemporaryLocaleResolution(window.sessionStorage, temporary);
      } catch {
        // Session persistence is optional; the current resolution still applies.
      }
    }
    if (startupHandoff.kind === "valid") setHandoffLoading(true);
    setLocaleResolution("requested");
    setLocaleConflict(null);
  }, [language, localeConflict, setTemporaryLanguage, startupHandoff.kind]);

  useEffect(() => {
    if (startupLocaleAppliedRef.current || localeResolution === "unresolved") return;
    startupLocaleAppliedRef.current = true;
    if (effectiveLocale === language) return;
    setTemporaryLanguage(effectiveLocale);
  }, [effectiveLocale, language, localeResolution, setTemporaryLanguage]);

  useEffect(() => {
    replaceInitialHistoryEntry(state);
    currentNavigationIndexRef.current = readNarrativeLineNavigationIndex(window.history.state);

    const applyRestoredNavigation = (restored: NonNullable<ReturnType<typeof readNarrativeLineHistoryState>>) => {
      restoringHistoryRef.current = true;
      setShouldAutofocusEntityCreateName(false);
      setState((currentState) => ({
        ...currentState,
        ...reconcileRestoredNavigationState(restored, datasetRef.current),
      }));
    };

    const handlePopState = (event: PopStateEvent) => {
      const restored = readNarrativeLineHistoryState(event.state);
      if (restored === undefined) return;
      const targetIndex = readNarrativeLineNavigationIndex(event.state);
      const phase = browserTraversalPhaseRef.current;

      if (phase?.kind === "rolling-back") {
        if (targetIndex !== phase.intent.currentIndex) return;
        browserTraversalPhaseRef.current = null;
        setBrowserTraversalIntent(phase.intent);
        return;
      }

      if (phase?.kind === "rolling-back-header") {
        if (targetIndex !== phase.currentIndex) return;
        browserTraversalPhaseRef.current = null;
        return;
      }

      if (phase?.kind === "replaying") {
        if (targetIndex !== phase.intent.targetIndex) return;
        browserTraversalPhaseRef.current = null;
        currentNavigationIndexRef.current = targetIndex;
        applyRestoredNavigation(restored);
        return;
      }

      const currentIndex = currentNavigationIndexRef.current;
      const currentState = currentAppStateRef.current;
      const lossRisk = currentState.currentScreen === "eventDetail" && currentState.selectedEvent !== null
        ? currentState.draftEventId === currentState.selectedEvent
          ? { kind: "event-draft" as const, eventId: currentState.selectedEvent }
          : pendingSourcesRef.current.eventDetail === true
            ? { kind: "event-changes" as const, eventId: currentState.selectedEvent }
            : null
        : currentState.currentScreen === "entityDetail" && currentState.selectedEntity !== null && pendingSourcesRef.current.entityDetail === true
          ? { kind: "entity-changes" as const, entityId: currentState.selectedEntity }
          : currentState.currentScreen === "entityCreate" && pendingSourcesRef.current.entityCreate === true
            ? { kind: "entity-create-draft" as const }
            : null;

      const safeRebase = () => {
        rebaseCurrentNavigationEntry({ ...currentState, ...restored });
        pushNavigationHistoryEntry(currentState);
        currentNavigationIndexRef.current = readNarrativeLineNavigationIndex(window.history.state);
      };

      if (guardedBackIntentRef.current && (targetIndex === undefined || currentIndex === undefined)) {
        safeRebase();
        return;
      }
      if (guardedBackIntentRef.current && targetIndex !== currentIndex) {
        browserTraversalPhaseRef.current = { kind: "rolling-back-header", targetIndex: targetIndex!, currentIndex: currentIndex! };
        window.history.go(currentIndex! - targetIndex!);
        return;
      }
      if (browserTraversalIntentRef.current && targetIndex !== undefined && currentIndex !== undefined && targetIndex !== currentIndex) {
        browserTraversalPhaseRef.current = { kind: "rolling-back", intent: browserTraversalIntentRef.current };
        window.history.go(currentIndex - targetIndex);
        return;
      }

      if (lossRisk && (currentIndex === undefined || targetIndex === undefined)) {
        safeRebase();
        const intent: BrowserTraversalConfirmation = {
          ...lossRisk,
          eventId: currentState.selectedEvent ?? undefined,
          currentIndex: 1,
          targetIndex: 0,
          delta: -1,
        };
        setBrowserTraversalIntent(intent);
        return;
      }

      if (targetIndex !== undefined && currentIndex !== undefined && targetIndex !== currentIndex && lossRisk) {
        const intent: BrowserTraversalConfirmation = {
          ...lossRisk,
          eventId: currentState.selectedEvent!,
          currentIndex,
          targetIndex,
          delta: targetIndex - currentIndex,
        };
        browserTraversalPhaseRef.current = { kind: "rolling-back", intent };
        window.history.go(-intent.delta);
        return;
      }

      if (targetIndex !== undefined) currentNavigationIndexRef.current = targetIndex;
      else currentNavigationIndexRef.current = undefined;
      const reconciled = reconcileRestoredNavigationState(restored, datasetRef.current);
      if (JSON.stringify(reconciled) !== JSON.stringify(restored)) replaceCurrentNavigationEntry({ ...currentState, ...reconciled });
      applyRestoredNavigation(reconciled);
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
    // The listener belongs to the application lifetime. Navigation entries
    // are written by NavigationService, not by every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!historyInitializedRef.current) {
      historyInitializedRef.current = true;
      previousScreenRef.current = state.currentScreen;
      return;
    }

    if (restoringHistoryRef.current) {
      restoringHistoryRef.current = false;
      previousScreenRef.current = state.currentScreen;
      return;
    }

    if (state.currentScreen === previousScreenRef.current) return;

    previousScreenRef.current = state.currentScreen;

    pushNavigationHistoryEntry(state);
    currentNavigationIndexRef.current = readNarrativeLineNavigationIndex(window.history.state);
  }, [state]);

  useEffect(() => {
    window.localStorage.setItem(
      "narrativeline.lastDataset",
      JSON.stringify(dataset),
    );
  }, [dataset]);

  useEffect(() => {
    const previousScrollRestoration = window.history.scrollRestoration;
    window.history.scrollRestoration = "manual";
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });

    return () => {
      window.history.scrollRestoration = previousScrollRestoration;
    };
  }, [state.currentScreen]);

  const acceptStagedDataset = (
    candidateToAccept = datasetCandidate,
    warningsToKeep: DatasetImportWarning[] = [],
  ) => {
    if (!candidateToAccept) return;
    const acceptedDataset = acceptDatasetCandidate(candidateToAccept);
    setDataset(acceptedDataset);
    setAcceptedDatasetBaseline(serializeDatasetBaseline(acceptedDataset));
    setDatasetCandidate(clearDatasetCandidate());
    setPendingSources({});
    setEventDraft(undefined);
    setEntityDraft(undefined);
    setEntityCreateDraft(undefined);
    setReplacementError(false);
    setImportWarnings(warningsToKeep);
    setSourceDatasetUrl(
      candidateToAccept.source === "handoff" && startupHandoff.kind === "valid"
        ? startupHandoff.datasetUrl
        : undefined,
    );
    if (shouldRemoveDatasetUrlForAcceptedSource(candidateToAccept.source)) {
      removeDatasetUrlFromCurrentLocation(window.history, window.location);
    }
    setState((currentState) =>
      navigate(
        {
          ...currentState,
          selectedEvent: null,
          selectedEntity: null,
          returnEventId: null,
          returnEntityId: null,
          draftEventId: null,
        },
        "timeline",
      ),
    );
  };

  const handleOpenDataset = (
    nextDataset: Dataset,
    warnings: DatasetImportWarning[] = [],
    source: DatasetCandidateSource = "local",
  ) => {
    const candidate = stageDatasetCandidate(nextDataset, source);
    setDatasetCandidate(candidate);
    setImportWarnings(warnings);
    setReplacementError(false);
    if (!datasetModified && !pendingUserWork) {
      acceptStagedDataset(candidate, warnings);
    }

    if (datasetModified || pendingUserWork) return;
    return;
  };

  const handleDiscardReplacement = () => {
    acceptStagedDataset();
  };

  const handleCancelReplacement = () => {
    setDatasetCandidate(clearDatasetCandidate());
    setReplacementError(false);
  };

  const handleExportAndContinue = () => {
    const result = exportDatasetJson(dataset);
    if (!downloadDatasetExport(dataset, result)) {
      setReplacementError(true);
      return;
    }
    setSourceDatasetUrl(undefined);
    setAcceptedDatasetBaseline(serializeDatasetBaseline(dataset));
    acceptStagedDataset();
  };

  const handleExportPendingReplacement = () => {
    const result = exportDatasetJson(dataset);
    if (!downloadDatasetExport(dataset, result)) {
      setReplacementError(true);
      return;
    }
    setSourceDatasetUrl(undefined);
    setAcceptedDatasetBaseline(serializeDatasetBaseline(dataset));
    setReplacementError(false);
  };

  const handleImportDataset = (source: string): DatasetImportResult => {
    const result = importDatasetJson(source);

    if (result.isValid && result.dataset) {
      const warnings = result.issues.filter(
        (issue): issue is DatasetImportWarning =>
          "severity" in issue && issue.severity === "warning",
      );
      handleOpenDataset(result.dataset, warnings, "local");
    }

    return result;
  };

  useEffect(() => {
    if (localeResolution === "unresolved") return;
    if (startupHandoffStartedRef.current) return;
    startupHandoffStartedRef.current = true;

    const handoff = startupHandoff;
    if (handoff.kind !== "valid") {
      return;
    }

    void (async () => {
      try {
        const fetched = await fetchDatasetHandoff(handoff.datasetUrl);
        if (!fetched.ok) {
          setHandoffFailure("Could not retrieve the Dataset from the handoff link.");
          return;
        }

        const result = importDatasetJson(fetched.source);
        if (!result.isValid || !result.dataset) {
          const hasJsonParseError = result.issues.some(
            (issue) => issue.code === "json_parse_error",
          );
          setHandoffFailure(
            hasJsonParseError
              ? "The Dataset from the handoff link is not valid JSON."
              : "The Dataset from the handoff link failed E2R validation.",
          );
          return;
        }

        const warnings = result.issues.filter(
          (issue): issue is DatasetImportWarning =>
            "severity" in issue && issue.severity === "warning",
        );
        handleOpenDataset(result.dataset, warnings, "handoff");
      } catch {
        setHandoffFailure("Could not open the Dataset from the handoff link.");
      } finally {
        setHandoffLoading(false);
      }
    })();
    // Startup handoff is intentionally inspected once. It must not refetch
    // when ordinary application state changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localeResolution]);

  const handleResumeDataset = () => {
    setImportWarnings([]);
    setState((currentState) =>
      navigate(
        {
          ...currentState,
          selectedEvent: null,
          selectedEntity: null,
          returnEventId: null,
          returnEntityId: null,
          draftEventId: null,
        },
        "timeline",
      ),
    );
  };

  const handleNavigateHome = () => {
    setState((currentState) => navigate(currentState, "home"));
  };

  const handleExportDataset = (): DatasetExportResult => {
    const result = exportDatasetJson(dataset);
    if (result.json !== undefined) {
      setSourceDatasetUrl(undefined);
      setAcceptedDatasetBaseline(serializeDatasetBaseline(dataset));
    }
    return result;
  };

  const handleUpdateDatasetTitle = (title: string) => {
    setDataset((currentDataset) => updateDatasetTitle(currentDataset, title));
  };

  const handleUpdateEvent = (
    eventId: string,
    updates: {
      historyDate?: HistoryDate;
      name?: string;
      description?: string;
    },
  ) => {
    setEventDraft(undefined);
    setPendingSource("eventDetail", false);
    setDataset(updateEvent(dataset, eventId, updates));
  };
  const handleSaveAndOpenEntityPicker = (
    eventId: string,
    updates: {
      historyDate?: HistoryDate;
      name?: string;
      description?: string;
    },
  ) => {
    setEventDraft(undefined);
    setPendingSource("eventDetail", false);
    setDataset((currentDataset) =>
      updateEvent(currentDataset, eventId, updates),
    );
    setState((currentState) =>
      navigate(
        {
          ...currentState,
          selectedEvent: eventId,
          draftEventId: null,
        },
        "entityPicker",
      ),
    );
  };
  const handleUpdateEntity = (
    entityId: string,
    updates: {
      name?: string;
      description?: string;
    },
  ) => {
    handleClearEntityDraft(entityId);
    setDataset(updateEntity(dataset, entityId, updates));
  };
  const handleUpdateCoordinate = (
    objectId: string,
    spaceId: string,
    values: Record<string, number>,
  ) => {
    const result = updateObjectCoordinate(
      datasetRef.current,
      objectId,
      spaceId,
      values,
    );
    if (result.status === "updated") {
      datasetRef.current = result.dataset;
      setDataset(result.dataset);
    }
    return result.status;
  };
  const handleSelectEvent = (eventId: string) => {
    const nextState = {
      ...state,
      selectedEvent: eventId,
    };
    setState(nextState);
    replaceCurrentNavigationEntry(nextState);
    currentNavigationIndexRef.current = readNarrativeLineNavigationIndex(window.history.state);
  };
  const handleEditEvent = (eventId: string) => {
    setState(
      navigate(
        {
          ...state,
          selectedEvent: eventId,
        },
        "eventDetail",
      ),
    );
  };
  const handleSelectEntity = (entityId: string) => {
    setState(
      navigate(
        {
          ...state,
          selectedEntity: entityId,
          returnEventId:
            state.currentScreen === "eventDetail" ? state.selectedEvent : null,
          returnEntityId:
            state.currentScreen === "eventDetail" ? entityId : null,
        },
        "entityDetail",
      ),
    );
  };
  const handleAssociateEntity = (entityId: string) => {
    if (!state.selectedEvent) {
      return;
    }

    const eventId = state.selectedEvent;
    setDataset((currentDataset) =>
      addEventEntityRelation(currentDataset, eventId, entityId),
    );
    setState((currentState) => navigate(currentState, "eventDetail"));
  };
  const handleRemoveEventEntity = (eventId: string, entityId: string) => {
    setDataset((currentDataset) =>
      removeEventEntityRelations(currentDataset, eventId, entityId),
    );
  };
  const handleCreateAndAssociateEntity = (name: string, description: string) => {
    if (!state.selectedEvent) {
      return;
    }

    const eventId = state.selectedEvent;
    handleClearEntityCreateDraft();
    setDataset((currentDataset) => {
      const result = addEntity(currentDataset, name, description);

      return addEventEntityRelation(result.dataset, eventId, result.entityId);
    });
    setState((currentState) => navigate(currentState, "eventDetail"));
  };
  const handleEntityDetailBack = () => {
    if (state.selectedEntity) handleClearEntityDraft(state.selectedEntity);
    setPendingSource("entityDetail", false);
    if (state.returnEventId) {
      setState(
        navigate(
          { ...state, selectedEvent: state.returnEventId },
          "eventDetail",
        ),
      );
      return;
    }

    setState(navigate(state, "timeline"));
  };
  const handleEntityPickerBack = () => {
    setState((currentState) => navigate(currentState, "eventDetail"));
  };
  const handleEntityCreateBack = () => {
    handleClearEntityCreateDraft();
    setState((currentState) => navigate(currentState, "entityPicker"));
  };
  const requestEventBack = () => {
    if (!state.selectedEvent) return;
    if (state.draftEventId === state.selectedEvent) {
      setGuardedBackIntent({ kind: "event-draft", eventId: state.selectedEvent, screen: state.currentScreen });
      return;
    }
    if (pendingSources.eventDetail) {
      setGuardedBackIntent({ kind: "event-changes", eventId: state.selectedEvent, screen: state.currentScreen });
      return;
    }
    handleCancelEventDetail(state.selectedEvent, false);
  };
  const requestEntityDetailBack = () => {
    if (!state.selectedEntity) return;
    if (pendingSources.entityDetail) {
      setGuardedBackIntent({ kind: "entity-changes", entityId: state.selectedEntity, screen: state.currentScreen });
      return;
    }
    handleEntityDetailBack();
  };
  const requestEntityCreateBack = () => {
    if (pendingSources.entityCreate || entityCreateDraft) {
      setGuardedBackIntent({ kind: "entity-create-draft", screen: state.currentScreen });
      return;
    }
    handleEntityCreateBack();
  };
  const handleConfirmedBackDiscard = () => {
    const intent = guardedBackIntent?.screen === state.currentScreen ? guardedBackIntent : null;
    setGuardedBackIntent(null);
    if (!intent) return;
    if (intent.kind === "event-changes") {
      handleCancelEventDetail(intent.eventId, false);
    } else if (intent.kind === "event-draft") {
      handleCancelEventDetail(intent.eventId, true);
    } else if (intent.kind === "entity-changes") {
      handleEntityDetailBack();
    } else {
      handleEntityCreateBack();
    }
  };
  const renderGuardedBackDialog = () => {
    if (!guardedBackIntent || guardedBackIntent.screen !== state.currentScreen) return null;
    const kind: DetailDiscardCopyKind = guardedBackIntent.kind;
    return (
      <DetailBackConfirmationDialog
        kind={kind}
        onCancel={() => setGuardedBackIntent(null)}
        onDiscard={handleConfirmedBackDiscard}
      />
    );
  };
  const discardBrowserCurrentWork = (intent: BrowserTraversalConfirmation) => {
    if (intent.kind === "event-draft" && intent.eventId) {
      replaceCurrentNavigationEntry({ ...currentAppStateRef.current, currentScreen: "timeline", selectedEvent: null, selectedEntity: null, returnEventId: null, returnEntityId: null, draftEventId: null });
    } else if (intent.kind === "entity-create-draft") {
      replaceCurrentNavigationEntry({ ...currentAppStateRef.current, currentScreen: "entityPicker", selectedEntity: null });
    }
    if (intent.kind === "event-changes" && intent.eventId) {
      handleClearEventDraft(intent.eventId);
    } else if (intent.kind === "event-draft" && intent.eventId) {
      handleClearEventDraft(intent.eventId);
      setDataset((currentDataset) => deleteEvent(currentDataset, intent.eventId!));
      setState((currentState) => ({
        ...currentState,
        draftEventId: currentState.draftEventId === intent.eventId ? null : currentState.draftEventId,
      }));
    } else if (intent.kind === "entity-changes") {
      if (intent.entityId) handleClearEntityDraft(intent.entityId);
      else setPendingSource("entityDetail", false);
    } else {
      handleClearEntityCreateDraft();
    }
  };
  const renderBrowserTraversalDialog = () => {
    if (!browserTraversalIntent) return null;
    return (
      <DetailBackConfirmationDialog
        kind={browserTraversalIntent.kind}
        onCancel={() => setBrowserTraversalIntent(null)}
        onDiscard={() => {
          const intent = browserTraversalIntent;
          discardBrowserCurrentWork(intent);
          setBrowserTraversalIntent(null);
          browserTraversalPhaseRef.current = { kind: "replaying", intent };
          window.history.go(intent.delta);
        }}
      />
    );
  };
  const handleDeleteEvent = (eventId: string) => {
    handleClearEventDraft(eventId);
    setDataset(deleteEvent(dataset, eventId));

    setState(
      navigate(
        {
          ...state,
          selectedEvent: null,
          draftEventId: null,
        },
        "timeline",
      ),
    );
  };
  const handleCancelEventDetail = (
    eventId: string,
    discardDraft: boolean,
  ) => {
    handleClearEventDraft(eventId);
    if (discardDraft) {
      setDataset((currentDataset) => deleteEvent(currentDataset, eventId));
    }

    setState((currentState) =>
      navigate(
        {
          ...currentState,
          selectedEvent: discardDraft ? null : currentState.selectedEvent,
          draftEventId:
            currentState.draftEventId === eventId
              ? null
              : currentState.draftEventId,
        },
        "timeline",
      ),
    );
  };
  const handleDeleteEntity = (entityId: string) => {
    handleClearEntityDraft(entityId);
    setDataset((currentDataset) => deleteEntity(currentDataset, entityId));

    setState(
      navigate(
        {
          ...state,
          selectedEntity: null,
        },
        "timeline",
      ),
    );
  };
  const handleDeleteRelation = (relationId: string) => {
    setDataset((currentDataset) => deleteRelation(currentDataset, relationId));
  };

  const handleAddEvent = () => {
    const result = addEvent(dataset, language);

    setDataset(result.dataset);
    setState((currentState) =>
      navigate(
        {
          ...currentState,
          selectedEvent: result.eventId,
          draftEventId: result.eventId,
        },
        "eventDetail",
      ),
    );
  };

  const renderDatasetReplacementFeedback = () => (
    <>
      {datasetCandidate && (datasetModified || pendingUserWork) && (
        <DatasetReplacementDialog
          datasetModified={datasetModified}
          pendingUserWork={pendingUserWork}
          busy={false}
          onCancel={handleCancelReplacement}
          onDiscard={handleDiscardReplacement}
          onExportAndContinue={handleExportAndContinue}
          onExportDataset={handleExportPendingReplacement}
        />
      )}
      {replacementError && <p role="alert">{copy.replacementExportFailure}</p>}
    </>
  );

  if (state.currentScreen === "home") {
    return (
      <AppFrame showFooter onHome={handleNavigateHome} onLanguageChange={handleManualLanguageChange}>
        <HomeScreen
          onOpenTimeline={() => handleOpenDataset(sample, [], "sample")}
          onResumeDataset={handleResumeDataset}
          hasResumeDataset={storedDataset !== undefined}
          onCreateDataset={() => handleOpenDataset(createDataset(), [], "new")}
          onImportDataset={handleImportDataset}
          handoffLoading={handoffLoading}
          handoffFailure={localizedHandoffFailure}
        />
        {localeConflict && (
          <LocaleConflictDialog
            savedLanguage={language}
            requestedLanguage={localeConflict}
            onUseSavedLanguage={resolveSavedLocaleConflict}
            onUseRequestedLanguage={resolveRequestedLocaleConflict}
          />
        )}
        {renderDatasetReplacementFeedback()}
      </AppFrame>
    );
  }
  if (state.currentScreen === "entityDetail") {
    return (
      <AppFrame
        onHome={handleNavigateHome}
        onLanguageChange={handleManualLanguageChange}
        headerNavigationAction={{ label: backLabel, onClick: requestEntityDetailBack }}
      >
        <EntityDetailScreen
          key={state.selectedEntity}
          dataset={dataset}
          selectedEntity={state.selectedEntity}
          onUpdateEntity={handleUpdateEntity}
          onPendingWorkChange={handleEntityPendingWork}
          pendingDraft={
            entityDraft?.entityId === state.selectedEntity ? entityDraft.draft : undefined
          }
          onDraftChange={handleEntityDraftChange}
          onClearDraft={handleClearEntityDraft}
          onUpdateCoordinate={handleUpdateCoordinate}
          onDeleteEntity={handleDeleteEntity}
          onDeleteRelation={handleDeleteRelation}
          getRelationHandoffHref={getRelationHandoffHref}
          onSelectEvent={handleEditEvent}
          onBack={handleEntityDetailBack}
        />
        {renderGuardedBackDialog()}
        {renderBrowserTraversalDialog()}
      </AppFrame>
    );
  }
  if (state.currentScreen === "eventDetail") {
    return (
      <AppFrame
        onHome={handleNavigateHome}
        onLanguageChange={handleManualLanguageChange}
        headerNavigationAction={{ label: backLabel, onClick: requestEventBack }}
      >
        <EventDetailScreen
          key={state.selectedEvent}
          dataset={dataset}
          selectedEvent={state.selectedEvent}
          focusedRelatedEntityId={state.returnEntityId}
          onUpdateEvent={handleUpdateEvent}
          onPendingWorkChange={handleEventPendingWork}
          pendingDraft={
            eventDraft?.eventId === state.selectedEvent
              ? eventDraft.draft
              : undefined
          }
          onDraftChange={handleEventDraftChange}
          onClearDraft={handleClearEventDraft}
          onDeleteEvent={handleDeleteEvent}
          onSelectEntity={handleSelectEntity}
          onSaveAndOpenEntityPicker={handleSaveAndOpenEntityPicker}
          onRemoveEventEntity={handleRemoveEventEntity}
          isDraft={state.draftEventId === state.selectedEvent}
          onCancel={handleCancelEventDetail}
        />
        {renderGuardedBackDialog()}
        {renderBrowserTraversalDialog()}
      </AppFrame>
    );
  }
  if (state.currentScreen === "entityPicker" && state.selectedEvent) {
    return (
      <AppFrame
        onHome={handleNavigateHome}
        onLanguageChange={handleManualLanguageChange}
        headerNavigationAction={{ label: backLabel, onClick: handleEntityPickerBack }}
      >
        <EntityPickerScreen
          dataset={dataset}
          eventId={state.selectedEvent}
          onSelectEntity={handleAssociateEntity}
          hasPendingEntityCreateDraft={entityCreateDraft !== undefined}
          onOpenCreateEntity={() =>
            (setShouldAutofocusEntityCreateName(entityCreateDraft === undefined),
            setState((currentState) => navigate(currentState, "entityCreate")))
          }
          onCancel={handleEntityPickerBack}
        />
      </AppFrame>
    );
  }
  if (state.currentScreen === "entityCreate" && state.selectedEvent) {
    return (
      <AppFrame
        onHome={handleNavigateHome}
        onLanguageChange={handleManualLanguageChange}
        headerNavigationAction={{ label: backLabel, onClick: requestEntityCreateBack }}
      >
        <EntityCreateScreen
          onCreate={handleCreateAndAssociateEntity}
          onPendingWorkChange={handleEntityCreatePendingWork}
          pendingDraft={entityCreateDraft}
          onDraftChange={handleEntityCreateDraftChange}
          onClearDraft={handleClearEntityCreateDraft}
          shouldAutofocusName={shouldAutofocusEntityCreateName}
          onAutofocusNameConsumed={() => setShouldAutofocusEntityCreateName(false)}
          onCancel={handleEntityCreateBack}
        />
        {renderGuardedBackDialog()}
        {renderBrowserTraversalDialog()}
      </AppFrame>
    );
  }
  return (
    <AppFrame
      onHome={handleNavigateHome}
      onLanguageChange={handleManualLanguageChange}
      headerNavigationAction={{
        label: language === "ja" ? "ホーム" : "Home",
        onClick: handleNavigateHome,
      }}
    >
      <TimelineScreen
        dataset={dataset}
        datasetModified={datasetModified}
        importWarnings={importWarnings}
        onUpdateDatasetTitle={handleUpdateDatasetTitle}
        selectedEvent={state.selectedEvent}
        onSelectEvent={handleSelectEvent}
        onEditEvent={handleEditEvent}
        onAddEvent={handleAddEvent}
        onImportDataset={handleImportDataset}
        onExportDataset={handleExportDataset}
      />
      {renderDatasetReplacementFeedback()}
    </AppFrame>
  );
}

export default App;
