import { createElementSize } from '@solid-primitives/resize-observer';
import {
    type Component,
    For,
    type ParentComponent,
    createContext,
    createEffect,
    createMemo,
    createSignal,
    untrack,
    useContext
} from 'solid-js';
import { Portal } from 'solid-js/web';
import type { Map, MapUpdate } from '../../../server/databases/map.db';
import styles from './DrawLayer.module.css';
import { useMapViewerContext } from './MapViewerContext';

const DEFAULT_DRAW_COLOR = '#00ffff';
const DEFAULT_DRAW_SIZE = 10;

type Layer = NonNullable<NonNullable<Map['layers']>[string]>;
type Line = NonNullable<NonNullable<Layer['lines']>[string]>;

type OffscreenCanvas = {
    readonly canvas?: HTMLCanvasElement;
    readonly context2d?: CanvasRenderingContext2D;
};
const OffscreenCanvas = createContext<OffscreenCanvas>();

const OffscreenCanvasProvider: ParentComponent<{ width?: number | null; height?: number | null }> = props => {
    const canvas = createMemo(() => {
        if (!props.height || !props.width) return;
        const canvas = document.createElement('canvas');
        canvas.height = props.height;
        canvas.width = props.width;
        return canvas;
    });
    const context2d = createMemo(() => canvas()?.getContext('2d') ?? undefined);

    return (
        <OffscreenCanvas.Provider
            value={{
                get canvas() {
                    return canvas();
                },
                get context2d() {
                    return context2d();
                }
            }}>
            {props.children}
        </OffscreenCanvas.Provider>
    );
};

function useOffscreenCanvas() {
    const ctx = useContext(OffscreenCanvas);
    if (!ctx) throw new Error('OffscreenCanvas Context required');
    return ctx;
}

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
    const [currentLayerId, setCurrentLayerId] = createSignal<string>();
    const [hoverLayerId, setHoverLayerId] = createSignal<string>();

    const hasCurrentLine = createMemo(() => !!currentLine());

    const layers = createMemo<[string, Layer][]>(() =>
        hasCurrentLine()
            ? Object.entries(untrack(() => JSON.parse(JSON.stringify(props.map?.layers ?? {}))))
            : Object.entries(props.map?.layers ?? {})
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
            layers: {
                ...untrack(() => props.map!.layers!),
                [currentLayerId()!]: {
                    ...untrack(() => props.map!.layers![currentLayerId()!]),
                    lines: {
                        ...untrack(() => props.map!.layers![currentLayerId()!].lines),
                        [line[0]]: line[1]
                    }
                }
            }
        });
    });

    createEffect(() => {
        const ctx = canvasContext();
        if (!ctx || !size.height || !size.width) return;

        ctx.reset();

        for (const [id, layer] of layers()) {
            drawLayer(ctx, layer, context.isActive() && id === hoverLayerId());
        }

        if (currentLine()) {
            drawLine(ctx, currentLine()![1]);
        }
    });

    function onMouseDown(e: MouseEvent & { currentTarget: HTMLCanvasElement }) {
        if (!currentLayerId()) return;
        const line = {
            color: options()?.color ?? DEFAULT_DRAW_COLOR,
            size: options()?.size ?? DEFAULT_DRAW_SIZE,
            points: [{ x: e.layerX / e.currentTarget.clientWidth, y: e.layerY / e.currentTarget.clientHeight }]
        };
        const id = crypto.randomUUID();
        setCurrentLine([id, line]);
    }

    function onMouseUp(_e: MouseEvent & { currentTarget: HTMLCanvasElement }) {
        if (!currentLayerId() || !currentLine()) return;
        setCurrentLine();
    }

    function onMouseMove(e: PointerEvent & { currentTarget: HTMLCanvasElement }) {
        if (!currentLayerId() || !currentLine()) return;

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

    function undo() {
        if (!currentLayerId()) return;

        const { [Object.keys(props.map!.layers![currentLayerId()!]!.lines).pop()!]: _, ...lines } =
            props.map!.layers![currentLayerId()!]!.lines!;

        props.onUpdate?.({
            layers: {
                ...untrack(() => props.map!.layers!),
                [currentLayerId()!]: {
                    ...untrack(() => props.map!.layers![currentLayerId()!]),
                    lines
                }
            }
        });
    }

    return (
        <OffscreenCanvasProvider width={size.width} height={size.height}>
            <Portal mount={context.getPortal()}>
                <div class="grid grid-cols-[1fr_min-content_max-content] gap-1 p-1">
                    <label for="draw-color">Front Color</label>
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
                        class="justify-self-start w-6"
                        type="button"
                        onClick={() => {
                            const id = crypto.randomUUID();
                            setCurrentLayerId(id);
                            props.onUpdate?.({
                                layers: {
                                    ...untrack(() => props.map!.layers!),
                                    [currentLayerId()!]: {
                                        lines: {}
                                    }
                                }
                            });
                        }}>
                        +
                    </button>
                    <div class="col-span-3 grid grid-cols-3 gap-1">
                        <For each={Object.entries(props.map?.layers ?? {})}>
                            {([id, layer]) => (
                                <Layer
                                    active={id === currentLayerId()}
                                    id={id}
                                    layer={layer}
                                    onHover={(_, id) => setHoverLayerId(id)}
                                    onLeave={() => setHoverLayerId()}
                                    onSelect={(_, id) => setCurrentLayerId(id)}
                                    onDelete={() => {
                                        const { [id]: _, ...layers } = props.map?.layers ?? {};
                                        props.onUpdate?.({
                                            layers
                                        });
                                        setCurrentLayerId();
                                    }}
                                />
                            )}
                        </For>
                    </div>
                    <button type="button" onClick={undo}>
                        Undo
                    </button>
                    <button type="button" class="col-start-2 col-span-2" onClick={() => props.onUpdate?.({ layers: {} })}>
                        Clear All
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
        </OffscreenCanvasProvider>
    );
};

