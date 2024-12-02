import type { APIEvent } from "@solidjs/start/server";
import {  randomUUID } from 'node:crypto'
import fs from 'node:fs';
import path from 'node:path';
import Config from "~/config";

export async function POST(event: APIEvent) {
    const id = randomUUID();
    await fs.promises.mkdir(Config.storageDir, { recursive: true });

    const buffer = Buffer.from(await event.request.arrayBuffer());

    await fs.promises.writeFile(path.resolve(Config.storageDir, id), buffer);

    return { success: true, id };
}