import { eventHandler } from 'vinxi/http';
import z from 'zod';
import { MapDb } from '../databases/map.db';

const CreateEvent = z.object({
    type: z.enum(['create']),
    values: MapDb.schema
});
export type CreateEvent = z.infer<typeof CreateEvent>;

const UpdateEvent = z.object({
    type: z.enum(['update']),
    id: z.string(),
    update: MapDb.partialSchema
});
export type UpdateEvent = z.infer<typeof UpdateEvent>;

const ReadEvent = z.object({
    type: z.enum(['read']),
    id: z.string()
});
export type ReadEvent = z.infer<typeof ReadEvent>;

const SubscribeEvent = z.object({
    type: z.enum(['subscribe']),
    id: z.string()
});
export type SubscribeEvent = z.infer<typeof SubscribeEvent>;

const PingEvent = z.object({
    type: z.enum(['ping'])
});
export type PingEvent = z.infer<typeof PingEvent>;

const PongEvent = z.object({
    type: z.enum(['pong'])
});
export type PongEvent = z.infer<typeof PongEvent>;

const PresentEvent = z.object({
    type: z.enum(['present']),
    id: z.string()
});
export type PresentEvent = z.infer<typeof PresentEvent>;

const Event = z.union([CreateEvent, UpdateEvent, ReadEvent, SubscribeEvent, PingEvent, PongEvent, PresentEvent]);
export type Event = z.infer<typeof Event>;

const PEER_TO_TOPIC = new WeakMap<object, string>();

export default eventHandler({
    handler() {},
    websocket: {
        open(peer) {
            try {
                console.info('[WS] open', peer.id);
                peer.subscribe('presenter');
            } catch (error) {
                console.error(error);
                peer.send(JSON.stringify({ type: 'error', error }));
            }
        },
        async message(peer, message) {
            try {
                const event = Event.parse(JSON.parse(message.text()));

                switch (event.type) {
                    case 'ping':
                        peer.send(JSON.stringify({ type: 'pong' }));
                        break;
                    case 'present':
                        peer.publish('presenter', JSON.stringify(event));
                        break;
                    // biome-ignore lint/suspicious/noFallthroughSwitchClause: explicit
                    case 'subscribe': {
                        if (PEER_TO_TOPIC.has(peer)) peer.unsubscribe(PEER_TO_TOPIC.get(peer)!);
                        PEER_TO_TOPIC.set(peer, `map:${event.id}`);
                        peer.subscribe(`map:${event.id}`);
                    }
                    case 'read': {
                        const map = await MapDb.read(event.id);
                        peer.send(JSON.stringify({ type: 'update', id: event.id, update: map } satisfies UpdateEvent));
                        break;
                    }
                    case 'create':
                        // do nothing;
                        break;
                    case 'update': {
                        const payload = JSON.stringify({
                            type: 'update',
                            id: event.id,
                            update: await MapDb.update(event.id, event.update)
                        } satisfies UpdateEvent);
                        peer.publish(`map:${event.id}`, payload);
                        break;
                    }
                }
            } catch (error) {
                console.error(error);
                peer.send(JSON.stringify({ type: 'error', error }));
            }
        },
        close(peer) {
            console.info('[WS] close', peer.id);
            peer.unsubscribe('presenter');
            if (PEER_TO_TOPIC.has(peer)) peer.unsubscribe(PEER_TO_TOPIC.get(peer)!);
        },
        error(peer, error) {
            console.info('[WS] open', peer.id, error);
            console.error('[ws map] error', error);
        }
    }
});
