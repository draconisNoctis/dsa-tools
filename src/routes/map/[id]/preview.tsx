import { useParams } from '@solidjs/router';
import { MapViewer } from '~/components/map/MapViewer/MapViewer';
import { useWebSocket } from '~/hooks/useWebSocket';
import type { Map } from '../../../server/databases/map.db';
import type { Event } from '../../../server/ws/map';

export default function MapPreview() {
    const params = useParams<{ id: string }>();
    const [map] = useWebSocket<Map>(`/ws/map/${params.id}`, { _id: '', name: 'Unknown' }, event => {
        const json = JSON.parse(event.data) as Event;
        switch (json.type) {
            case 'update':
                return json.update;
            default:
                return {};
        }
    });

    return (
        <main>
            <MapViewer map={map} preview />
        </main>
    );
}
