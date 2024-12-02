import { type Component, createMemo, onCleanup, onMount } from 'solid-js';
import { Portal, isServer } from 'solid-js/web';
import type { Map, MapUpdate } from '../../../server/databases/map.db';
import styles from './Cursor.module.css';
import { useMapViewerContext } from './MapViewerContext';

const DEFAULT_CURSOR_COLOR = '#00ffff';
const DEFAULT_CURSOR_SIZE = 10;

export const CursorLayer: Component<{
    map?: Map;
    onUpdate?: (update: MapUpdate) => void;
    onOptionsUpdate?: (options: NonNullable<MapUpdate['layerOptions']>['cursor']) => void;
}> = props => {
    const context = useMapViewerContext('Cursor');
    let ref: HTMLDivElement | undefined;

    const options = createMemo(() => props.map?.layerOptions?.cursor);

    if (!isServer) {
        function onMouseMove(event: MouseEvent) {
            const rect = ref!.getBoundingClientRect();
            const x = event.pageX - rect.x - window.scrollX;
            const y = event.pageY - rect.y - window.scrollY;

            if (x < 0 || x > rect.width || y < 0 || y > rect.height) {
                if (props.map?.cursor) {
                    props.onUpdate?.({ cursor: null });
                }
            } else {
                props.onUpdate?.({
                    cursor: {
                        x: x / rect.width,
                        y: y / rect.height
                    }
                });
            }
        }

        onMount(() => {
            document.body.addEventListener('mousemove', onMouseMove);
        });
        onCleanup(() => {
            document.body.removeEventListener('mousemove', onMouseMove);
        });
    }

    return (
        <>
            <Portal mount={context.getPortal()}>
                <div class="grid grid-cols-[1fr_min-content_max-content] gap-1 p-1">
                    <label for="cursor-color">Grid Color</label>
                    <button type="button" onClick={() => props.onOptionsUpdate?.({ color: DEFAULT_CURSOR_COLOR })} title="Reset to default">
                        ⟳
                    </button>
                    <input
                        type="color"
                        id="cursor-color"
                        value={options()?.color ?? DEFAULT_CURSOR_COLOR}
                        onInput={e => props.onOptionsUpdate?.({ color: e.target.value })}
                    />
                    <label for="cursor-size">Size</label>
                    <button type="button" onClick={() => props.onOptionsUpdate?.({ size: DEFAULT_CURSOR_SIZE })} title="Reset to default">
                        ⟳
                    </button>
                    <input
                        type="number"
                        class="w-12"
                        id="cursor-size"
                        value={options()?.size ?? DEFAULT_CURSOR_SIZE}
                        onInput={e => props.onOptionsUpdate?.({ size: Number.parseInt(e.target.value) })}
                    />
                </div>
            </Portal>
            <div
                ref={ref}
                class={`absolute top-0 left-0 right-0 bottom-0 ${styles.Cursor}`}
                style={
                    props.map?.cursor
                        ? {
                              '--cursor': 'true',
                              '--cursor-x': `${props.map.cursor.x * 100}%`,
                              '--cursor-y': `${props.map.cursor.y * 100}%`,
                              '--cursor-color': options()?.color ?? DEFAULT_CURSOR_COLOR,
                              '--cursor-size': options()?.size ?? DEFAULT_CURSOR_SIZE
                          }
                        : undefined
                }
            />
        </>
    );
};
