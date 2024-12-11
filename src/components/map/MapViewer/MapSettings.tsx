import type { Component } from 'solid-js';
import { Portal } from 'solid-js/web';
import type { Map, MapUpdate } from '../../../server/databases/map.db';
import { useMapViewerContext } from './MapViewerContext';

export interface MapSettingsProps {
    map?: Map;
    onUpdate?: (settings: MapUpdate) => void;
}

export const MapSettings: Component<MapSettingsProps> = props => {
    const context = useMapViewerContext('Settings');

    return (
        <>
            <Portal mount={context.getPortal()}>
                <div class="grid grid-cols-[max-content_1fr] gap-1 p-1">
                    <label for="settings-name">Name</label>
                    <input
                        class="w-[100%]"
                        type="text"
                        id="settings-name"
                        value={props.map?.name}
                        onInput={e => props.onUpdate?.({ name: e.target.value })}
                    />
                    <label for="settings-image">Image</label>
                    <div>
                        <label for="settings-image">
                            <img
                                class="max-w-[100%] max-h-[120px] object-contain"
                                src={props.map?.imageId ? `/api/storage/${props.map.imageId}` : 'https://placehold.co/160x120'}
                                alt=""
                            />
                        </label>
                        <input
                            type="file"
                            class="w-0 h-0 invisible absolute"
                            id="settings-image"
                            accept=".jpg,.jpeg,.png"
                            onInput={async e => {
                                fetch('/api/storage', {
                                    method: 'POST',
                                    body: e.currentTarget.files![0]
                                })
                                    .then(r => r.json())
                                    .then(({ id }) => props.onUpdate?.({ imageId: id }));
                            }}
                        />
                    </div>
                </div>
            </Portal>
        </>
    );
};
