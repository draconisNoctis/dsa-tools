import * as sqlite3 from 'sqlite3';
import { IteratorController } from './iterator-controller';

export type NamedParams = Record<string, string | number>;
export type IndexParams = (string | number)[];

export class SqliteDatabase {
    #db: sqlite3.Database;

    constructor(filename: string, mode?: number) {
        this.#db = new sqlite3.Database(filename, mode);
    }

    get inner() {
        return this.#db;
    }

    close(): Promise<void> {
        return new Promise((resolve, reject) => {
            this.#db.close(err => {
                if (err) reject(err);
                else resolve();
            });
        });
    }

    run(sql: string, object: NamedParams): Promise<sqlite3.RunResult>;
    run(sql: string, ...params: (number | string)[]): Promise<sqlite3.RunResult>;
    run(sql: string, ...params: unknown[]): Promise<sqlite3.RunResult> {
        return new Promise((resolve, reject) => {
            // If there is only one argument, unwrap it to allow the user to pass an object for named parameters.
            const p = params.length === 1 ? params[0] : params;
            this.#db.run(sql, p, function (err) {
                if (err) reject(err);
                else resolve(this);
            });
        });
    }

    get<T>(sql: string, object: NamedParams): Promise<T>;
    get<T>(sql: string, ...params: (number | string)[]): Promise<T>;
    get<T>(sql: string, ...params: unknown[]): Promise<T> {
        return new Promise((resolve, reject) => {
            // If there is only one argument, unwrap it to allow the user to pass an object for named parameters.
            const p = params.length === 1 ? params[0] : params;
            this.#db.get<T>(sql, p, (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    }

    all<T>(sql: string, object: NamedParams): Promise<T[]>;
    all<T>(sql: string, ...params: (number | string)[]): Promise<T[]>;
    all<T>(sql: string, ...params: unknown[]): Promise<T[]> {
        return new Promise((resolve, reject) => {
            // If there is only one argument, unwrap it to allow the user to pass an object for named parameters.
            const p = params.length === 1 ? params[0] : params;
            this.#db.all<T>(sql, p, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    each<T>(sql: string, params: NamedParams | IndexParams): IteratorController<T, number> {
        const itController = new IteratorController<T, number>();

        this.#db.each<T>(
            sql,
            params,
            (err, row) => {
                if (err) return itController.throw(err);
                itController.next(row);
            },
            (err, count) => {
                if (err) return itController.throw(err);
                itController.return(count);
            }
        );

        return itController;
    }

    exec(sql: string): Promise<void> {
        return new Promise((resolve, reject) => {
            this.#db.exec(sql, err => {
                if (err) reject(err);
                else resolve();
            });
        });
    }

    prepare(sql: string, ...params: unknown[]): Promise<SqliteStatement> {
        return new Promise((resolve, reject) => {
            // If there is only one argument, unwrap it to allow the user to pass an object for named parameters.
            const p = params.length === 1 ? params[0] : params;
            this.#db.prepare(sql, p, function (err) {
                if (err) reject(err);
                else resolve(new SqliteStatement(this));
            });
        });
    }
}

export class SqliteStatement {
    constructor(private statement: sqlite3.Statement) {}

    get inner(): sqlite3.Statement {
        return this.statement;
    }

    bind(object: NamedParams): Promise<void>;
    bind(...params: IndexParams): Promise<void>;
    bind(...params: unknown[]): Promise<void> {
        return new Promise((resolve, reject) => {
            // If there is only one argument, unwrap it to allow the user to pass an object for named parameters.
            const p = params.length === 1 ? params[0] : params;
            this.statement.bind(p, (err: Error | null) => {
                if (err) reject(err);
                else resolve();
            });
        });
    }

    reset(): Promise<void> {
        return new Promise(resolve => {
            this.statement.reset(() => {
                resolve();
            });
        });
    }

    finalize(): Promise<void> {
        return new Promise((resolve, reject) => {
            this.statement.finalize(err => {
                if (err) reject();
                else resolve();
            });
        });
    }

    run(object: NamedParams): Promise<sqlite3.RunResult>;
    run(...params: IndexParams): Promise<sqlite3.RunResult>;
    run(...params: unknown[]): Promise<sqlite3.RunResult> {
        return new Promise((resolve, reject) => {
            // If there is only one argument, unwrap it to allow the user to pass an object for named parameters.
            const p = params.length === 1 ? params[0] : params;
            this.statement.run(p, function (err) {
                if (err) reject(err);
                else resolve(this);
            });
        });
    }

    get<T>(...params: unknown[]): Promise<T | undefined> {
        return new Promise((resolve, reject) => {
            // If there is only one argument, unwrap it to allow the user to pass an object for named parameters.
            const p = params.length === 1 ? params[0] : params;
            this.statement.get<T>(p, (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    }

    all<T>(object: NamedParams): Promise<T[]>;
    all<T>(...params: IndexParams): Promise<T[]>;
    all<T>(...params: unknown[]): Promise<T[]> {
        return new Promise((resolve, reject) => {
            // If there is only one argument, unwrap it to allow the user to pass an object for named parameters.
            const p = params.length === 1 ? params[0] : params;
            this.statement.all<T>(p, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    each<T>(param: NamedParams): IteratorController<T, number>;
    each<T>(params: IndexParams): IteratorController<T, number>;
    each<T>(params: unknown): IteratorController<T, number> {
        const itController = new IteratorController<T, number>();

        this.statement.each<T>(
            params,
            (err, row) => {
                if (err) return itController.throw(err);
                itController.next(row);
            },
            (err, count) => {
                if (err) return itController.throw(err);
                itController.return(count);
            }
        );

        return itController;
    }
}
