import { type Defer, defer } from './defer';

export class IteratorController<T, R = never> implements AsyncIterable<T, R> {
    #writingQueue: T[] = [];
    #readingQueue: Defer<T>[] = [];
    #return: Defer<R> | undefined;
    #throw: unknown | undefined;

    shiftWritingQueue(): T | undefined {
        return this.#writingQueue.shift();
    }

    enqueueWritingQueue(value: T): void {
        this.#writingQueue.push(value);
    }

    shiftReadingQueue(): Defer<T> | undefined {
        return this.#readingQueue.shift();
    }

    enqueueReadingQueue(): Defer<T> {
        const value = defer<T>();
        this.#readingQueue.push(value);
        return value;
    }

    getReturn(): Defer<R> {
        if (!this.#return) {
            this.#return = defer<R>();
        }
        return this.#return;
    }

    getThrow(): unknown | undefined {
        return this.#throw;
    }

    next(value: T): Promise<void> {
        const q = this.shiftReadingQueue();
        if (q) {
            q.resolve(value);
            return Promise.resolve();
        }
        this.enqueueWritingQueue(value);
        return Promise.resolve();
    }

    throw(error: unknown): void {
        const q = this.shiftReadingQueue();
        if (q) {
            q.reject(error);
            return;
        }
        this.#throw = error;
    }

    return(value: R) {
        if (!this.#return) {
            this.#return = defer<R>();
        }

        this.#return.resolve(value);
    }

    [Symbol.asyncIterator](): IteratorController.Iterator<T, R> {
        return new IteratorController.Iterator(this);
    }
}

export namespace IteratorController {
    export class Iterator<T, R> implements AsyncIterator<T, R> {
        controller: IteratorController<T, R>;

        constructor(controller: IteratorController<T, R>) {
            this.controller = controller;
        }

        async next(): Promise<IteratorResult<T, R>> {
            const t = this.controller.getThrow();
            if (t) {
                throw t;
            }
            const w = this.controller.shiftWritingQueue();
            if (w) return { done: false, value: w };

            return { done: false, value: await this.controller.enqueueReadingQueue() };
        }

        async return(): Promise<IteratorResult<T, R>> {
            const t = this.controller.getThrow();
            if (t) {
                throw t;
            }
            return { done: true, value: await this.controller.getReturn() };
        }
    }
}
