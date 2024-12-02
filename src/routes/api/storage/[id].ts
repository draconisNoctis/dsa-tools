import type { APIEvent } from "@solidjs/start/server";
import { LRUCache } from "lru-cache";
import {  randomUUID } from 'node:crypto'
import fs from 'node:fs';
import path from 'node:path';
import Config from "~/config";
import { fileTypeFromBuffer, type FileTypeResult } from 'file-type'
import imageSize from 'image-size';

// interface CacheItem {
//     mimeType: string;
//     ext: string;
//     buffer: Buffer;
//     image?: {
//         size: { width: number; height: number };
//     }
// }

class CacheItem {
    constructor(public readonly buffer: Buffer, public readonly file: FileTypeResult) {}

    getHeaders(): Record<string, string> {
        return {
            'Content-Type': this.file.mime
        }
    }
}

class ImageCacheItem extends CacheItem {
    constructor(buffer: Buffer, file: FileTypeResult, public readonly size: { width: number; height: number }) {
        super(buffer, file);
    }

    getHeaders(): Record<string, string> {
        return {
            ...super.getHeaders(),
            'X-Width': this.size.width.toString(),
            'X-Height': this.size.height.toString()
        }
    }
}

const cache = new LRUCache<string, CacheItem>({ max: 10 });

export async function GET(event: APIEvent) {
    const id = event.params.id;

    try {
        let cacheItem = cache.get(id);
        if(!cacheItem) {
            const file = path.resolve(Config.storageDir, id);
            const buffer = await fs.promises.readFile(file);
            const fileType = await fileTypeFromBuffer(buffer);

            if(!fileType) {
                return new Response(JSON.stringify({ error: 'Unknown file type'}), { status: 500 });
            }
            if(fileType.mime.startsWith('image/')) {
                const size = imageSize(buffer);
                if(null == size.width || null == size.height) {
                    return new Response(JSON.stringify({ error: 'Invalid image type'}), { status: 500 });
                }
                cacheItem = new ImageCacheItem(buffer, fileType, { width: size.width, height: size.height });
            } else {
                cacheItem = new CacheItem(buffer, fileType);
            }
            cache.set(id, cacheItem)
        }

        return new Response(cacheItem.buffer, {
            headers: cacheItem.getHeaders()
        });

    } catch(err) {
        if(err instanceof Error && 'code' in err) {
            if(err.code === 'ENOENT') {
                return new Response(JSON.stringify({ error: 'Not found'}), { status: 404 })
            }
        }
        throw err;
    }
}