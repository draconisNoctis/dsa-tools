import { useParams } from '@solidjs/router';
import { MapViewer } from '~/components/map/MapViewer/MapViewer';
import { MapViewerContext, MapViewerCtx } from '~/components/map/MapViewer/MapViewerContext';
import { useWebSocket } from '~/hooks/useWebSocket';
import type { Map } from '../../../server/databases/map.db';
import type { Event } from '../../../server/ws/map';

export default function MapPresenter() {
    const params = useParams<{ id: string }>();
    const [map] = useWebSocket<Map>(`/ws/map/${params.id}`, { _id: '', _created: '', name: '' }, event => {
        const json = JSON.parse(event.data) as Event;
        switch (json.type) {
            case 'update':
                return json.update;
            default:
                return {};
        }
    });

    const context = new MapViewerCtx();

    return (
        <main>
            <MapViewerContext.Provider value={context}>
                <MapViewer map={map} presenter />
            </MapViewerContext.Provider>
        </main>
    );
}
