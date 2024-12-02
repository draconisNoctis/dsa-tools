import { type Component, Index, createMemo } from 'solid-js';
import type { Map } from '../../../server/databases/map.db';

export const GridLayer: Component<{
    map?: Map;
    preview?: boolean;
    onCellClick?: (cell: { row: number; col: number }) => void;
}> = props => {
    const cells = createMemo(() =>
        props.map?.size?.height && props.map?.size?.width
            ? Array.from({ length: (props.map.size.height + 2) * (props.map.size.width + 2) }, (_, i) => ({
                  row: ((i / (props.map!.size!.width + 2)) | 0) - 1,
                  col: (i % (props.map!.size!.width + 2)) - 1
              }))
            : []
    );

    return (
        <div
            class="absolute top-0 left-0 right-0 bottom-[-1px] grid border border-black border-l-0 border-t-0"
            style={{
                'grid-template-columns': `${(props.map?.offset?.left ?? 0) * 0.1}% repeat(${props.map?.size?.width ?? 0}, 1fr) ${(props.map?.offset?.right ?? 0) * 0.1}%`,
                'grid-template-rows': `${(props.map?.offset?.top ?? 0) * 0.1}%repeat(${props.map?.size?.height ?? 0}, 1fr) ${(props.map?.offset?.bottom ?? 0) * 0.1}%`
            }}>
            <Index each={cells()}>
                {cell => {
                    const isOffset = createMemo(
                        () =>
                            cell().row === -1 ||
                            cell().col === -1 ||
                            cell().row === props.map?.size?.height ||
                            cell().col === props.map?.size?.width
                    );
                    const isOpened = createMemo(() => !!props.map?.cells?.[`${cell().row}:${cell().col}`]);
                    return (
                        <div
                            class="border border-black border-r-0 border-b-0"
                            classList={{
                                'bg-gray-900': !isOpened() && !isOffset() && props.preview,
                                'bg-gray-900/90': !isOpened() && !isOffset() && !props.preview,
                                'bg-gray-700': isOffset() && props.preview,
                                'bg-gray-700/90': isOffset() && !props.preview
                            }}
                            onClick={isOffset() ? undefined : () => props.onCellClick?.(cell())}
                        />
                    );
                }}
            </Index>
        </div>
    );
};
