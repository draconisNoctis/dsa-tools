import type { Component } from 'solid-js';
import type { Map } from '../../../server/databases/map.db';

type Offset = NonNullable<NonNullable<NonNullable<Map['layerOptions']>['grid']>['offset']>;

export const GridOffset: Component<{ offset?: Offset | null; onUpdate?: (offset: Offset) => void }> = props => {
    function accessor(name: keyof NonNullable<Offset>) {
        return {
            value: props.offset?.[name] ?? 0,
            onInput: (event: InputEvent & { target: HTMLInputElement }) => {
                props.onUpdate?.({
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    ...props.offset,
                    [name]: Number.parseInt(event.target.value) || 0
                });
            }
        };
    }

    return (
        <div class="grid grid-cols-3 grid-rows-3 gap-1 bg-gray-100/20">
            <input
                type="number"
                name="top"
                class="col-start-2 row-start-1 text-lg w-12 text-center justify-self-center"
                {...accessor('top')}
            />
            <input
                type="number"
                name="left"
                class="col-start-1 row-start-2 text-lg w-12 text-center justify-self-center"
                {...accessor('left')}
            />
            <input
                type="number"
                name="right"
                class="col-start-3 row-start-2 text-lg w-12 text-center justify-self-center"
                {...accessor('right')}
            />
            <input
                type="number"
                name="bottom"
                class="col-start-2 row-start-3 text-lg w-12 text-center justify-self-center"
                {...accessor('bottom')}
            />
        </div>
    );
};
