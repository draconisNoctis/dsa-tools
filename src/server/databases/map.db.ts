import path from 'node:path';
import z from 'zod';
import Config from '../../config';
import { type CreateInput, type InferDbT, type InferDocument, NoDb, type UpdateInput } from '../utils/no-db';

export const MapDb = new NoDb(
    path.join(Config.dataDir, 'map'),
    z.object({
        name: z.string(),
        imageId: z.string().nullable().optional(),
        offset: z
            .object({
                top: z.number(),
                left: z.number(),
                right: z.number(),
                bottom: z.number()
            })
            .nullable()
            .optional(),
        size: z
            .object({
                width: z.number(),
                height: z.number()
            })
            .nullable()
            .optional(),
        cells: z.record(z.string(), z.boolean().nullable().optional()).nullable().optional(),
        cursor: z
            .object({
                x: z.number().min(0).max(1),
                y: z.number().min(0).max(1)
            })
            .nullable()
            .optional(),
        marker: z
            .record(
                z.string(),
                z.object({
                    pos: z.object({
                        x: z.number().min(0).max(1),
                        y: z.number().min(0).max(1)
                    }),
                    color: z.string(),
                    text: z.string()
                })
            )
            .nullable()
            .optional()
    })
);

export type Map = InferDocument<typeof MapDb>;
export type MapCreate = CreateInput<InferDbT<typeof MapDb>>;
export type MapUpdate = UpdateInput<InferDbT<typeof MapDb>>;

// fs.mkdirSync(Config.dataDir, { recursive: true });
// const DB = new SqliteDatabase(path.join(Config.dataDir, 'map.sqlite'));

// await DB.run(`
//     CREATE TABLE IF NOT EXISTS map (
//         id TEXT PRIMARY KEY NOT NULL,

//     );
// `);

// async function init() {}
