import type { Component } from 'solid-js';
import type { Map, MapUpdate } from '../../../server/databases/map.db';
import { MapOffset } from './MapOffset';
import { MapSize } from './MapSize';

export interface MapSettingsProps {
    map?: Map;
    onUpdate?: (settings: MapUpdate) => void;
}

export const MapSettings: Component<MapSettingsProps> = props => {
    return (
        <div class="flex flex-row items-start gap-2">
            <div class="bg-sky-900 border-1 rounded-md p-2 text-black">
                <input type="text" value={props.map?.name} onInput={e => props.onUpdate?.({ name: e.target.value })} />
            </div>
            <div class="bg-sky-900 border-1 rounded-md p-2 text-black">
                <input
                    type="file"
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
            <MapOffset offset={props.map?.offset} onUpdate={offset => props.onUpdate?.({ offset })} />
            <MapSize size={props.map?.size} onUpdate={size => props.onUpdate?.({ size })} />
        </div>
    );
};
