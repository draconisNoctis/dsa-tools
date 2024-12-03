import { createElementSize } from '@solid-primitives/resize-observer';
import { type Component, createEffect, createMemo, createSignal, untrack } from 'solid-js';
import { Portal } from 'solid-js/web';
import type { Map, MapUpdate } from '../../../server/databases/map.db';
import { useMapViewerContext } from './MapViewerContext';

const DEFAULT_DRAW_COLOR = '#00ffff';
const DEFAULT_DRAW_SIZE = 10;

type Line = NonNullable<NonNullable<Map['lines']>[string]>;

export const DrawLayer: Component<{
    map?: Map;
    onUpdate?: (update: MapUpdate) => void;
    onOptionsUpdate?: (options: NonNullable<MapUpdate['layerOptions']>['draw']) => void;
}> = props => {
    const context = useMapViewerContext('Draw', { shortcut: 'd' });
    const [ref, setRef] = createSignal<HTMLDivElement>();
    const [canvas, setCanvas] = createSignal<HTMLCanvasElement>();
    const [currentLine, setCurrentLine] = createSignal<[id: string, line: Line]>();
    const size = createElementSize(ref);
    const options = createMemo(() => props.map?.layerOptions?.draw);
    const canvasContext = createMemo(() => canvas()?.getContext('2d'));

    const lines = createMemo(() =>
        currentLine() ? [...Object.values(untrack(() => props.map?.lines) ?? {}), currentLine()![1]] : Object.values(props.map?.lines ?? {})
    );

    createEffect(() => {
        if (canvas() && size.width && size.height) {
            canvas()!.width = size.width;
            canvas()!.height = size.height;
        }
    });

    createEffect(() => {
        const line = currentLine();
        if (!line) return;
        props.onUpdate?.({
            lines: {
                ...untrack(() => props.map?.lines),
                [line[0]]: line[1]
            }
        });
    });

    createEffect(() => {
        const ctx = canvasContext();
        currentLine();
        if (!ctx || !size.height || !size.width) return;

        ctx.reset();

        for (const line of lines()) {
            if (!line || !line.points.length) return;
            ctx.lineWidth = line.size;
            ctx.strokeStyle = `${line.color}88`;
            ctx.beginPath();
            ctx.moveTo(line.points[0].x * size.width, line.points[0].y * size.height);
            for (const point of line.points) {
                ctx.lineTo(point.x * size.width, point.y * size.height);
            }
            ctx.stroke();
            ctx.closePath();
        }
    });

    function onMouseDown(e: MouseEvent & { currentTarget: HTMLCanvasElement }) {
        const line = {
            color: options()?.color ?? DEFAULT_DRAW_COLOR,
            size: options()?.size ?? DEFAULT_DRAW_SIZE,
            points: [{ x: e.layerX / e.currentTarget.clientWidth, y: e.layerY / e.currentTarget.clientHeight }]
        };
        const id = crypto.randomUUID();
        setCurrentLine([id, line]);
    }

    function onMouseUp(_e: MouseEvent & { currentTarget: HTMLCanvasElement }) {
        const line = currentLine();
        if (!line) return;
        setCurrentLine();
    }

    function onMouseMove(e: PointerEvent & { currentTarget: HTMLCanvasElement }) {
        if (!currentLine()) return;

        const points = e
            .getCoalescedEvents()
            .map(p => ({ x: p.layerX / e.currentTarget.clientWidth, y: p.layerY / e.currentTarget.clientHeight }));

        setCurrentLine(
            line =>
                line && [
                    line[0],
                    {
                        ...line[1],
                        points: [...line[1].points, ...points]
                    }
                ]
        );
    }

    return (
        <>
            <Portal mount={context.getPortal()}>
                <div class="grid grid-cols-[1fr_min-content_max-content] gap-1 p-1">
                    <label for="draw-color">Grid Color</label>
                    <button type="button" onClick={() => props.onOptionsUpdate?.({ color: DEFAULT_DRAW_COLOR })} title="Reset to default">
                        ⟳
                    </button>
                    <input
                        type="color"
                        id="draw-color"
                        value={options()?.color ?? DEFAULT_DRAW_COLOR}
                        onInput={e => props.onOptionsUpdate?.({ color: e.target.value })}
                    />
                    <label for="draw-size">Size</label>
                    <button type="button" onClick={() => props.onOptionsUpdate?.({ size: DEFAULT_DRAW_SIZE })} title="Reset to default">
                        ⟳
                    </button>
                    <input
                        type="number"
                        class="w-12"
                        id="draw-size"
                        value={options()?.size ?? DEFAULT_DRAW_SIZE}
                        onInput={e => props.onOptionsUpdate?.({ size: Number.parseInt(e.target.value) })}
                    />
                    <button
                        type="button"
                        onClick={() => {
                            const { [Object.keys(props.map?.lines ?? {}).at(-1) ?? '']: _, ...lines } = props.map?.lines ?? {};
                            props.onUpdate?.({
                                lines
                            });
                        }}>
                        Undo
                    </button>
                    <button type="button" class="col-start-2 col-span-2" onClick={() => props.onUpdate?.({ lines: {} })}>
                        Clear
                    </button>
                </div>
            </Portal>
            <div
                ref={setRef}
                class={'absolute top-0 left-0 right-0 bottom-0'}
                classList={{
                    'pointer-events-none': !context.isActive()
                }}>
                <canvas
                    ref={setCanvas}
                    class="w-[100%] h-[100%]"
                    onMouseDown={onMouseDown}
                    onMouseUp={onMouseUp}
                    onMouseOut={onMouseUp}
                    onPointerMove={onMouseMove}
                />
            </div>
        </>
    );
};