const Layer: Component<{
    active: boolean;
    id: string;
    layer: Layer;
    onHover: (layer: Layer, id: string) => void;
    onLeave: (layer: Layer, id: string) => void;
    onSelect: (layer: Layer, id: string) => void;
    onDelete: (layer: Layer, id: string) => void;
}> = props => {
    const offscreenCanvas = useOffscreenCanvas();

    const image = createMemo(() => {
        const ctx = offscreenCanvas.context2d;
        if (!ctx) return;

        ctx.reset();
        drawLayer(ctx, props.layer);

        return offscreenCanvas.canvas!.toDataURL('image/png');
    });

    return (
        <div
            class={`${styles.Layer} relative`}
            onMouseOver={() => props.onHover(props.layer, props.id)}
            onMouseOut={() => props.onLeave(props.layer, props.id)}>
            <img
                class=""
                classList={{ 'bg-gray-50': !props.active, 'bg-gray-300': props.active }}
                src={image()}
                alt={props.id}
                onClick={() => props.onSelect(props.layer, props.id)}
            />
            <button
                type="button"
                class="absolute top-1 right-1 text-xs bg-red-800 rounded px-1"
                onClick={() => props.onDelete(props.layer, props.id)}>
                🗑
            </button>
        </div>
    );
};

function drawLayer(ctx: CanvasRenderingContext2D, layer: Layer, highlight = false) {
    for (const line of Object.values(layer.lines)) {
        if (highlight) {
            drawLine(ctx, { ...line, color: '#ffff00', size: line.size * 2 });
        }
        drawLine(ctx, line);
    }
}

function drawLine(ctx: CanvasRenderingContext2D, line: Line) {
    ctx.lineWidth = (line.size * ctx.canvas.width) / 1000;
    ctx.strokeStyle = `${line.color}88`;
    // if (highlight) ctx.fillStyle = '#ffff00';
    ctx.beginPath();
    ctx.moveTo(line.points[0].x * ctx.canvas.width, line.points[0].y * ctx.canvas.height);
    for (const point of line.points) {
        ctx.lineTo(point.x * ctx.canvas.width, point.y * ctx.canvas.height);
    }
    ctx.stroke();
    // if (highlight) ctx.fill();
    ctx.closePath();
}
