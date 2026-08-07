import { useEffect, useState } from "react";
import { HomeScreen } from "./screens/HomeScreen";
import { TimelineScreen } from "./screens/TimelineScreen";
import { EventDetailScreen } from "./screens/EventDetailScreen";
import { EntityDetailScreen } from "./screens/EntityDetailScreen";
import { EntityPickerScreen } from "./screens/EntityPickerScreen";
import { AppFrame } from "./components/AppFrame";
import { navigate } from "./services/NavigationService";
import { sampleDataset, sampleDatasetEn } from "./sample/sampleDataset";
import type { AppState } from "./state/AppState";
import type { Dataset } from "./models/Dataset";
import {
  createDataset,
  exportDatasetJson,
  updateDatasetTitle,
  importDatasetJson,
  type DatasetImportIssue,
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
import type { CoreDatasetValidationIssue } from "./services/ValidationService";
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
    draftEventId: null,
  });

  const [dataset, setDataset] = useState<Dataset>(storedDataset ?? sample);
  const [importWarnings, setImportWarnings] = useState<CoreDatasetValidationIssue[]>([]);

  useEffect(() => {
    window.localStorage.setItem(
      "narrativeline.lastDataset",
      JSON.stringify(dataset),
    );
  }, [dataset]);

  const handleOpenDataset = (
    nextDataset: Dataset,
    warnings: CoreDatasetValidationIssue[] = [],
  ) => {
    setDataset(nextDataset);
    setImportWarnings(warnings);
    setState((currentState) =>
      navigate(
        {
          ...currentState,
          selectedEvent: null,
          selectedEntity: null,
          draftEventId: null,
        },
        "timeline",
      ),
    );
  };

  const handleImportDataset = (source: string): DatasetImportResult => {
    const result = importDatasetJson(source);

    if (result.dataset) {
      const warnings = result.issues.filter(
        (issue): issue is DatasetImportIssue & { severity: "warning" } =>
          "severity" in issue && issue.severity === "warning",
      );
      handleOpenDataset(result.dataset, warnings);
    }

    return result;
  };

  const handleExportDataset = (): DatasetExportResult =>
    exportDatasetJson(dataset);

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
  const handleSelectEvent = (eventId: string) => {
    setState({
      ...state,
      selectedEvent: eventId,
    });
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
  const handleCreateAndAssociateEntity = (name: string) => {
    if (!state.selectedEvent) {
      return;
    }

    const eventId = state.selectedEvent;
    setDataset((currentDataset) => {
      const result = addEntity(currentDataset, name);

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
    const result = addEvent(dataset);

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
      <AppFrame>
        <HomeScreen
          onOpenTimeline={() => handleOpenDataset(sample)}
          onResumeDataset={() => handleOpenDataset(dataset)}
          hasResumeDataset={storedDataset !== undefined}
          onCreateDataset={() => handleOpenDataset(createDataset())}
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
          onDeleteEntity={handleDeleteEntity}
          onSelectEvent={handleEditEvent}
          onBackToTimeline={() => setState(navigate(state, "timeline"))}
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
          onUpdateEvent={handleUpdateEvent}
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
          onCreateEntity={handleCreateAndAssociateEntity}
          onCancel={() =>
            setState((currentState) => navigate(currentState, "eventDetail"))
          }
        />
      </AppFrame>
    );
  }
  return (
    <AppFrame>
      <TimelineScreen
        dataset={dataset}
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
