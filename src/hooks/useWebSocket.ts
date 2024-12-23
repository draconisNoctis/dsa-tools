import { onCleanup } from 'solid-js';
import { type SetStoreFunction, type Store, type StoreSetter, createStore } from 'solid-js/store';
import { isServer } from 'solid-js/web';

export function useWebSocket<T extends {}>(
    path: string,
    initialValue: T,
    fn: (event: MessageEvent) => StoreSetter<T>
): [
    store: Store<T>,
    { send: (val: string | ArrayBuffer | Blob | ArrayBufferView) => void; set: SetStoreFunction<T>; reconnect: () => void }
] {
    const [store, setStore] = createStore<T>(initialValue);

    if (isServer) {
        return [initialValue, { send: () => {}, set: setStore, reconnect: () => {} }];
    }
    const wsUrl = `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}${path}`;

    const messageQueue: (string | ArrayBufferLike | Blob | ArrayBufferView)[] = [];
    let errorCount = 0;
    let ws: WebSocket;

    function connect() {
        try {
            if (ws) ws.close();
        } catch {}
        ws = new WebSocket(wsUrl);
        ws.addEventListener('message', event => setStore(fn(event)));
        ws.addEventListener('open', () => {
            for (const message of messageQueue) {
                ws.send(message);
            }
            messageQueue.length = 0;
        });
        ws.addEventListener('error', err => {
            console.error(err);
            ++errorCount;
            setTimeout(connect, Math.min(60_000, errorCount ** Math.SQRT2 * 1000));
        });
    }

    connect();

    onCleanup(() => {
        if (ws.readyState !== ws.CLOSED && ws.readyState !== ws.CLOSING) {
            ws.close();
        }
    });

    return [
        store,
        {
            send: (message: string | ArrayBuffer | Blob | ArrayBufferView) => {
                if (ws.readyState === ws.OPEN) {
                    ws.send(message);
                } else {
                    messageQueue.push(message);
                }
            },
            set: setStore,
            reconnect: () => {
                errorCount = 0;
                connect();
            }
        }
    ];
}
