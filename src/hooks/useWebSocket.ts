import { onCleanup } from 'solid-js';
import { type SetStoreFunction, type Store, type StoreSetter, createStore } from 'solid-js/store';
import { isServer } from 'solid-js/web';

export function useWebSocket<T extends {}>(
    path: string,
    initialValue: T,
    fn: (event: MessageEvent) => StoreSetter<T>
): [store: Store<T>, { send: (val: string | ArrayBuffer | Blob | ArrayBufferView) => void; set: SetStoreFunction<T> }] {
    const [store, setStore] = createStore<T>(initialValue);

    if (isServer) {
        return [initialValue, { send: () => {}, set: setStore }];
    }
    const wsUrl = `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}${path}`;

    const ws = new WebSocket(wsUrl);

    ws.addEventListener('message', event => setStore(fn(event)));

    onCleanup(() => {
        if (ws.readyState !== ws.CLOSED && ws.readyState !== ws.CLOSING) {
            ws.close();
        }
    });

    return [
        store,
        {
            send: (val: string | ArrayBuffer | Blob | ArrayBufferView) => {
                if (ws.readyState === ws.OPEN) {
                    ws.send(val);
                }
            },
            set: setStore
        }
    ];
}