import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  runTransaction,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";

// ── Firebase config ──────────────────────────────────────────────────────────
const firebaseConfig = {
  apiKey: "AIzaSyDdRmE8WDnz_zQK9pl4ie56XBJ3PyzuqBA",
  authDomain: "mongol-naadam.firebaseapp.com",
  projectId: "mongol-naadam",
  storageBucket: "mongol-naadam.firebasestorage.app",
  messagingSenderId: "483381404724",
  appId: "1:483381404724:web:15a8ac472819a0b1ab5661",
};

const app = initializeApp(firebaseConfig);
const db  = getFirestore(app);

// ── Collection refs ──────────────────────────────────────────────────────────
const usersCol  = collection(db, "users");
const horsesCol = collection(db, "horses");
const seqRef    = doc(db, "meta", "sequences");

// ── Helpers ──────────────────────────────────────────────────────────────────

export const MAX_HORSES = 1500;

/**
 * Numbers already handed out on paper (offline registrations) before the
 * app existed / outside the app's control. The atomic counter below skips
 * straight past any of these so the app can never hand them out to
 * someone else online.
 */
export const RESERVED_NUMBERS = new Set([
  35, 49, 123, 111, 9, 2, 7, 5, 88, 1, 77, 17, 22, 99, 55, 11, 33, 44, 14,
  1000, 777, 555, 10, 1111, 222, 888, 333,
]);

/** Get or create the atomic sequence document */
async function ensureSeq() {
  const snap = await getDoc(seqRef);
  if (!snap.exists()) {
    await setDoc(seqRef, { nextHorse: 1 });
  }
}

/**
 * Atomically grab the next horse number, skipping any reserved (paper-
 * registered) numbers, and throwing once we run past MAX_HORSES.
 */
async function getNextHorseNumber() {
  await ensureSeq();
  return await runTransaction(db, async (tx) => {
    const snap = await tx.get(seqRef);
    let next = snap.data().nextHorse;
    while (RESERVED_NUMBERS.has(next)) {
      next++;
    }
    if (next > MAX_HORSES) {
      throw new Error(`Бүртгэл дүүрсэн — ${MAX_HORSES} морины дугаар бүгд олгогдсон байна.`);
    }
    tx.update(seqRef, { nextHorse: next + 1 });
    return next;
  });
}

// ── USER ─────────────────────────────────────────────────────────────────────

/**
 * Find existing user by phone or create new one.
 * Returns user object with Firestore id.
 */
export async function loginOrCreateUser({ surname, givenName, phone }) {
  const q = query(usersCol, where("phone", "==", phone));
  const snap = await getDocs(q);
  if (!snap.empty) {
    const d = snap.docs[0];
    return { id: d.id, ...d.data() };
  }
  const ref = await addDoc(usersCol, {
    surname,
    givenName,
    name: `${surname} ${givenName}`,
    phone,
    createdAt: serverTimestamp(),
  });
  return { id: ref.id, surname, givenName, name: `${surname} ${givenName}`, phone };
}

// ── HORSES ───────────────────────────────────────────────────────────────────

/**
 * Register a horse.
 * Nationwide app is free of charge, so there's no payment step and no
 * admin approval gate — every registration is confirmed instantly.
 * Number assignment matches the Nalaikh app's logic:
 *   - User's FIRST horse ever → new number
 *   - Different age group, user already has a number → reuse that same number
 *   - Same age group again (2nd+ horse in same category) → new number
 * New numbers are handed out atomically and stop once MAX_HORSES (1500)
 * have been assigned.
 *
 * Optional тавиач (starter/handler): if tavichName is provided, the тавиач
 * ALSO gets a number from the SAME shared 1-1500 pool, following the exact
 * same reuse rule as the horse numbering above (tracked separately per
 * owner phone from the horse numbers).
 */
export async function registerHorse(userId, phone, ageGroupId, ageGroupName, formData, tavichName) {
  // All horses this user already has
  const myQ = query(horsesCol, where("ownerPhone", "==", phone));
  const mySnap = await getDocs(myQ);
  const myHorses = mySnap.docs.map(d => ({ id: d.id, ...d.data() }));

  // First number this user ever received
  const myFirstNumber = myHorses.length > 0 ? myHorses[0].number : null;

  // Horses this user already has in THIS specific age group
  const sameAge = myHorses.filter(h => h.ageGroupId === ageGroupId);

  // Reuse only if: user already has a number AND this is their first horse in this age group
  const reuseNumber = myFirstNumber && sameAge.length === 0;
  const number = reuseNumber ? myFirstNumber : await getNextHorseNumber();

  // Тавиач number — same reuse logic, tracked separately from horse numbers
  let tavichNumber = null;
  if (tavichName) {
    const myTavichEntries = myHorses.filter(h => h.tavichNumber);
    const myFirstTavichNumber = myTavichEntries.length > 0 ? myTavichEntries[0].tavichNumber : null;
    const sameAgeTavich = myTavichEntries.filter(h => h.ageGroupId === ageGroupId);
    const reuseTavichNumber = myFirstTavichNumber && sameAgeTavich.length === 0;
    tavichNumber = reuseTavichNumber ? myFirstTavichNumber : await getNextHorseNumber();
  }

  const horse = {
    ...formData,
    number,
    tavichName: tavichName || null,
    tavichNumber,
    needsPayment: false,
    ageGroupId,
    ageGroupName,
    userId,
    ownerPhone: phone,
    paid: true,
    approved: true,
    createdAt: serverTimestamp(),
  };

  const ref = await addDoc(horsesCol, horse);
  return { id: ref.id, ...horse };
}

