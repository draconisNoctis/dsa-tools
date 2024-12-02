import type { APIEvent } from "@solidjs/start/server";

export function GET(event: APIEvent) {
    const resp = new Response(mkStream((async function*() {
        for(let i = 0; i < 10; i++) {
            await sleep(1000);
            yield { event: 'pong', id: i, data: { id: event.params.id, i }}
        }
    })()), {
        headers: { 'Content-Type': 'text/event-stream' },
    });

    const id = event.request.headers.get('x-sse-id');
    console.log({ id });
    const broadcast = new BroadcastChannel('SSE-Plugin');

    const listener = (event: MessageEvent<{ id: string, type: 'close' }>) => {
        if(event.data.id !== id) return;
        console.log('cancel');
        broadcast.removeEventListener('message', listener);
    };

    broadcast.addEventListener('message', listener)

    return resp;
}

function mkStream(it: AsyncIterable<{ data: unknown, event?: string, id?: string | number }>) {
    const encoder = new TextEncoder();
    const _it = it[Symbol.asyncIterator]();
    return new ReadableStream({
        // async start(controller) {
        //     for await(const value of it) {
                
        //         console.log('start', value);
        //         if(value.id != null) controller.enqueue(encoder.encode(`id: ${value.id}\n`));
        //         if(value.event) controller.enqueue(encoder.encode(`event: ${value.event}\n`));
        //         if(value.data) controller.enqueue(encoder.encode(`data: ${JSON.stringify(value.data)}\n\n`));
        //     }
        //     controller.close();
        // },
        async pull(controller) {
            const { value, done } = await _it.next();

            if(value) {
                console.log('pull', value);
                if(value.id != null) controller.enqueue(encoder.encode(`id: ${value.id}\n`));
                if(value.event) controller.enqueue(encoder.encode(`event: ${value.event}\n`));
                if(value.data) controller.enqueue(encoder.encode(`data: ${JSON.stringify(value.data)}\n\n`));
            }

            if(done) {
                controller.close();
            }
        },
        cancel(reason) {
            console.log('cancel', { reason });
        }
    })
}

function sleep(ms: number): Promise<void> {
    return new Promise<void>(r => setTimeout(r, ms));
}