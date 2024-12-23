import { useParams } from '@solidjs/router';
import { clientOnly } from '@solidjs/start';
import { isServer } from 'solid-js/web';
import Breadcrumb from '~/components/Breadcrumb';
import Nav from '~/components/Nav';
import { MapDebug } from '~/components/map/MapViewer/MapDebug';
import { MapSettings } from '~/components/map/MapViewer/MapSettings';
import { MapViewer } from '~/components/map/MapViewer/MapViewer';
import { MapViewerContext, MapViewerCtx } from '~/components/map/MapViewer/MapViewerContext';
import { useWebSocket } from '~/hooks/useWebSocket';
import type { Map, MapUpdate } from '../../../server/databases/map.db';
import type { Event, PingEvent, UpdateEvent } from '../../../server/ws/map';

const MapLayerOptions = clientOnly(() => import('~/components/map/MapViewer/MapLayerOptions'));

export default function Map() {
    const params = useParams<{ id: string }>();
    const [map, { send, set, reconnect }] = useWebSocket<Map>(`/ws/map/${params.id}`, { _id: '', _created: '', name: '' }, event => {
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

    function update(update: MapUpdate) {
        set(update);
        send(JSON.stringify({ type: 'update', update } satisfies UpdateEvent));
    }

    const context = new MapViewerCtx();

    return (
        <MapViewerContext.Provider value={context}>
            <main class="bg-gray-900 min-h-[100vh]">
                <Nav />
                <Breadcrumb
                    items={[
                        ['Home', '/'],
                        ['Maps', '/map'],
                        [map.name, `/map/${map._id}`]
                    ]}
                />
                <div class="mx-auto text-gray-950 bg-gray-500 p-4 grid grid-cols-[1fr_200px] gap-2">
                    <MapSettings onUpdate={update} map={map} />
                    <div>
                        <MapViewer map={map} onUpdate={update} />
                    </div>
                    <aside class="flex flex-col">
                        <MapLayerOptions map={map} />
                        <a href={`/map/${params.id}/presenter`} target="_blank" class="mt-auto">
                            Presenter
                        </a>
                    </aside>
                    <MapDebug map={map} />
                </div>
            </main>
        </MapViewerContext.Provider>
    );
}
