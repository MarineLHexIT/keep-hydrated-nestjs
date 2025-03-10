import { Inject, Injectable } from '@nestjs/common';
import { D1Database, D1Result } from '@cloudflare/workers-types';

@Injectable()
export class D1Service {
  constructor(@Inject('DB') private readonly db: D1Database) {}

  async query<T = any>(query: string, params: any[] = []): Promise<T[]> {
    const result = await this.db
      .prepare(query)
      .bind(...params)
      .all();
    return result.results as T[];
  }

  async queryOne<T = any>(
    query: string,
    params: any[] = [],
  ): Promise<T | null> {
    const result = await this.db
      .prepare(query)
      .bind(...params)
      .first();
    return result as T | null;
  }

  async execute(query: string, params: any[] = []): Promise<D1Result> {
    return this.db
      .prepare(query)
      .bind(...params)
      .run();
  }
}
