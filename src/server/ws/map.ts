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
    update: MapDb.partialSchema
});
export type UpdateEvent = z.infer<typeof UpdateEvent>;

const Event = z.union([CreateEvent, UpdateEvent]);
export type Event = z.infer<typeof Event>;

export default eventHandler({
    handler() {},
    websocket: {
        async open(peer) {
            try {
                console.info('[WS] open', peer.id);
                const mapId = getIdFromPeer(peer);
                const map = await MapDb.read(mapId);
                peer.send(JSON.stringify({ type: 'update', update: map } satisfies UpdateEvent));
                peer.subscribe(`map:${mapId}`);
            } catch (error) {
                console.error(error);
                peer.send(JSON.stringify({ type: 'error', error }));
            }
        },
        async message(peer, message) {
            const mapId = getIdFromPeer(peer);
            try {
                const event = Event.parse(JSON.parse(message.text()));

                switch (event.type) {
                    case 'create':
                        // do nothing;
                        break;
                    case 'update': {
                        const payload = JSON.stringify({
                            type: 'update',
                            update: await MapDb.update(mapId, event.update)
                        } satisfies UpdateEvent);
                        peer.publish(`map:${mapId}`, payload);
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
            const mapId = getIdFromPeer(peer);
            peer.unsubscribe(`map:${mapId}`);
        },
        error(peer, error) {
            console.info('[WS] open', peer.id, error);
            console.error('[ws map] error', error);
        }
    }
});

function getIdFromPeer(peer: object): string {
    const url = 'url' in peer && peer.url ? (peer.url as string) : 'request' in peer ? (peer.request as { url: string }).url : undefined;
    return url!.split(/\//).pop()!;
}
