import { type Component, For, Show, createSignal, onCleanup, onMount } from 'solid-js';
import type { DOMElement } from 'solid-js/jsx-runtime';
import type { Map, MapUpdate } from '../../../server/databases/map.db';
import styles from './MarkerLayer.module.css';

type Marker = NonNullable<Map['marker']>[string];
type MarkerUpdate = Partial<Pick<Marker, 'text' | 'color'>>;

const Marker: Component<{
    id: string;
    marker: Marker;
    editing?: boolean;
    onSelect?: () => void;
    onUnselect?: () => void;
    onUpdate?: (update: MarkerUpdate) => void;
    onDelete?: () => void;
}> = props => {
    return (
        <div
            class={styles.Marker}
            classList={{ [styles.MarkerEditing]: props.editing, [styles.MarkerReverse]: props.marker.pos.x > 0.5 }}
            style={{
                '--color': props.marker.color,
                '--x': props.marker.pos.x,
                '--y': props.marker.pos.y
            }}
            onClick={props.onSelect}>
            <label class={styles.MarkerDot} for={`marker-color-${props.id}`} />
            <Show when={props.editing}>
                <input
                    type="color"
                    id={`marker-color-${props.id}`}
                    value={props.marker.color}
                    onInput={e => {
                        props.onUpdate?.({ color: e.target.value });
                    }}
                />
            </Show>
            <Show when={props.editing} fallback={<span>{props.marker.text}</span>}>
                <input
                    autofocus
                    type="text"
                    value={props.marker.text}
                    onInput={e => {
                        props.onUpdate?.({ text: e.target.value });
                    }}
                />
            </Show>
            <Show when={props.editing}>
                <button
                    type="button"
                    onClick={e => {
                        e.stopPropagation();
                        props.onUnselect?.();
                    }}
                    title="Ok">
                    ✓
                </button>
                <button type="button" onClick={props.onDelete} title="Delete">
                    🗑
                </button>
            </Show>
        </div>
    );
};

export const MarkerLayer: Component<{ map?: Map; onUpdate?: (update: MapUpdate) => void }> = props => {
    const [active, setActive] = createSignal(false);
    const [editing, setEditing] = createSignal<string>();

    function keydownHandler(event: KeyboardEvent) {
        if (event.shiftKey) {
            setActive(true);
        }
    }
    function keyupHandler(event: KeyboardEvent) {
        if (!event.shiftKey) {
            setActive(false);
        }
    }
    function clickHandler(event: MouseEvent & { currentTarget: HTMLDivElement; target: DOMElement }) {
        if (event.target !== event.currentTarget) return;
        const x = event.layerX / event.currentTarget.clientWidth;
        const y = event.layerY / event.currentTarget.clientHeight;
        props.onUpdate?.({
            marker: {
                ...props.map?.marker,
                [crypto.randomUUID()]: {
                    pos: { x, y },
                    text: 'Example',
                    color: '#00ffff'
                }
            }
        });
    }

    onMount(() => {
        document.body.addEventListener('keydown', keydownHandler);
        document.body.addEventListener('keyup', keyupHandler);

        onCleanup(() => {
            document.body.removeEventListener('keydown', keydownHandler);
            document.body.removeEventListener('keyup', keyupHandler);
        });
    });

    return (
        <div
            class={'absolute top-0 left-0 right-0 bottom-0'}
            classList={{
                [styles.MarkerLayer]: true,
                [styles.Active]: active()
            }}
            onClick={clickHandler}>
            <For each={props.map?.marker && [...Object.entries(props.map.marker)]}>
                {([id, marker]) => (
                    <Marker
                        id={id}
                        marker={marker}
                        editing={editing() === id}
                        onSelect={() => setEditing(id)}
                        onUnselect={() => setEditing()}
                        onUpdate={update => {
                            props.onUpdate?.({
                                marker: {
                                    ...props.map?.marker,
                                    [id]: {
                                        ...marker,
                                        ...update
                                    }
                                }
                            });
                        }}
                        onDelete={() => {
                            const { [id]: _, ...marker } = props.map?.marker ?? {};
                            props.onUpdate?.({
                                marker
                            });
                        }}
                    />
                )}
            </For>
        </div>
    );
};
