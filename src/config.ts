import path from 'node:path';

export const Config = {
    storageDir: path.resolve(process.env.STORAGE_DIR ?? './storage'),
    dataDir: path.resolve(process.env.DATA_DIR ?? './data')
};

export default Config;
