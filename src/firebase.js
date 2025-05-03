import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, push, get, child, onValue, remove } from "firebase/database";

// Replace this with your actual Firebase config (include apiKey, authDomain, etc., for full functionality if needed)
const firebaseConfig = {
  databaseURL: "https://cleaning-log-2-default-rtdb.firebaseio.com/"
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// Save or update item
export function saveData(itemId, data) {
  return set(ref(database, "cleaningItems/" + itemId), data);
}

// Add new item
export function addItem(data) {
  const newItemRef = push(ref(database, "cleaningItems"));
  return set(newItemRef, data);
}

// Get a single item by ID
export async function getData(itemId) {
  const dbRef = ref(database);
  const snapshot = await get(child(dbRef, "cleaningItems/" + itemId));
  return snapshot.exists() ? snapshot.val() : null;
}

// Listen for real-time updates to all items
export function subscribeToItems(callback) {
  const itemsRef = ref(database, "cleaningItems");
  return onValue(itemsRef, (snapshot) => {
    const data = snapshot.val() || {};
    callback(data);
  });
}

// Delete an item
export function deleteItem(itemId) {
  return remove(ref(database, "cleaningItems/" + itemId));
}

export { database };
