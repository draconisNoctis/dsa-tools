import { type Component, createEffect } from 'solid-js';
import { createStore } from 'solid-js/store';
import type { Map } from '../../../server/databases/map.db';

export const MapOffset: Component<{ offset?: Map['offset']; onUpdate?: (offset: Map['offset']) => void }> = props => {
    const [store, setStore] = createStore<NonNullable<Map['offset']>>(props.offset ?? { top: 0, left: 0, right: 0, bottom: 0 });

    createEffect(() => {
        setStore(props.offset ?? { top: 0, left: 0, right: 0, bottom: 0 });
    });

    createEffect(isNotFirst => {
        const value = { top: store.top, left: store.left, right: store.right, bottom: store.bottom };
        if (isNotFirst) {
            props.onUpdate?.(value);
        }
        return true;
    });

    function accessor(name: keyof NonNullable<Map['offset']>) {
        return {
            value: store[name],
            onInput: (event: InputEvent & { target: HTMLInputElement }) => {
                setStore(name, Number.parseInt(event.target.value) || 0);
            }
        };
    }

    return (
        <div class="grid grid-cols-5 grid-rows-5 gap-1 bg-gray-800/50">
            <div class="col-start-3 row-start-1 text-lg">↓</div>
            <div class="col-start-3 row-start-2 text-lg">
                <input type="number" name="top" class="w-12 text-center" {...accessor('top')} />
            </div>
            <div class="col-start-1 row-start-3 text-lg">→</div>
            <div class="col-start-2 row-start-3 text-lg">
                <input type="number" name="left" class="w-12 text-center" {...accessor('left')} />
            </div>
            <div class="col-start-5 row-start-3 text-lg">←</div>
            <div class="col-start-4 row-start-3 text-lg">
                <input type="number" name="right" class="w-12 text-center" {...accessor('right')} />
            </div>
            <div class="col-start-3 row-start-5 text-lg">↑</div>
            <div class="col-start-3 row-start-4 text-lg">
                <input type="number" name="bottom" class="w-12 text-center" {...accessor('bottom')} />
            </div>
        </div>
    );
};
