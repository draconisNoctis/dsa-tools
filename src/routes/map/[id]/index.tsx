import { useParams } from '@solidjs/router';
import { clientOnly } from '@solidjs/start';
import { MapDebug } from '~/components/map/MapViewer/MapDebug';
import { MapSettings } from '~/components/map/MapViewer/MapSettings';
import { MapViewer } from '~/components/map/MapViewer/MapViewer';
import { MapViewerContext, MapViewerCtx } from '~/components/map/MapViewer/MapViewerContext';
import { useWebSocket } from '~/hooks/useWebSocket';
import type { Map, MapUpdate } from '../../../server/databases/map.db';
import type { Event, UpdateEvent } from '../../../server/ws/map';

const MapLayerOptions = clientOnly(() => import('~/components/map/MapViewer/MapLayerOptions'));

export default function Map() {
    const params = useParams<{ id: string }>();
    const [map, { send, set }] = useWebSocket<Map>(`/ws/map/${params.id}`, { _id: '', name: '' }, event => {
        const json = JSON.parse(event.data) as Event;
        switch (json.type) {
            case 'update':
                return json.update;
            default:
                return {};
        }
    });

    function update(update: MapUpdate) {
        set(update);
        send(JSON.stringify({ type: 'update', update } satisfies UpdateEvent));
    }

    const context = new MapViewerCtx();

    return (
        <MapViewerContext.Provider value={context}>
            <main class="mx-auto text-gray-950 bg-gray-500 p-4 grid min-h-[100vh] grid-cols-[1fr_minmax(200px,max-content)] gap-2">
                <MapSettings onUpdate={update} map={map} />
                <div>
                    <MapViewer map={map} onUpdate={update} />
                </div>
                <aside>
                    <MapLayerOptions map={map} />
                </aside>
                <MapDebug map={map} />
            </main>
        </MapViewerContext.Provider>
    );
}
