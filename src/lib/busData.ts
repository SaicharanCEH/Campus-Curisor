import { collection, getDocs } from "firebase/firestore";
import { db } from "./firebase";

export async function getBusData() {
  const querySnapshot = await getDocs(collection(db, "buses"));
  return querySnapshot.docs.map(doc => doc.data());
}
