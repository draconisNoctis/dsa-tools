import { type Component, Index, createMemo, createSignal, onCleanup, onMount } from 'solid-js';
import { Portal, isServer } from 'solid-js/web';
import type { Map, MapUpdate } from '../../../server/databases/map.db';
import { GridOffset } from './GridOffset';
import { GridSize } from './GridSize';
import { useMapViewerContext } from './MapViewerContext';

const DEFAULT_GRID_COLOR = '#111827';
const DEFAULT_OFFSET_COLOR = '#374151';

export const GridLayer: Component<{
    map?: Map;
    presenter?: boolean;
    onUpdate?: (update: MapUpdate) => void;
    onOptionsUpdate?: (options: NonNullable<MapUpdate['layerOptions']>['grid']) => void;
}> = props => {
    const context = useMapViewerContext('Grid', { shortcut: 'g' });
    const [isShifting, setShifting] = createSignal(false);

    const options = createMemo(() => props.map?.layerOptions?.grid);

    function keydownEvent(event: KeyboardEvent) {
        if (event.shiftKey) {
            setShifting(true);
        }
    }
    function keyupEvent(event: KeyboardEvent) {
        if (!event.shiftKey) {
            setShifting(false);
        }
    }

    if (!isServer) {
        onMount(() => {
            window.addEventListener('keydown', keydownEvent);
            window.addEventListener('keyup', keyupEvent);
        });
        onCleanup(() => {
            window.removeEventListener('keydown', keydownEvent);
            window.removeEventListener('keyup', keyupEvent);
        });
    }

    const cells = createMemo(() =>
        options()?.size?.height && options()?.size?.width
            ? Array.from({ length: (options()!.size!.height + 2) * (options()!.size!.width + 2) }, (_, i) => ({
                  row: ((i / (options()!.size!.width + 2)) | 0) - 1,
                  col: (i % (options()!.size!.width + 2)) - 1
              }))
            : []
    );

    return (
        <>
            <Portal mount={context.getPortal()}>
                <div class="grid grid-cols-[1fr_min-content_max-content] gap-1 p-1">
                    <label for="grid-grid-color">Grid Color</label>
                    <button
                        type="button"
                        onClick={() => props.onOptionsUpdate?.({ gridColor: DEFAULT_GRID_COLOR })}
                        title="Reset to default">
                        ⟳
                    </button>
                    <input
                        type="color"
                        id="grid-grid-color"
                        value={options()?.gridColor ?? DEFAULT_GRID_COLOR}
                        onInput={e => props.onOptionsUpdate?.({ gridColor: e.target.value })}
                    />
                    <label for="grid-offset-color">Offset Color</label>
                    <button
                        type="button"
                        onClick={() => props.onOptionsUpdate?.({ offsetColor: DEFAULT_OFFSET_COLOR })}
                        title="Reset to default">
                        ⟳
                    </button>
                    <input
                        type="color"
                        id="grid-offset-color"
                        value={options()?.offsetColor ?? DEFAULT_OFFSET_COLOR}
                        onInput={e => props.onOptionsUpdate?.({ offsetColor: e.target.value })}
                    />
                    <label class="col-span-3 font-bold">Size</label>
                    <GridSize size={options()?.size} onUpdate={size => props.onOptionsUpdate?.({ size })} />
                    <label class="col-span-3 font-bold">Offset</label>
                    <div class="col-span-3">
                        <GridOffset offset={options()?.offset} onUpdate={offset => props.onOptionsUpdate?.({ offset })} />
                    </div>
                    <button type="button" class="col-start-2 col-span-2" onClick={() => props.onUpdate?.({ cells: {} })}>
                        Hide All
                    </button>
                </div>
            </Portal>
            <div
                class="absolute top-0 left-0 right-0 bottom-[-1px] grid border border-black border-l-0 border-t-0"
                classList={{ 'pointer-events-none': !context.isActive() }}
                style={{
                    'grid-template-columns': `${(options()?.offset?.left ?? 0) * 0.1}% repeat(${options()?.size?.width ?? 0}, 1fr) ${(options()?.offset?.right ?? 0) * 0.1}%`,
                    'grid-template-rows': `${(options()?.offset?.top ?? 0) * 0.1}% repeat(${options()?.size?.height ?? 0}, 1fr) ${(options()?.offset?.bottom ?? 0) * 0.1}%`
                }}>
                <Index each={cells()}>
                    {cell => {
                        const isOffset = createMemo(
                            () =>
                                cell().row === -1 ||
                                cell().col === -1 ||
                                cell().row === options()?.size?.height ||
                                cell().col === options()?.size?.width
                        );
                        const isOpened = createMemo(() => !!props.map?.cells?.[`${cell().row}:${cell().col}`]);
                        return (
                            <div
                                class="border border-black border-r-0 border-b-0"
                                style={{
                                    '--grid-color': `${options()?.gridColor ?? DEFAULT_GRID_COLOR}${props.presenter ? '' : 'E6'}`,
                                    '--offset-color': `${options()?.offsetColor ?? DEFAULT_OFFSET_COLOR}${props.presenter ? '' : 'E6'}`
                                }}
                                classList={{
                                    'bg-[var(--grid-color)]': !isOpened() && !isOffset(),
                                    'bg-[var(--offset-color)]': isOffset()
                                }}
                                onMouseOver={() => {
                                    if (isShifting()) {
                                        props.onUpdate?.({
                                            cells: {
                                                ...props.map?.cells,
                                                [`${cell().row}:${cell().col}`]: true
                                            }
                                        });
                                    }
                                }}
                                onClick={
                                    isOffset()
                                        ? undefined
                                        : () =>
                                              props.onUpdate?.({
                                                  cells: {
                                                      ...props.map?.cells,
                                                      [`${cell().row}:${cell().col}`]:
                                                          !props.map?.cells?.[`${cell().row}:${cell().col}`] || undefined
                                                  }
                                              })
                                }
                            />
                        );
                    }}
                </Index>
            </div>
        </>
    );
};
