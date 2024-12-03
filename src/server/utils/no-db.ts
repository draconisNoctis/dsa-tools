import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { glob } from 'glob';
import type z from 'zod';

export type NoDocumentMeta = { _id: string; _created: string; _updated?: string };

export type CreateInput<T extends z.ZodRawShape> = z.infer<z.ZodObject<T>>;
export type UpdateInput<T extends z.ZodRawShape> = Partial<z.infer<z.ZodObject<T>>>;
export type NoDocument<T extends z.ZodRawShape> = Omit<NoDocumentMeta & z.infer<z.ZodObject<T>>, never>;

export type InferDbT<T extends NoDb<z.ZodRawShape>> = T extends NoDb<infer I> ? I : never;
export type InferDocument<T extends NoDb<z.ZodRawShape>> = NoDocument<InferDbT<T>>; //T extends NoDb<infer I> ? NoDocument<I> : never;

export class NoDb<T extends z.ZodRawShape> {
    #dir: string;
    readonly schema: z.ZodObject<T>;
    readonly partialSchema: z.ZodObject<{
        [K in keyof T]: z.ZodOptional<T[K]>;
    }>;

    constructor(dir: string, schema: z.ZodObject<T>) {
        fs.mkdirSync(dir, { recursive: true });
        this.#dir = dir;
        this.schema = schema;
        this.partialSchema = schema.partial();
    }

    async list(): Promise<NoDocument<T>[]> {
        const files = await glob('*.json', { cwd: this.#dir });
        return await Promise.all(files.map(file => this.read(path.basename(file, path.extname(file)))));
    }

    async create(values: CreateInput<T>): Promise<NoDocument<T>> {
        const doc = {
            _id: randomUUID(),
            _created: new Date().toISOString(),
            ...this.schema.parse(values)
        };

        await fs.promises.writeFile(path.join(this.#dir, `${doc._id}.json`), JSON.stringify(doc, null, 2), { flag: 'wx' });

        return doc;
    }

    async read(id: string): Promise<NoDocument<T>> {
        return JSON.parse(await fs.promises.readFile(path.join(this.#dir, `${id}.json`), 'utf-8'));
    }

    update(id: string, update: UpdateInput<T>): Promise<NoDocument<T>> {
        const doc = {
            _id: id,
            ...JSON.parse(fs.readFileSync(path.join(this.#dir, `${id}.json`), 'utf-8')),
            ...this.partialSchema.parse(update),
            _updated: new Date().toISOString()
        };

        fs.writeFileSync(path.join(this.#dir, `${doc._id}.json`), JSON.stringify(doc, null, 2));

        return Promise.resolve(doc);
    }

    async delete(id: string): Promise<void> {
        await fs.promises.unlink(path.join(this.#dir, `${id}.json`));
    }
}

// const db = new NoDb(
//     './foo',
//     z.object({
//         name: z.string(),
//         age: z.number()
//     })
// );

// db.create({ name: 'Foobar', age: 0 });
// db.update('', { age: 1 });
