export interface HistoryTime {
  year?: number;
  month?: number;
  day?: number;
  hour?: number;
  minute?: number;
  second?: number;
  timeZone?: string;
  offset?: string;
  temporalOrder?: number;
  [key: string]: unknown;
}

export interface HistoryExtension {
  time?: HistoryTime;
  [key: string]: unknown;
}
