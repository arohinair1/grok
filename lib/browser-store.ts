export type StoredBooking = {
  id: string;
  listingId: string;
  title: string;
  category: "storage" | "parking";
  startDate: string;
  endDate: string;
  arrivalTime: string;
  departureTime: string;
  amount: number;
  quantityLabel: string;
  assumption: string;
  createdAt: string;
};

export type StoredDraft = {
  id: string;
  createdAt: string;
  category: "storage" | "parking";
  title: string;
  description: string;
  neighborhood: string;
  price: string;
  pricingUnit: string;
  authority: boolean;
};

const BOOKINGS = "csy.bookings.v1";
const FAVORITES = "csy.favorites.v1";
const DRAFTS = "csy.hostDrafts.v1";

const EMPTY_IDS: string[] = [];
const EMPTY_BOOKINGS: StoredBooking[] = [];
const EMPTY_DRAFTS: StoredDraft[] = [];

let favoriteSnapshot = EMPTY_IDS;
let favoritesLoaded = false;
let bookingSnapshot = EMPTY_BOOKINGS;
let bookingsLoaded = false;
let draftSnapshot = EMPTY_DRAFTS;
let draftsLoaded = false;
let serial = 0;

const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

export function subscribeStore(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function emptyFavorites() {
  return EMPTY_IDS;
}

export function emptyBookings() {
  return EMPTY_BOOKINGS;
}

export function emptyDrafts() {
  return EMPTY_DRAFTS;
}

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function readFavorites() {
  if (typeof window === "undefined") return EMPTY_IDS;
  if (!favoritesLoaded) {
    favoritesLoaded = true;
    favoriteSnapshot = readJson<string[]>(FAVORITES, EMPTY_IDS);
  }
  return favoriteSnapshot;
}

export function toggleFavorite(id: string) {
  const current = readFavorites();
  favoriteSnapshot = current.includes(id) ? current.filter((item) => item !== id) : [...current, id];
  window.localStorage.setItem(FAVORITES, JSON.stringify(favoriteSnapshot));
  emit();
  return favoriteSnapshot;
}

export function readBookings() {
  if (typeof window === "undefined") return EMPTY_BOOKINGS;
  if (!bookingsLoaded) {
    bookingsLoaded = true;
    bookingSnapshot = readJson<StoredBooking[]>(BOOKINGS, EMPTY_BOOKINGS);
  }
  return bookingSnapshot;
}

export function saveBooking(booking: StoredBooking) {
  bookingSnapshot = [booking, ...readBookings()].slice(0, 30);
  window.localStorage.setItem(BOOKINGS, JSON.stringify(bookingSnapshot));
  emit();
  return bookingSnapshot;
}

export function readDrafts() {
  if (typeof window === "undefined") return EMPTY_DRAFTS;
  if (!draftsLoaded) {
    draftsLoaded = true;
    draftSnapshot = readJson<StoredDraft[]>(DRAFTS, EMPTY_DRAFTS);
  }
  return draftSnapshot;
}

export function saveDraft(draft: StoredDraft) {
  draftSnapshot = [draft, ...readDrafts()].slice(0, 20);
  window.localStorage.setItem(DRAFTS, JSON.stringify(draftSnapshot));
  emit();
  return draftSnapshot;
}

export function localId(prefix: string) {
  serial += 1;
  return `${prefix}-${serial}`;
}

export function localTimestamp() {
  return new Date().toISOString();
}