/**
 * Mark a list of horse IDs as paid.
 */
export async function markHorsesPaid(horseIds) {
  await Promise.all(
    horseIds.map(id =>
      updateDoc(doc(db, "horses", id), { paid: true, paidAt: serverTimestamp() })
    )
  );
}

/**
 * Get all horses for a user.
 */
export async function getMyHorses(phone) {
  const q = query(horsesCol, where("ownerPhone", "==", phone));
  const snap = await getDocs(q);
  const horses = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  return horses.sort((a,b)=>{
    const ta = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
    const tb = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
    return ta - tb;
  });
}

// ── EXPLAINER ────────────────────────────────────────────────────────────────

/**
 * Get all paid horses (for explainer / public results).
 * Optionally filter by ageGroupId or search string.
 */
export async function getPaidHorses({ ageGroupId = null, search = "" } = {}) {
  let q = query(horsesCol, where("paid", "==", true));
  const snap = await getDocs(q);
  let horses = snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a,b)=>(a.number||0)-(b.number||0));

  if (ageGroupId) horses = horses.filter(h => h.ageGroupId === ageGroupId);

  if (search.trim()) {
    const s = search.toLowerCase();
    horses = horses.filter(h =>
      String(h.number).includes(s) ||
      (h.horseName  || "").toLowerCase().includes(s) ||
      (h.uyaachName || "").toLowerCase().includes(s) ||
      (h.riderName  || "").toLowerCase().includes(s) ||
      (h.ownerName  || "").toLowerCase().includes(s)
    );
  }
  return horses;
}

// ── ADMIN ────────────────────────────────────────────────────────────────────

/** Get ALL horses (admin only). */
export async function getAllHorses() {
  const snap = await getDocs(horsesCol);
  const horses = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  return horses.sort((a,b)=>(a.number||0)-(b.number||0));
}

/** Approve a horse registration. */
export async function approveHorse(id) {
  await updateDoc(doc(db, "horses", id), { approved: true });
}

/** Delete a horse registration. */
export async function deleteHorse(id) {
  await deleteDoc(doc(db, "horses", id));
}

/** Get admin stats. */
export async function getAdminStats() {
  const all = await getAllHorses();

  const byAge = {};
  all.forEach(h => {
    if (!byAge[h.ageGroupName]) byAge[h.ageGroupName] = 0;
    byAge[h.ageGroupName]++;
  });

  // Numbers actually issued so far (horse numbers + тавиач numbers share
  // the same atomic pool, and reused numbers don't count again), read
  // straight from the sequence counter rather than counting documents.
  const issued = await getIssuedCount();

  return { total: all.length, remaining: Math.max(0, MAX_HORSES - issued), byAge };
}

/**
 * How many numbers have actually been issued from the shared 1-1500 pool
 * so far (horse numbers + тавиач numbers combined, reused numbers only
 * counted once). Cheaper than getAdminStats() when you just need the count.
 */
export async function getIssuedCount() {
  await ensureSeq();
  const seqSnap = await getDoc(seqRef);
  const nextHorse = seqSnap.data()?.nextHorse || 1;
  return nextHorse - 1;
}

// ── REAL-TIME LISTENER ──────────────────────────────────────────────────────

/**
 * Listen to all horses in real-time.
 * Calls callback(horses[]) whenever data changes.
 * Returns unsubscribe function.
 */
export function listenAllHorses(callback) {
  const { onSnapshot, query, orderBy } = require("firebase/firestore");
  const q = query(horsesCol, orderBy("createdAt", "asc"));
  return onSnapshot(q, (snap) => {
    const horses = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    callback(horses);
  });
}

/**
 * Listen to pending (paid but not approved) horses.
 * Calls callback(count) whenever count changes.
 */
export function listenPendingCount(callback) {
  const { onSnapshot, query, where } = require("firebase/firestore");
  const q = query(horsesCol, where("paid", "==", true), where("approved", "==", false));
  return onSnapshot(q, (snap) => {
    callback(snap.size);
  });
}

// ── REGISTRATION DEADLINE ───────────────────────────────────────────────────

const settingsRef = doc(db, "meta", "settings");

export async function saveDeadline(isoString) {
  await setDoc(settingsRef, { regDeadline: isoString }, { merge: true });
}

export async function getDeadline() {
  const snap = await getDoc(settingsRef);
  return snap.exists() ? snap.data().regDeadline || null : null;
}

export async function clearDeadline() {
  await updateDoc(settingsRef, { regDeadline: null });
}
