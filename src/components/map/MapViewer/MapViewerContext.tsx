import { makePersisted } from '@solid-primitives/storage';
import { createContext, createSignal, onCleanup, useContext } from 'solid-js';
import { createStore } from 'solid-js/store';
import { isServer } from 'solid-js/web';

export class MapViewerCtx {
    #activeLayer = makePersisted(createSignal<string>());

    #store = createStore<{ layer: Map<string, { node: Node; options?: IMapViewContextOptions }> }>({
        layer: new Map()
    });

    get layer() {
        return this.#store[0].layer;
    }

    getPortal(name: string): Node {
        return this.#store[0].layer.get(name)!.node;
    }

    isActive(name: string) {
        return name === this.#activeLayer[0]();
    }

    setActive(name: string) {
        this.#activeLayer[1](name);
    }

    registerLayer(name: string, options?: IMapViewContextOptions): void {
        if (isServer) return;
        if (!this.#activeLayer[0]()) {
            this.#activeLayer[1](name);
        }
        this.#store[1](store => ({
            layer: new Map([...store.layer, [name, { node: document.createElement('div'), options }]])
        }));
    }
    unregisterLayer(name: string): void {
        this.#store[1](store => {
            const layer = new Map(store.layer);
            layer.delete(name);
            return { layer };
        });
    }
}

export class NamedMapViewerCtx {
    #ctx: MapViewerCtx;
    #name: string;
    constructor(ctx: MapViewerCtx, name: string) {
        this.#ctx = ctx;
        this.#name = name;
    }

    getPortal(): Node {
        return this.#ctx.getPortal(this.#name);
    }

    isActive() {
        return this.#ctx.isActive(this.#name);
    }

    setActive() {
        return this.#ctx.setActive(this.#name);
    }
}

export const MapViewerContext = createContext<MapViewerCtx>();

export interface IMapViewContextOptions {
    shortcut?: string;
}

export function useMapViewerContext(name: string, options?: IMapViewContextOptions): NamedMapViewerCtx;
export function useMapViewerContext(): MapViewerCtx;
export function useMapViewerContext(name?: string, options?: IMapViewContextOptions): MapViewerCtx | NamedMapViewerCtx {
    const ctx = useContext(MapViewerContext);
    if (!ctx) {
        throw new Error('MapViewerContext required');
    }
    if (name) {
        ctx.registerLayer(name, options);
        onCleanup(() => ctx.unregisterLayer(name));
        return new NamedMapViewerCtx(ctx, name);
    }
    return ctx;
}
