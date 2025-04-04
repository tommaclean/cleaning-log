import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, get, child } from "firebase/database";

const firebaseConfig = {
  databaseURL: "https://cleaning-log-2-default-rtdb.firebaseio.com/"
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

export function saveData(itemId, data) {
  console.log("firebase.js saveData", data);
  return set(ref(database, "items/" + itemId), data);
}

export async function getData(itemId) {
  const dbRef = ref(database);
  const snapshot = await get(child(dbRef, "items/" + itemId));
  return snapshot.exists() ? snapshot.val() : null;
}

export { database };
