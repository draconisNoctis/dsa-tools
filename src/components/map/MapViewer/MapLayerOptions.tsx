import { type Component, For, Show, createEffect } from 'solid-js';
import { tinykeys } from 'tinykeys';
import type { Map, MapUpdate } from '../../../server/databases/map.db';
import { useMapViewerContext } from './MapViewerContext';

export const MapLayerOptions: Component<{ map: Map; onUpdate?: (update: MapUpdate) => void }> = () => {
    const ctx = useMapViewerContext();

    createEffect<() => void>(prev => {
        prev?.();
        return tinykeys(
            window,
            Object.fromEntries([
                ...ctx.layer
                    .entries()
                    .filter(([, values]) => values.options?.shortcut)
                    .map(([name, values]) => [
                        `. ${values.options!.shortcut!}`,
                        (e: KeyboardEvent) => {
                            if (e.target instanceof HTMLElement && e.target.tagName === 'INPUT') return;
                            ctx.setActive(name);
                        }
                    ])
            ])
        );
    });

    return (
        <div class="border border-gray-400 rounded">
            <For each={[...ctx.layer.entries()]}>
                {([name, { node, options }]) => (
                    <>
                        <div
                            onClick={() => ctx.setActive(name)}
                            class="hover:bg-gray-300 cursor-pointer flex px-1"
                            classList={{
                                'bg-gray-400': ctx.isActive(name),
                                'font-bold': ctx.isActive(name)
                            }}>
                            <span class="grow">{name}</span>
                            <Show when={options?.shortcut}>
                                <span class="font-mono text-s font-thin">[. {options?.shortcut}]</span>
                            </Show>
                        </div>
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
