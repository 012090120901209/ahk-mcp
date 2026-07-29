import type { EventId, EventStore, StreamId, JSONRPCMessage } from '@modelcontextprotocol/server';

interface StoredEvent {
  streamId: StreamId;
  message: JSONRPCMessage;
  sequence: number;
}

/**
 * Lightweight in-memory event store for Streamable HTTP resumability.
 * This is process-local and intentionally bounded to avoid unbounded memory growth.
 */
export class InMemoryEventStore implements EventStore {
  private readonly events = new Map<EventId, StoredEvent>();
  private sequence = 0;

  constructor(private readonly maxEvents: number = 5000) {}

  async storeEvent(streamId: StreamId, message: JSONRPCMessage): Promise<EventId> {
    this.sequence += 1;
    const eventId = this.createEventId(streamId, this.sequence);
    this.events.set(eventId, {
      streamId,
      message,
      sequence: this.sequence,
    });

    this.trimToLimit();
    return eventId;
  }

  async getStreamIdForEventId(eventId: EventId): Promise<StreamId | undefined> {
    return this.events.get(eventId)?.streamId;
  }

  async replayEventsAfter(
    lastEventId: EventId,
    { send }: { send: (eventId: EventId, message: JSONRPCMessage) => Promise<void> }
  ): Promise<StreamId> {
    const lastEvent = this.events.get(lastEventId);
    if (!lastEvent) {
      return '';
    }

    const replayCandidates = [...this.events.entries()]
      .filter(
        ([, event]) => event.streamId === lastEvent.streamId && event.sequence > lastEvent.sequence
      )
      .sort((a, b) => a[1].sequence - b[1].sequence);

    for (const [eventId, event] of replayCandidates) {
      await send(eventId, event.message);
    }

    return lastEvent.streamId;
  }

  private createEventId(streamId: StreamId, sequence: number): EventId {
    const sequencePart = sequence.toString().padStart(12, '0');
    return `${streamId}_${sequencePart}`;
  }

  private trimToLimit(): void {
    if (this.events.size <= this.maxEvents) {
      return;
    }

    const overflow = this.events.size - this.maxEvents;
    const oldest = [...this.events.entries()]
      .sort((a, b) => a[1].sequence - b[1].sequence)
      .slice(0, overflow);

    for (const [eventId] of oldest) {
      this.events.delete(eventId);
    }
  }
}
