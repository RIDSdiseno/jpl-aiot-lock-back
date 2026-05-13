import { allEventsMock, alarmEventsMock, pushEventsMock } from "./shared/events-mock.provider";

export const eventRepository = {
  listAll: () => allEventsMock,
  listAlarms: () => alarmEventsMock,
  listPush: () => pushEventsMock,
  findEventById: (id: string) =>
    allEventsMock.find((event) => event.id === id) ??
    alarmEventsMock.find((event) => event.id === id || event.eventId === id) ??
    pushEventsMock.find((event) => event.id === id),
  updateAlarmStatus: (alarmId: string, status: "NEW" | "REVIEWED" | "RESOLVED" | "DISMISSED") => {
    const alarm = alarmEventsMock.find((event) => event.id === alarmId);
    if (!alarm) return null;
    alarm.status = status;
    alarm.handledStatus = status;
    return alarm;
  },
};
