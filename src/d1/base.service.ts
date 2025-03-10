import { Injectable } from '@nestjs/common';
import { D1Service } from './d1.service';

@Injectable()
export abstract class BaseD1Service {
  protected abstract tableName: string;
  protected abstract primaryKey: string;

  constructor(protected readonly d1Service: D1Service) {}

  protected async findAll<T extends Record<string, unknown>>(
    conditions: Partial<T> = {},
  ): Promise<T[]> {
    const entries = Object.entries(conditions);
    if (entries.length === 0) {
      return this.d1Service.query<T>(`SELECT * FROM ${this.tableName}`);
    }

    const whereClause = entries.map(([key]) => `${key} = ?`).join(' AND ');
    const values = entries.map(([, value]) => value);

    return this.d1Service.query<T>(
      `SELECT * FROM ${this.tableName} WHERE ${whereClause}`,
      values,
    );
  }

  protected async findOne<T extends Record<string, unknown>>(
    conditions: Partial<T>,
  ): Promise<T | null> {
    const entries = Object.entries(conditions);
    const whereClause = entries.map(([key]) => `${key} = ?`).join(' AND ');
    const values = entries.map(([, value]) => value);

    return this.d1Service.queryOne<T>(
      `SELECT * FROM ${this.tableName} WHERE ${whereClause}`,
      values,
    );
  }

  protected async create<T extends Record<string, unknown>>(
    data: T,
  ): Promise<T> {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const placeholders = values.map(() => '?').join(', ');

    await this.d1Service.execute(
      `INSERT INTO ${this.tableName} (${keys.join(', ')}) VALUES (${placeholders})`,
      values,
    );

    return data;
  }

  protected async update<T extends Record<string, unknown>>(
    id: string,
    data: Partial<T>,
  ): Promise<void> {
    const entries = Object.entries(data);
    const setClause = entries.map(([key]) => `${key} = ?`).join(', ');
    const values = entries.map(([, value]) => value) as unknown[];

    await this.d1Service.execute(
      `UPDATE ${this.tableName} SET ${setClause} WHERE ${this.primaryKey} = ?`,
      [...values, id],
    );
  }

  protected async delete(id: string): Promise<void> {
    await this.d1Service.execute(
      `DELETE FROM ${this.tableName} WHERE ${this.primaryKey} = ?`,
      [id],
    );
  }
}
