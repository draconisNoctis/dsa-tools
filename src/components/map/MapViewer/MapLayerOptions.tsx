import { type Component, For, Show } from 'solid-js';
import type { Map, MapUpdate } from '../../../server/databases/map.db';
import { useMapViewerContext } from './MapViewerContext';

export const MapLayerOptions: Component<{ map: Map; onUpdate?: (update: MapUpdate) => void }> = () => {
    const ctx = useMapViewerContext();

    return (
        <div class="border border-gray-400 rounded">
            <For each={[...ctx.layer.entries()]}>
                {([name, { node }]) => (
                    <>
                        <span
                            onClick={() => ctx.setActive(name)}
                            class="block hover:bg-gray-300 cursor-pointer"
                            classList={{
                                'bg-gray-400': ctx.isActive(name),
                                'font-bold': ctx.isActive(name)
                            }}>
                            {name}
                        </span>
                        <Show when={ctx.isActive(name)}>
                            <div class="bg-gray-200">{node}</div>
                        </Show>
                    </>
                )}
            </For>{' '}
        </div>
    );
};
export default MapLayerOptions;
