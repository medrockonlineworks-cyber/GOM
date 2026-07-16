import { drizzle } from 'drizzle-orm/node-postgres';
import pkg from 'pg';
import * as schema from './schema.ts';
import fs from 'fs';
import path from 'path';
import { eq as realEq, desc as realDesc, and as realAnd } from 'drizzle-orm';

const { Pool } = pkg;

// Function to create a new connection pool.
export const createPool = () => {
  return new Pool({
    host: process.env.SQL_HOST,
    user: process.env.SQL_USER,
    password: process.env.SQL_PASSWORD,
    database: process.env.SQL_DB_NAME,
    connectionTimeoutMillis: 15000,
  });
};

const isDatabaseDisabled = process.env.DISABLE_DATABASE === 'true' || !process.env.SQL_HOST;

export const eq = isDatabaseDisabled
  ? (column: any, value: any) => {
      const colName = column?.name || (column?.metadata?.name) || (column?._?.name) || (typeof column === 'string' ? column : '');
      return { type: 'eq', column: colName, value };
    }
  : realEq;

export const and = isDatabaseDisabled
  ? (...conditions: any[]) => ({ type: 'and', conditions })
  : realAnd;

export const desc = isDatabaseDisabled
  ? (column: any) => {
      const colName = column?.name || (column?.metadata?.name) || (column?._?.name) || (typeof column === 'string' ? column : '');
      return { type: 'desc', column: colName };
    }
  : realDesc;

class MockDrizzle {
  private data: Record<string, any[]> = {
    users: [],
    transactions: [],
    announcements: [],
    support_messages: [],
    audit_logs: [],
    recharge_accounts: [],
    system_config: []
  };
  private filePath = path.join(process.cwd(), 'mock_db.json');

  constructor() {
    this.load();
  }

  private load() {
    try {
      if (fs.existsSync(this.filePath)) {
        const fileContent = fs.readFileSync(this.filePath, 'utf8');
        this.data = JSON.parse(fileContent);
        console.log('[MockDB] Loaded existing data from mock_db.json');
      } else {
        console.log('[MockDB] No mock_db.json found, starting with empty tables');
      }
    } catch (e: any) {
      console.warn('[MockDB] Failed to load mock database:', e.message);
    }
  }

  private save() {
    try {
      fs.writeFileSync(this.filePath, JSON.stringify(this.data, null, 2), 'utf8');
    } catch (e: any) {
      console.warn('[MockDB] Failed to save mock database:', e.message);
    }
  }

  select() {
    return {
      from: (table: any) => {
        const tableName = table.tableName || (table && table._?.name) || 'unknown';
        let results = [...(this.data[tableName] || [])];

        const builder = {
          where: (condition: any) => {
            if (condition) {
              results = results.filter(item => this.matchesCondition(item, condition));
            }
            return builder;
          },
          orderBy: (order: any) => {
            if (order && order.column) {
              const col = order.column;
              const isDesc = true; 
              results.sort((a, b) => {
                const valA = a[col];
                const valB = b[col];
                
                if (valA === undefined || valA === null) return isDesc ? 1 : -1;
                if (valB === undefined || valB === null) return isDesc ? -1 : 1;

                const timeA = valA instanceof Date ? valA.getTime() : (typeof valA === 'string' && !isNaN(Date.parse(valA)) ? Date.parse(valA) : valA);
                const timeB = valB instanceof Date ? valB.getTime() : (typeof valB === 'string' && !isNaN(Date.parse(valB)) ? Date.parse(valB) : valB);

                if (timeA < timeB) return isDesc ? 1 : -1;
                if (timeA > timeB) return isDesc ? -1 : 1;
                return 0;
              });
            }
            return builder;
          },
          then: (onfulfilled: any) => {
            return Promise.resolve(results).then(onfulfilled);
          }
        };
        return builder;
      }
    };
  }

  private matchesCondition(item: any, cond: any): boolean {
    if (!cond) return true;
    if (typeof cond === 'function') {
      return cond(item);
    }
    if (cond.type === 'eq') {
      const colVal = item[cond.column];
      const checkVal = cond.value;
      if (colVal instanceof Date && checkVal instanceof Date) {
        return colVal.getTime() === checkVal.getTime();
      }
      return colVal === checkVal;
    }
    if (cond.type === 'and') {
      return cond.conditions.every((c: any) => this.matchesCondition(item, c));
    }
    return true;
  }

  insert(table: any) {
    const tableName = table.tableName || (table && table._?.name) || 'unknown';
    return {
      values: (data: any) => {
        const records = Array.isArray(data) ? data : [data];
        if (!this.data[tableName]) {
          this.data[tableName] = [];
        }
        for (const record of records) {
          const cloned = JSON.parse(JSON.stringify(record));
          this.data[tableName].push(cloned);
        }
        this.save();
        return {
          then: (onfulfilled: any) => {
            return Promise.resolve(records).then(onfulfilled);
          }
        };
      }
    };
  }

  update(table: any) {
    const tableName = table.tableName || (table && table._?.name) || 'unknown';
    return {
      set: (data: any) => {
        return {
          where: (condition: any) => {
            let updatedCount = 0;
            if (this.data[tableName]) {
              this.data[tableName] = this.data[tableName].map(item => {
                if (this.matchesCondition(item, condition)) {
                  updatedCount++;
                  return { ...item, ...data };
                }
                return item;
              });
            }
            this.save();
            return {
              then: (onfulfilled: any) => {
                return Promise.resolve({ rowsAffected: updatedCount }).then(onfulfilled);
              }
            };
          }
        };
      }
    };
  }

  delete(table: any) {
    const tableName = table.tableName || (table && table._?.name) || 'unknown';
    return {
      where: (condition: any) => {
        let deletedCount = 0;
        if (this.data[tableName]) {
          this.data[tableName] = this.data[tableName].filter(item => {
            if (this.matchesCondition(item, condition)) {
              deletedCount++;
              return false;
            }
            return true;
          });
        }
        this.save();
        return {
          then: (onfulfilled: any) => {
            return Promise.resolve({ rowsAffected: deletedCount }).then(onfulfilled);
          }
        };
      }
    };
  }
}

let activeDb: any = null;
const mockDb = new MockDrizzle();

if (isDatabaseDisabled) {
  console.log('[DB] Database is explicitly disabled or SQL_HOST is missing. Using Mock local JSON database.');
  activeDb = mockDb;
} else {
  try {
    const pool = createPool();
    pool.on('error', (err) => {
      console.error('Unexpected error on idle SQL pool client:', err);
    });
    activeDb = drizzle(pool, { schema });
    console.log('[DB] Connected to PostgreSQL database via Drizzle.');
  } catch (e: any) {
    console.warn('[DB] Failed to initialize PostgreSQL pool. Falling back to Mock local JSON database:', e.message);
    activeDb = mockDb;
  }
}

// Export a proxy that routes all calls to the active db dynamically.
export const db = new Proxy({}, {
  get(target, prop, receiver) {
    const originalValue = Reflect.get(activeDb, prop, receiver);
    if (typeof originalValue === 'function') {
      return function (...args: any[]) {
        try {
          return originalValue.apply(activeDb, args);
        } catch (err: any) {
          console.warn(`[DB Proxy] Error executing database operation "${String(prop)}".`, err.message);
          if (activeDb !== mockDb) {
            console.warn('[DB Proxy] Dynamically switching to Mock local JSON database for resilience.');
            activeDb = mockDb;
            const fallbackFunc = Reflect.get(mockDb, prop);
            return fallbackFunc.apply(mockDb, args);
          }
          throw err;
        }
      };
    }
    return originalValue;
  }
}) as any;
