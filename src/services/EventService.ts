import type { Dataset } from "../models/Dataset";
import type { Event } from "../models/Event";
import type { HistoryDate } from "./HistoryService";
import { validateHistoryDate } from "./HistoryService.ts";
import { createCoreObjectId } from "./IdentifierService.ts";

type AddEventResult = {
  dataset: Dataset;
  eventId: string;
};

export function addEvent(dataset: Dataset, language: "en" | "ja" = "en"): AddEventResult {
  const eventId = createCoreObjectId(dataset);

  return {
    dataset: {
      ...dataset,
      events: [
        ...dataset.events,
        {
          id: eventId,
          name: language === "ja" ? "新しいできごと" : "New Event",
          description: "",
        },
      ],
    },
    eventId,
  };
}

function setEventHistoryDate(event: Event, historyDate: HistoryDate): Event {
  const validationError = validateHistoryDate(historyDate);

  if (validationError) {
    throw new RangeError(`Invalid History date: ${validationError}`);
  }

  const currentExtensions = event.extensions ?? {};
  const currentHistory = currentExtensions.history ?? {};
  const currentTime = currentHistory.time ?? {};
  const nextTime = {
    ...currentTime,
    ...(historyDate.year === undefined ? {} : { year: historyDate.year }),
    ...(historyDate.month === undefined ? {} : { month: historyDate.month }),
    ...(historyDate.day === undefined ? {} : { day: historyDate.day }),
  };

  if (historyDate.year === undefined) {
    delete nextTime.year;
  }

  if (historyDate.month === undefined) {
    delete nextTime.month;
  }

  if (historyDate.day === undefined) {
    delete nextTime.day;
  }

  if (historyDate.year === undefined) {
    delete nextTime.hour;
    delete nextTime.minute;
    delete nextTime.second;
    delete nextTime.timeZone;
    delete nextTime.offset;
  } else if (historyDate.month === undefined) {
    delete nextTime.day;
    delete nextTime.hour;
    delete nextTime.minute;
    delete nextTime.second;
    delete nextTime.timeZone;
    delete nextTime.offset;
  } else if (historyDate.day === undefined) {
    delete nextTime.hour;
    delete nextTime.minute;
    delete nextTime.second;
    delete nextTime.timeZone;
    delete nextTime.offset;
  }

  const nextHistory = { ...currentHistory };

  if (Object.keys(nextTime).length === 0) {
    delete nextHistory.time;
  } else {
    nextHistory.time = nextTime;
  }

  const nextExtensions = { ...currentExtensions };

  if (Object.keys(nextHistory).length === 0) {
    delete nextExtensions.history;
  } else {
    nextExtensions.history = nextHistory;
  }

  const eventWithoutLegacyDate: Event & { date?: unknown } = { ...event };
  delete eventWithoutLegacyDate.date;

  if (Object.keys(nextExtensions).length === 0) {
    const eventWithoutExtensions = { ...eventWithoutLegacyDate };
    delete eventWithoutExtensions.extensions;
    return eventWithoutExtensions;
  }

  return {
    ...eventWithoutLegacyDate,
    extensions: nextExtensions,
  };
}

export function updateEvent(
  dataset: Dataset,
  eventId: string,
  updates: {
    historyDate?: HistoryDate;
    name?: string;
    description?: string;
  },
): Dataset {
  return {
    ...dataset,
    events: dataset.events.map((event) => {
      if (event.id !== eventId) {
        return event;
      }

      const { historyDate, ...directUpdates } = updates;
      const updatedEvent = {
        ...event,
        ...directUpdates,
      };

      return historyDate === undefined
        ? updatedEvent
        : setEventHistoryDate(updatedEvent, historyDate);
    }),
  };
}

export function deleteEvent(dataset: Dataset, eventId: string): Dataset {
  return {
    ...dataset,
    events: dataset.events.filter((event) => event.id !== eventId),
    relations: dataset.relations.filter(
      (relation) =>
        relation.sourceId !== eventId && relation.targetId !== eventId,
    ),
  };
}

export function addEventEntityRelation(
  dataset: Dataset,
  eventId: string,
  entityId: string,
): Dataset {
  const relationExists = dataset.relations.some(
    (relation) =>
      (relation.sourceId === eventId && relation.targetId === entityId) ||
      (relation.sourceId === entityId && relation.targetId === eventId),
  );

  if (relationExists) {
    return dataset;
  }

  return {
    ...dataset,
    relations: [
      ...dataset.relations,
      {
        id: createCoreObjectId(dataset),
        sourceId: eventId,
        targetId: entityId,
      },
    ],
  };
}

export function removeEventEntityRelations(
  dataset: Dataset,
  eventId: string,
  entityId: string,
): Dataset {
  return {
    ...dataset,
    relations: dataset.relations.filter(
      (relation) =>
        !(
          (relation.sourceId === eventId && relation.targetId === entityId) ||
          (relation.sourceId === entityId && relation.targetId === eventId)
        ),
    ),
  };
}

export function deleteRelation(dataset: Dataset, relationId: string): Dataset {
  return {
    ...dataset,
    relations: dataset.relations.filter(
      (relation) => relation.id !== relationId,
    ),
  };
}
