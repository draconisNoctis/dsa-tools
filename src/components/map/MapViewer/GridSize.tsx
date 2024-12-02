import type { Component } from 'solid-js';
import type { Map } from '../../../server/databases/map.db';

type Size = NonNullable<NonNullable<NonNullable<Map['layerOptions']>['grid']>['size']>;

export const GridSize: Component<{ size?: Size | null; onUpdate?: (size: Size) => void }> = props => {
    function accessor(name: keyof NonNullable<Size>) {
        return {
            value: props.size?.[name] ?? 0,
            onInput: (event: InputEvent & { target: HTMLInputElement }) => {
                props.onUpdate?.({ height: 0, width: 0, ...props.size, [name]: Number.parseInt(event.target.value) || 0 });
            }
        };
    }

    return (
        <>
            <label for="width" class="col-span-2">
                Width:
            </label>
            <input type="number" id="width" name="width" class="w-12" {...accessor('width')} />
            <label for="height" class="col-span-2">
                Height:
            </label>
            <input type="number" id="height" name="height" class="w-12" {...accessor('height')} />
        </>
    );
};
