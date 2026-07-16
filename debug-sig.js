import { sha256 } from './src/utils/crypto.ts';

const amount = 200;
const reference = 'FT26197HK0DY';
const code = '063ES-UZ654';

const cleaned = code.replace(/[^A-Z0-9]/gi, '').toUpperCase();
const expiryBase36 = cleaned.substring(0, 5);
const sigBase36 = cleaned.substring(5);

const expiryMinutesSinceEpoch = parseInt(expiryBase36, 36);

console.log('expiryMinutesSinceEpoch:', expiryMinutesSinceEpoch);
console.log('sigBase36:', sigBase36);

const normAmount = Math.round(amount).toString();
const normRef = reference.trim().toUpperCase();

// Let's test different phone formats to see which one results in UZ654
// For example:
// 1. Standard Ethiopian phone numbers start with +251... or 09... or 9... or 2519...
// Let's try some common formats of some phone numbers.
// Wait, we can list some users from the database or the mock_db.json to see what phones are registered!
// Oh, let's check mock_db.json first!
