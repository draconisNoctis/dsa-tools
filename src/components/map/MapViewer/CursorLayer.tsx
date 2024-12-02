import { type Component, onCleanup, onMount } from 'solid-js';
import { isServer } from 'solid-js/web';
import type { Map, MapUpdate } from '../../../server/databases/map.db';
import styles from './Cursor.module.css';

export const CursorLayer: Component<{ map?: Map; onUpdate?: (update: MapUpdate) => void }> = props => {
    let ref: HTMLDivElement | undefined;

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
        <div
            ref={ref}
            class={`absolute top-0 left-0 right-0 bottom-0 ${styles.Cursor}`}
            style={
                props.map?.cursor
                    ? {
                          '--cursor': 'true',
                          '--cursor-x': `${props.map.cursor.x * 100}%`,
                          '--cursor-y': `${props.map.cursor.y * 100}%`
                      }
                    : undefined
            }
        />
    );
};
