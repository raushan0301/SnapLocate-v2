import axios from 'axios';

const PROJECT_ID = 'snaplocateproject';
const BASE_URL = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

/**
 * Parses nested Firestore value representations.
 */
function parseFirestoreValue(valueObj) {
  if (!valueObj || typeof valueObj !== 'object') return valueObj;
  const type = Object.keys(valueObj)[0];
  if (!type) return null;
  
  const val = valueObj[type];
  switch (type) {
    case 'stringValue':
      return val;
    case 'integerValue':
      return parseInt(val, 10);
    case 'doubleValue':
      return parseFloat(val);
    case 'booleanValue':
      return val;
    case 'nullValue':
      return null;
    case 'arrayValue':
      return (val.values || []).map(v => parseFirestoreValue(v));
    case 'mapValue': {
      const obj = {};
      const fields = val.fields || {};
      for (const k in fields) {
        obj[k] = parseFirestoreValue(fields[k]);
      }
      return obj;
    }
    default:
      return val;
  }
}

/**
 * Normalizes a full Firestore document.
 */
export function parseFirestoreDocument(doc) {
  const fields = doc.fields || {};
  const id = doc.name ? doc.name.split('/').pop() : null;
  const result = { id };
  for (const key in fields) {
    result[key] = parseFirestoreValue(fields[key]);
  }
  return result;
}

/**
 * Fetches and flattens all documents from a Firestore collection, handling pagination.
 */
export async function getFirestoreCollection(collectionName) {
  try {
    let allDocuments = [];
    let nextPageToken = null;

    do {
      const url = nextPageToken
        ? `${BASE_URL}/${collectionName}?pageSize=100&pageToken=${encodeURIComponent(nextPageToken)}`
        : `${BASE_URL}/${collectionName}?pageSize=100`;

      const response = await axios.get(url);
      const documents = response.data.documents || [];
      allDocuments = allDocuments.concat(documents);

      nextPageToken = response.data.nextPageToken || null;
    } while (nextPageToken);

    return allDocuments.map(doc => parseFirestoreDocument(doc));
  } catch (error) {
    console.error(`Error querying Firestore collection "${collectionName}":`, error.message);
    return [];
  }
}
