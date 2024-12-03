import { createWindowSize } from '@solid-primitives/resize-observer';
import { type Component, createMemo, createResource } from 'solid-js';
import type { Map, MapUpdate } from '../../../server/databases/map.db';
import { CursorLayer } from './CursorLayer';
import { DrawLayer } from './DrawLayer';
import { GridLayer } from './GridLayer';
import { MarkerLayer } from './MarkerLayer';

export interface MapViewerProps {
    preview?: boolean;
    map?: Map;
    onUpdate?: (update: MapUpdate) => void;
}

export const MapViewer: Component<MapViewerProps> = props => {
    const windowSize = createWindowSize();
    const [image] = createResource(() => props.map?.imageId && `/api/storage/${props.map.imageId}`, fetchImage);

    const screenAspect = createMemo(() => windowSize.width / windowSize.height);
    const imageAspect = createMemo(() => (image() ? image()!.width / image()!.height : 0));

    const className = createMemo(() => (props.preview ? (screenAspect() > imageAspect() ? 'h-[100vh]' : 'w-[100vw]') : 'w-[100%]'));

    return (
        <div class={` flex items-center justify-center bg-gray-500 w-100% ${props.preview ? 'h-[100vh]' : ''} overflow-hidden`}>
            <div
                class={`relative ${className()} bg-cover`}
                style={{
                    'aspect-ratio': imageAspect(),
                    'background-image': `url(${image()?.objectUrl})`
                }}>
                <GridLayer
                    map={props.map}
                    preview={props.preview}
                    onCellClick={cell => {
                        props.onUpdate?.({
                            cells: {
                                ...props.map?.cells,
                                [`${cell.row}:${cell.col}`]: !props.map?.cells?.[`${cell.row}:${cell.col}`] || undefined
                            }
                        });
                    }}
                    onOptionsUpdate={options => {
                        props.onUpdate?.({
                            layerOptions: {
                                ...props.map?.layerOptions,
                                grid: { ...props.map?.layerOptions?.grid, ...options }
                            }
                        });
                    }}
                />
                <MarkerLayer map={props.map} onUpdate={props.preview ? undefined : props.onUpdate} />
                <DrawLayer
                    map={props.map}
                    onUpdate={props.preview ? undefined : props.onUpdate}
                    onOptionsUpdate={options => {
                        props.onUpdate?.({
                            layerOptions: {
                                ...props.map?.layerOptions,
                                draw: { ...props.map?.layerOptions?.draw, ...options }
                            }
                        });
                    }}
                />
                <CursorLayer
                    map={props.map}
                    onUpdate={props.preview ? undefined : props.onUpdate}
                    onOptionsUpdate={options => {
                        props.onUpdate?.({
                            layerOptions: {
                                ...props.map?.layerOptions,
                                cursor: { ...props.map?.layerOptions?.cursor, ...options }
                            }
                        });
                    }}
                />
            </div>
        </div>
    );
};

async function fetchImage(url: string) {
    const res = await fetch(url);
    const blob = await res.blob();
    const objectUrl = URL.createObjectURL(blob);
    return {
        objectUrl,
        width: Number.parseInt(res.headers.get('X-Width')!),
        height: Number.parseInt(res.headers.get('X-Height')!)
    };
}
