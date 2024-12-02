import { type Component, createEffect } from 'solid-js';
import { createStore } from 'solid-js/store';
import type { Map } from '../../../server/databases/map.db';

export const MapSize: Component<{ size?: Map['size']; onUpdate?: (size: Map['size']) => void }> = props => {
    const [store, setStore] = createStore<NonNullable<Map['size']>>(props.size ?? { width: 0, height: 0 });

    createEffect(() => {
        setStore(props.size ?? { width: 0, height: 0 });
        // ignoreNext = true;
    });

    createEffect(isNotFirst => {
        const value = { width: store.width, height: store.height };
        if (isNotFirst) {
            props.onUpdate?.(value);
        }
        return true;
    });

    function accessor(name: keyof NonNullable<Map['size']>) {
        return {
            value: store[name],
            onInput: (event: InputEvent & { target: HTMLInputElement }) => {
                setStore(name, Number.parseInt(event.target.value) || 0);
            }
        };
    }

    return (
        <div class="grid grid-cols-2 grid-rows-2 gap-1 p-2 bg-gray-800/50">
            <label for="width">Width:</label>
            <input type="number" id="width" name="width" class="w-12" {...accessor('width')} />
            <label for="height">Height:</label>
            <input type="number" id="height" name="height" class="w-12" {...accessor('height')} />
        </div>
    );
};
