import { useCallback, useEffect, useRef, useState } from "react";
import { HomeScreen } from "./screens/HomeScreen";
import { TimelineScreen } from "./screens/TimelineScreen";
import { EventDetailScreen } from "./screens/EventDetailScreen";
import { EntityDetailScreen } from "./screens/EntityDetailScreen";
import { EntityPickerScreen } from "./screens/EntityPickerScreen";
import { EntityCreateScreen } from "./screens/EntityCreateScreen";
import { AppFrame } from "./components/AppFrame";
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
import { hasPendingUserWork } from "./services/PendingWorkService";
import {
  acceptDatasetCandidate,
  clearDatasetCandidate,
  stageDatasetCandidate,
  type DatasetCandidate,
  type DatasetCandidateSource,
} from "./services/DatasetCandidateService";
import { useLanguage } from "./i18n/LanguageContext";

function App() {
  const { language } = useLanguage();
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

  const [dataset, setDataset] = useState<Dataset>(storedDataset ?? sample);
  const datasetRef = useRef(dataset);
  useEffect(() => {
    datasetRef.current = dataset;
  }, [dataset]);
  const [acceptedDatasetBaseline, setAcceptedDatasetBaseline] = useState(() =>
    serializeDatasetBaseline(storedDataset ?? sample),
  );
  const [, setDatasetCandidate] = useState<DatasetCandidate | null>(null);
  const [pendingSources, setPendingSources] = useState<Record<string, boolean>>({});
  const datasetModified = isDatasetModified(dataset, acceptedDatasetBaseline);
  const pendingUserWork = hasPendingUserWork(pendingSources);
  const setPendingSource = useCallback((source: string, pending: boolean) => {
    setPendingSources((current) =>
      current[source] === pending ? current : { ...current, [source]: pending },
    );
  }, []);
  const handleEventPendingWork = useCallback(
    (pending: boolean) => setPendingSource("eventDetail", pending),
    [setPendingSource],
  );
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
  const [importWarnings, setImportWarnings] = useState<DatasetImportWarning[]>([]);
  const restoringHistoryRef = useRef(false);
  const historyInitializedRef = useRef(false);
  const previousScreenRef = useRef(state.currentScreen);

  useEffect(() => {
    replaceInitialHistoryEntry(state);

    const handlePopState = (event: PopStateEvent) => {
      const restored = readNarrativeLineHistoryState(event.state);
      if (restored === undefined) return;

      restoringHistoryRef.current = true;
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

  const handleOpenDataset = (
    nextDataset: Dataset,
    warnings: DatasetImportWarning[] = [],
    source: DatasetCandidateSource = "local",
  ) => {
    const candidate = stageDatasetCandidate(nextDataset, source);
    setDatasetCandidate(candidate);
    const acceptedDataset = acceptDatasetCandidate(candidate);
    setDataset(acceptedDataset);
    setAcceptedDatasetBaseline(serializeDatasetBaseline(acceptedDataset));
    setDatasetCandidate(clearDatasetCandidate());
    setImportWarnings(warnings);
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
    setDataset((currentDataset) => {
      const result = addEntity(currentDataset, name, description);

      return addEventEntityRelation(result.dataset, eventId, result.entityId);
    });
    setState((currentState) => navigate(currentState, "eventDetail"));
  };
  const handleDeleteEvent = (eventId: string) => {
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
      <AppFrame showFooter>
        <HomeScreen
          onOpenTimeline={() => handleOpenDataset(sample, [], "sample")}
          onResumeDataset={handleResumeDataset}
          hasResumeDataset={storedDataset !== undefined}
          onCreateDataset={() => handleOpenDataset(createDataset(), [], "new")}
          onImportDataset={handleImportDataset}
        />
      </AppFrame>
    );
  }
  if (state.currentScreen === "entityDetail") {
    return (
      <AppFrame>
        <EntityDetailScreen
          dataset={dataset}
          selectedEntity={state.selectedEntity}
          onUpdateEntity={handleUpdateEntity}
          onPendingWorkChange={handleEntityPendingWork}
          onUpdateCoordinate={handleUpdateCoordinate}
          onDeleteEntity={handleDeleteEntity}
          onSelectEvent={handleEditEvent}
          onBack={() => {
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
      <AppFrame>
        <EventDetailScreen
          dataset={dataset}
          selectedEvent={state.selectedEvent}
          focusedRelatedEntityId={state.returnEntityId}
          onUpdateEvent={handleUpdateEvent}
          onPendingWorkChange={handleEventPendingWork}
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
      <AppFrame>
        <EntityPickerScreen
          dataset={dataset}
          eventId={state.selectedEvent}
          onSelectEntity={handleAssociateEntity}
          onOpenCreateEntity={() =>
            setState((currentState) => navigate(currentState, "entityCreate"))
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
      <AppFrame>
        <EntityCreateScreen
          onCreate={handleCreateAndAssociateEntity}
          onPendingWorkChange={handleEntityCreatePendingWork}
          onCancel={() =>
            setState((currentState) => navigate(currentState, "entityPicker"))
          }
        />
      </AppFrame>
    );
  }
  return (
    <AppFrame>
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
