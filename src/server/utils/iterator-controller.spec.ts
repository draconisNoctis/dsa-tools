import { describe, expect, it } from 'vitest';
import { IteratorController } from './iterator-controller';

describe('IteratorController', () => {
    it('should queue reads', async () => {
        const it = new IteratorController<string>();
        const iter = it[Symbol.asyncIterator]();

        const r1 = iter.next();
        const r2 = iter.next();
        const r3 = iter.next();

        it.next('foo');
        it.next('bar');
        it.next('baz');

        expect(await r1).toEqual({ done: false, value: 'foo' });
        expect(await r2).toEqual({ done: false, value: 'bar' });
        expect(await r3).toEqual({ done: false, value: 'baz' });
    });

    it('should queue writes', async () => {
        const it = new IteratorController<string>();
        const iter = it[Symbol.asyncIterator]();

        it.next('foo');
        it.next('bar');
        it.next('baz');

        expect(await iter.next()).toEqual({ done: false, value: 'foo' });
        expect(await iter.next()).toEqual({ done: false, value: 'bar' });
        expect(await iter.next()).toEqual({ done: false, value: 'baz' });
    });

    it('should resolve write after read', async () => {
        const it = new IteratorController<string>();
        const iter = it[Symbol.asyncIterator]();

        const p = it.next('foo');

        let resolved = false;
        p.then(() => {
            resolved = true;
        });

        expect(resolved).toEqual(false);

        await iter.next();

        expect(resolved).toEqual(true);
    });

    it('should resolve write instantly for reading queue', async () => {
        const it = new IteratorController<string>();
        const iter = it[Symbol.asyncIterator]();

        iter.next();

        const p = it.next('foo');

        let resolved = false;
        await p.then(() => {
            resolved = true;
        });

        expect(resolved).toEqual(true);
    });

    it('should throw after read', async () => {
        const it = new IteratorController<string>();
        const iter = it[Symbol.asyncIterator]();

        const err = new Error('foobar');

        it.throw(err);

        await expect(() => iter.next()).rejects.toEqual(err);
    });

    it('should throw after write', async () => {
        const it = new IteratorController<string>();
        const iter = it[Symbol.asyncIterator]();

        const err = new Error('foobar');

        const p = iter.next();

        it.throw(err);

        await expect(p).rejects.toEqual(err);
    });
});
