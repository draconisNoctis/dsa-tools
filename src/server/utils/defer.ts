export interface Defer<T> extends Promise<T> {
    resolve(value: T | PromiseLike<T>): void;
    reject(reason?: unknown): void;
}

export function defer<T>(): Defer<T> {
    let methods: Pick<Defer<T>, 'resolve' | 'reject'>;

    const promise = new Promise<T>((resolve, reject) => {
        methods = { resolve, reject };
    });

    return Object.assign(promise, methods!);
}
