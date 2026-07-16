import { drizzle } from 'drizzle-orm/node-postgres';
import pkg from 'pg';
import * as schema from './schema.ts';
import fs from 'fs';
import path from 'path';

export { eq, desc, and } from 'drizzle-orm';

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

// Helper: Convert snake_case to camelCase
function toCamelCase(str: string): string {
  return str.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
}

// Parser: Extract columns and values from Drizzle condition object
function parseCondition(cond: any): { column: string; value: any }[] | null {
  if (!cond) return null;
  const eqPairs: { column: string; value: any }[] = [];
  
  function walk(chunks: any[]) {
    for (let i = 0; i < chunks.length; i++) {
      const c = chunks[i];
      if (!c) continue;
      if (c.queryChunks) {
        walk(c.queryChunks);
      } else if (c.table && c.name) {
        // Found a column! Let's find the next Param in the list
        for (let j = i + 1; j < Math.min(i + 5, chunks.length); j++) {
          const nextC = chunks[j];
          if (nextC && nextC.value !== undefined && !Array.isArray(nextC.value)) {
            eqPairs.push({ column: c.name, value: nextC.value });
            break;
          }
        }
      }
    }
  }
  
  if (cond.queryChunks) {
    walk(cond.queryChunks);
  }
  
  return eqPairs;
}

// Parser: Extract column and direction from Drizzle orderBy object
function parseOrderBy(order: any): { column: string; direction: 'asc' | 'desc' } | null {
  if (!order || !order.queryChunks) return null;
  
  let colName = '';
  let direction: 'asc' | 'desc' = 'asc';
  
  for (const c of order.queryChunks) {
    if (c && c.table && c.name) {
      colName = c.name;
    } else if (c && c.value && Array.isArray(c.value) && c.value.some((v: string) => v.includes('desc'))) {
      direction = 'desc';
    }
  }
  
  if (colName) {
    return { column: colName, direction };
  }
  return null;
}

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

  private matchesCondition(item: any, cond: any): boolean {
    const pairs = parseCondition(cond);
    if (!pairs || pairs.length === 0) return true;
    return pairs.every((p: any) => {
      const camelKey = toCamelCase(p.column);
      const itemVal = item[camelKey] !== undefined ? item[camelKey] : item[p.column];
      return String(itemVal) === String(p.value);
    });
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
            const parsedOrder = parseOrderBy(order);
            if (parsedOrder) {
              const { column, direction } = parsedOrder;
              const propName = toCamelCase(column);
              results.sort((a, b) => {
                const valA = a[propName];
                const valB = b[propName];
                if (valA === undefined || valA === null) return direction === 'desc' ? 1 : -1;
                if (valB === undefined || valB === null) return direction === 'desc' ? -1 : 1;
                
                // Compare Dates
                const isDateA = !isNaN(Date.parse(valA)) && typeof valA === 'string' && valA.includes('-');
                const isDateB = !isNaN(Date.parse(valB)) && typeof valB === 'string' && valB.includes('-');
                if (isDateA && isDateB) {
                  const timeA = new Date(valA).getTime();
                  const timeB = new Date(valB).getTime();
                  return direction === 'desc' ? timeB - timeA : timeA - timeB;
                }
                
                if (valA < valB) return direction === 'desc' ? 1 : -1;
                if (valA > valB) return direction === 'desc' ? -1 : 1;
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
        const builder = {
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
            return builder;
          },
          then: (onfulfilled: any) => {
            return Promise.resolve({ rowsAffected: 1 }).then(onfulfilled);
          }
        };
        return builder;
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

const mockDb = new MockDrizzle();
let activeDb: any = mockDb;

async function probePostgres() {
  if (!process.env.SQL_HOST) {
    console.log('[DB] No SQL_HOST configured. Using local Mock JSON database.');
    return;
  }
  try {
    const pool = createPool();
    pool.on('error', (err) => {
      console.error('[DB] Unexpected error on idle SQL pool client:', err);
    });
    const realDb = drizzle(pool, { schema });
    
    // Quick test query with a 4-second timeout to check availability
    await Promise.race([
      realDb.select().from(schema.systemConfig).limit(1),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Postgres connection timeout')), 4000))
    ]);
    
    console.log('[DB] Successfully connected to PostgreSQL database. Active database set to PG.');
    activeDb = realDb;
  } catch (err: any) {
    console.warn('[DB] PostgreSQL probe failed. Falling back to local Mock JSON database:', err.message);
    activeDb = mockDb;
  }
}

probePostgres();

// Export a proxy that routes all calls to the active db dynamically
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
