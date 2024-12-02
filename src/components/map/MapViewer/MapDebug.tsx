import type { Component } from 'solid-js';
import { Show } from 'solid-js/web';
import type { Map, MapUpdate } from '../../../server/databases/map.db';
import { useMapViewerContext } from './MapViewerContext';

export interface MapSettingsProps {
    map?: Map;
    onUpdate?: (settings: MapUpdate) => void;
}

export const MapDebug: Component<{ map?: Map }> = props => {
    const context = useMapViewerContext('Debug');

    return (
        <Show when={context.isActive()}>
            <pre class="col-span-2 bg-gray-50 rounded border border-gray-950 font-mono">{JSON.stringify(props.map, null, 2)}</pre>
        </Show>
    );
};
