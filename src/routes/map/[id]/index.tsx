import { useParams } from '@solidjs/router';
import { MapSettings } from '~/components/map/MapSettings/MapSettings';
import { MapViewer } from '~/components/map/MapViewer/MapViewer';
import { useWebSocket } from '~/hooks/useWebSocket';
import type { Map, MapUpdate } from '../../../server/databases/map.db';
import type { Event, UpdateEvent } from '../../../server/ws/map';

export default function Map() {
    const params = useParams<{ id: string }>();
    const [map, { send, set }] = useWebSocket<Map>(`/ws/map/${params.id}`, { _id: '', name: 'Unknown' }, event => {
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

    return (
        <main class="text-center mx-auto text-gray-950 bg-gray-500 p-4 m-4">
            <MapSettings onUpdate={update} map={map} />
            <MapViewer map={map} onUpdate={update} />
            <pre class="text-left font-mono">{JSON.stringify(map, null, 2)}</pre>
        </main>
    );
}
