import { useParams } from '@solidjs/router';
import { isServer } from 'solid-js/web';
import { MapViewer } from '~/components/map/MapViewer/MapViewer';
import { MapViewerContext, MapViewerCtx } from '~/components/map/MapViewer/MapViewerContext';
import { useWebSocket } from '~/hooks/useWebSocket';
import type { Map } from '../../../server/databases/map.db';
import type { Event, PingEvent } from '../../../server/ws/map';

export default function MapPresenter() {
    const params = useParams<{ id: string }>();
    const [map, { send, reconnect }] = useWebSocket<Map>(`/ws/map/${params.id}`, { _id: '', _created: '', name: '' }, event => {
        const json = JSON.parse(event.data) as Event;
        switch (json.type) {
            case 'update':
                return json.update;
            // biome-ignore lint/suspicious/noFallthroughSwitchClause: explicit
            case 'pong':
                resetReconnectTimer();
            default:
                return {};
        }
    });

    let reconnectTimeout: ReturnType<typeof setTimeout> | undefined;
    function resetReconnectTimer() {
        if (reconnectTimeout != null) clearTimeout(reconnectTimeout);
        reconnectTimeout = setTimeout(reconnect, 10_000);
    }

    if (!isServer) {
        setInterval(() => {
            send(JSON.stringify({ type: 'ping' } satisfies PingEvent));
        }, 5_000);
    }

    const context = new MapViewerCtx();

    return (
        <main>
            <MapViewerContext.Provider value={context}>
                <MapViewer map={map} presenter />
            </MapViewerContext.Provider>
        </main>
    );
}
