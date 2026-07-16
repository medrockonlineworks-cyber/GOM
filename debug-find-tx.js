import { db } from './src/db/index.ts';
import { transactions } from './src/db/schema.ts';
import fs from 'fs';

async function main() {
  console.log('Sleeping for 3 seconds to allow DB probe to finish...');
  await new Promise(resolve => setTimeout(resolve, 3000));
  console.log('Querying database...');
  try {
    const list = await db.select().from(transactions);
    console.log('Total transactions in DB:', list.length);
    console.log('All transactions:');
    console.log(JSON.stringify(list, null, 2));

    const specific = list.find(t => (t.accountNumberOrRef || '').toUpperCase().includes('FT26197'));
    if (specific) {
      console.log('Found matching transaction:', specific);
    } else {
      console.log('No transaction matching FT26197 was found in database.');
    }
  } catch (err) {
    console.error('Error running script:', err);
  }
}

main();
