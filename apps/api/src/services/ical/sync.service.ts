import { iCalSyncQueue } from '../../queues/ical-sync.queue';

export interface ICalSyncPayload {
  propertyId: string;
  sourceId: string;
  icalUrl: string;
}

export class ICalSyncService {
  async enqueueSync(payload: ICalSyncPayload): Promise<void> {
    await iCalSyncQueue.add('sync-source', payload, {
      removeOnComplete: 100,
      removeOnFail: 100,
      deduplication: { id: `${payload.propertyId}:${payload.sourceId}` }
    });
  }
}
