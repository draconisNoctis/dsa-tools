import { type Component, Index, Show } from 'solid-js';
import type { DOMElement } from 'solid-js/jsx-runtime';
import type { Map, MapUpdate } from '../../../server/databases/map.db';
import { useMapViewerContext } from './MapViewerContext';
import styles from './MarkerLayer.module.css';

type Marker = NonNullable<Map['marker']>[string];
type MarkerUpdate = Partial<Pick<Marker, 'text' | 'color'>>;

const Marker: Component<{
    id: string;
    marker: Marker;
    onUpdate?: (update: MarkerUpdate) => void;
    onDelete?: () => void;
}> = props => {
    const context = useMapViewerContext();

    return (
        <div
            class={styles.Marker}
            classList={{ [styles.MarkerReverse]: props.marker.pos.x > 0.5 }}
            style={{
                '--color': props.marker.color,
                '--x': props.marker.pos.x,
                '--y': props.marker.pos.y
            }}
            onClick={e => e.stopPropagation()}>
            <label class={styles.MarkerDot} for={`marker-color-${props.id}`} />
            <Show when={context.isActive('Marker')}>
                <input
                    type="color"
                    id={`marker-color-${props.id}`}
                    value={props.marker.color}
                    onInput={e => {
                        props.onUpdate?.({ color: e.target.value });
                    }}
                />
            </Show>
            <Show when={context.isActive('Marker')} fallback={<span>{props.marker.text}</span>}>
                <input
                    autofocus
                    type="text"
                    value={props.marker.text}
                    size={props.marker.text.length}
                    onInput={e => {
                        props.onUpdate?.({ text: e.target.value });
                        e.target.size = e.target.value.length;
                    }}
                />
            </Show>
            <Show when={context.isActive('Marker')}>
                <button type="button" onClick={props.onDelete} title="Delete">
                    🗑
                </button>
            </Show>
        </div>
    );
};

export const MarkerLayer: Component<{ map?: Map; onUpdate?: (update: MapUpdate) => void }> = props => {
    const context = useMapViewerContext('Marker');

    function clickHandler(event: MouseEvent & { currentTarget: HTMLDivElement; target: DOMElement }) {
        if (event.target !== event.currentTarget) return;
        const x = event.layerX / event.currentTarget.clientWidth;
        const y = event.layerY / event.currentTarget.clientHeight;
        props.onUpdate?.({
            marker: {
                ...props.map?.marker,
                [crypto.randomUUID()]: {
                    pos: { x, y },
                    text: '',
                    color: '#00ffff'
                }
            }
        });
    }

    return (
        <div
            class={'absolute top-0 left-0 right-0 bottom-0'}
            classList={{
                [styles.MarkerLayer]: true,
                [styles.Active]: context.isActive()
            }}
            onClick={clickHandler}>
            <Index each={props.map?.marker && [...Object.keys(props.map.marker)]}>
                {id => (
                    <Marker
                        id={id()}
                        marker={props.map!.marker![id()]!}
                        onUpdate={update => {
                            props.onUpdate?.({
                                marker: {
                                    ...props.map?.marker,
                                    [id()]: {
                                        ...props.map!.marker![id()]!,
                                        ...update
                                    }
                                }
                            });
                        }}
                        onDelete={() => {
                            const { [id()]: _, ...marker } = props.map?.marker ?? {};
                            props.onUpdate?.({
                                marker
                            });
                        }}
                    />
                )}
            </Index>
        </div>
    );
};
