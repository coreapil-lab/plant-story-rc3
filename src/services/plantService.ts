import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
  type DocumentData,
  type QuerySnapshot,
} from "firebase/firestore";

import { db } from "../firebase";
import type { Plant, PlantFormValues } from "../types/plant";

const COLLECTION_NAME = "plants";

function normalizeString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function normalizeNumber(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value)
    ? value
    : fallback;
}

function normalizeDateHistory(
  value: unknown,
  fallbackDate: string
): string[] {
  const history = Array.isArray(value)
    ? value.filter(
        (item): item is string =>
          typeof item === "string" && item.trim().length > 0
      )
    : [];

  if (fallbackDate) {
    history.push(fallbackDate);
  }

  return [...new Set(history)].sort((a, b) => a.localeCompare(b));
}

function getLatestDate(history: string[], fallbackDate: string): string {
  if (history.length === 0) return fallbackDate;

  return history[history.length - 1];
}

export function mapPlantDocument(id: string, data: DocumentData): Plant {
  const storedLastWateredAt = normalizeString(data.lastWateredAt);
  const storedLastFertilizedAt = normalizeString(data.lastFertilizedAt);

  const wateringHistory = normalizeDateHistory(
    data.wateringHistory,
    storedLastWateredAt
  );
  const fertilizingHistory = normalizeDateHistory(
    data.fertilizingHistory,
    storedLastFertilizedAt
  );

  return {
    id,
    userId: normalizeString(data.userId),

    name: normalizeString(data.name),
    nickname: normalizeString(data.nickname),

    imageUrl: normalizeString(data.imageUrl),

    adoptedAt: normalizeString(data.adoptedAt),

    lastWateredAt: getLatestDate(
      wateringHistory,
      storedLastWateredAt
    ),
    wateringHistory,
    wateringIntervalDays: normalizeNumber(
      data.wateringIntervalDays,
      7
    ),

    lastFertilizedAt: getLatestDate(
      fertilizingHistory,
      storedLastFertilizedAt
    ),
    fertilizingHistory,
    fertilizingIntervalDays: normalizeNumber(
      data.fertilizingIntervalDays,
      30
    ),

    memo: normalizeString(data.memo),

    createdAt: normalizeString(data.createdAt),
    updatedAt: normalizeString(data.updatedAt),
  };
}

export function subscribePlants(
  userId: string,
  onChange: (plants: Plant[]) => void,
  onError: (error: Error) => void
) {
  const q = query(
    collection(db, COLLECTION_NAME),
    where("userId", "==", userId)
  );

  return onSnapshot(
    q,
    (snapshot: QuerySnapshot<DocumentData>) => {
      const plants = snapshot.docs
        .map((item) => mapPlantDocument(item.id, item.data()))
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

      onChange(plants);
    },
    (error) => {
      onError(error);
    }
  );
}

export async function createPlant(
  userId: string,
  values: PlantFormValues
): Promise<void> {
  const now = new Date().toISOString();
  const wateringHistory = values.lastWateredAt
    ? [values.lastWateredAt]
    : [];
  const fertilizingHistory = values.lastFertilizedAt
    ? [values.lastFertilizedAt]
    : [];

  await addDoc(collection(db, COLLECTION_NAME), {
    userId,

    name: values.name,
    nickname: values.nickname,

    imageUrl: values.imageUrl,

    adoptedAt: values.adoptedAt,

    lastWateredAt: values.lastWateredAt,
    wateringHistory,
    wateringIntervalDays: values.wateringIntervalDays,

    lastFertilizedAt: values.lastFertilizedAt,
    fertilizingHistory,
    fertilizingIntervalDays: values.fertilizingIntervalDays,

    memo: values.memo,

    createdAt: now,
    updatedAt: now,

    serverCreatedAt: serverTimestamp(),
    serverUpdatedAt: serverTimestamp(),
  });
}

export async function updatePlant(
  plantId: string,
  values: PlantFormValues
): Promise<void> {
  const now = new Date().toISOString();
  const plantRef = doc(db, COLLECTION_NAME, plantId);
  const snapshot = await getDoc(plantRef);
  const currentData = snapshot.data();

  const currentWateringHistory = normalizeDateHistory(
    currentData?.wateringHistory,
    normalizeString(currentData?.lastWateredAt)
  );
  const currentFertilizingHistory = normalizeDateHistory(
    currentData?.fertilizingHistory,
    normalizeString(currentData?.lastFertilizedAt)
  );

  const wateringHistory = normalizeDateHistory(
    currentWateringHistory,
    values.lastWateredAt
  );
  const fertilizingHistory = normalizeDateHistory(
    currentFertilizingHistory,
    values.lastFertilizedAt
  );

  await updateDoc(plantRef, {
    name: values.name,
    nickname: values.nickname,

    imageUrl: values.imageUrl,

    adoptedAt: values.adoptedAt,

    lastWateredAt: values.lastWateredAt,
    wateringHistory,
    wateringIntervalDays: values.wateringIntervalDays,

    lastFertilizedAt: values.lastFertilizedAt,
    fertilizingHistory,
    fertilizingIntervalDays: values.fertilizingIntervalDays,

    memo: values.memo,

    updatedAt: now,
    serverUpdatedAt: serverTimestamp(),
  });
}

export async function updateWateredAt(
  plantId: string,
  date: string
): Promise<void> {
  const now = new Date().toISOString();
  const plantRef = doc(db, COLLECTION_NAME, plantId);
  const snapshot = await getDoc(plantRef);
  const currentData = snapshot.data();

  const wateringHistory = normalizeDateHistory(
    currentData?.wateringHistory,
    normalizeString(currentData?.lastWateredAt)
  );
  const nextHistory = normalizeDateHistory(wateringHistory, date);
  const latestDate = getLatestDate(nextHistory, date);

  await updateDoc(plantRef, {
    lastWateredAt: latestDate,
    wateringHistory: nextHistory,
    updatedAt: now,
    serverUpdatedAt: serverTimestamp(),
  });
}

export async function updateFertilizedAt(
  plantId: string,
  date: string
): Promise<void> {
  const now = new Date().toISOString();
  const plantRef = doc(db, COLLECTION_NAME, plantId);
  const snapshot = await getDoc(plantRef);
  const currentData = snapshot.data();

  const fertilizingHistory = normalizeDateHistory(
    currentData?.fertilizingHistory,
    normalizeString(currentData?.lastFertilizedAt)
  );
  const nextHistory = normalizeDateHistory(fertilizingHistory, date);
  const latestDate = getLatestDate(nextHistory, date);

  await updateDoc(plantRef, {
    lastFertilizedAt: latestDate,
    fertilizingHistory: nextHistory,
    updatedAt: now,
    serverUpdatedAt: serverTimestamp(),
  });
}

export async function deletePlant(plantId: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTION_NAME, plantId));
}