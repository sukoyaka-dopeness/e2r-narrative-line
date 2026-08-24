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
import {
  navigate,
  pushNavigationHistoryEntry,
  replaceCurrentNavigationEntry,
  readNarrativeLineHistoryState,
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
  const [shouldAutofocusEntityCreateName, setShouldAutofocusEntityCreateName] = useState(false);
  const datasetModified = isDatasetModified(dataset, acceptedDatasetBaseline);
  const pendingUserWork = hasPendingUserWork(pendingSources);
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

    const handlePopState = (event: PopStateEvent) => {
      const restored = readNarrativeLineHistoryState(event.state);
      if (restored === undefined) return;

      restoringHistoryRef.current = true;
      setShouldAutofocusEntityCreateName(false);
      setState((currentState) => ({
        ...currentState,
        ...reconcileRestoredNavigationState(restored, datasetRef.current),
      }));
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

    if (state.currentScreen === previousScreenRef.current) return;

    previousScreenRef.current = state.currentScreen;
    if (restoringHistoryRef.current) {
      restoringHistoryRef.current = false;
      return;
    }

    pushNavigationHistoryEntry(state);
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
    setAcceptedDatasetBaseline(serializeDatasetBaseline(dataset));
    acceptStagedDataset();
  };

  const handleExportPendingReplacement = () => {
    const result = exportDatasetJson(dataset);
    if (!downloadDatasetExport(dataset, result)) {
      setReplacementError(true);
      return;
    }
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
    setDataset(deleteEntity(dataset, entityId));

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
      </AppFrame>
    );
  }
  if (state.currentScreen === "entityDetail") {
    return (
      <AppFrame onHome={handleNavigateHome} onLanguageChange={handleManualLanguageChange}>
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
          onSelectEvent={handleEditEvent}
          onBack={() => {
            if (state.selectedEntity) handleClearEntityDraft(state.selectedEntity);
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
          }}
        />
      </AppFrame>
    );
  }
  if (state.currentScreen === "eventDetail") {
    return (
      <AppFrame onHome={handleNavigateHome} onLanguageChange={handleManualLanguageChange}>
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
      </AppFrame>
    );
  }
  if (state.currentScreen === "entityPicker" && state.selectedEvent) {
    return (
      <AppFrame onHome={handleNavigateHome} onLanguageChange={handleManualLanguageChange}>
        <EntityPickerScreen
          dataset={dataset}
          eventId={state.selectedEvent}
          onSelectEntity={handleAssociateEntity}
          hasPendingEntityCreateDraft={entityCreateDraft !== undefined}
          onOpenCreateEntity={() =>
            (setShouldAutofocusEntityCreateName(entityCreateDraft === undefined),
            setState((currentState) => navigate(currentState, "entityCreate")))
          }
          onCancel={() =>
            setState((currentState) => navigate(currentState, "eventDetail"))
          }
        />
      </AppFrame>
    );
  }
  if (state.currentScreen === "entityCreate" && state.selectedEvent) {
    return (
      <AppFrame onHome={handleNavigateHome} onLanguageChange={handleManualLanguageChange}>
        <EntityCreateScreen
          onCreate={handleCreateAndAssociateEntity}
          onPendingWorkChange={handleEntityCreatePendingWork}
          pendingDraft={entityCreateDraft}
          onDraftChange={handleEntityCreateDraftChange}
          onClearDraft={handleClearEntityCreateDraft}
          shouldAutofocusName={shouldAutofocusEntityCreateName}
          onAutofocusNameConsumed={() => setShouldAutofocusEntityCreateName(false)}
          onCancel={() =>
            (handleClearEntityCreateDraft(),
            setState((currentState) => navigate(currentState, "entityPicker"))
            )
          }
        />
      </AppFrame>
    );
  }
  return (
    <AppFrame onHome={handleNavigateHome} onLanguageChange={handleManualLanguageChange}>
      <TimelineScreen
        dataset={dataset}
        datasetModified={datasetModified}
        importWarnings={importWarnings}
        onUpdateDatasetTitle={handleUpdateDatasetTitle}
        selectedEvent={state.selectedEvent}
        onSelectEvent={handleSelectEvent}
        onEditEvent={handleEditEvent}
        onAddEvent={handleAddEvent}
        onExportDataset={handleExportDataset}
        onBackToHome={() => setState(navigate(state, "home"))}
      />
    </AppFrame>
  );
}

export default App;
