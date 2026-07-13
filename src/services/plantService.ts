import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
  type DocumentData,
  type QuerySnapshot,
} from "firebase/firestore";

import { db } from "../firebase";
import type {
  Plant,
  PlantFormValues,
  PlantImportResult,
} from "../types/plant";

const COLLECTION_NAME = "plants";
const MAX_BATCH_SIZE = 450;

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

function getLatestDate(history: string[]): string {
  if (history.length === 0) return "";
  return history[history.length - 1];
}

function createDuplicateKey(plant: {
  name: string;
  nickname: string;
  adoptedAt: string;
}): string {
  return [
    plant.name.trim().toLowerCase(),
    plant.nickname.trim().toLowerCase(),
    plant.adoptedAt,
  ].join("|");
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

    lastWateredAt: getLatestDate(wateringHistory),
    wateringHistory,
    wateringIntervalDays: normalizeNumber(
      data.wateringIntervalDays,
      7
    ),

    lastFertilizedAt: getLatestDate(fertilizingHistory),
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
  const plantsQuery = query(
    collection(db, COLLECTION_NAME),
    where("userId", "==", userId)
  );

  return onSnapshot(
    plantsQuery,
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

export async function importPlants(
  userId: string,
  importedPlants: Plant[]
): Promise<PlantImportResult> {
  const plantsQuery = query(
    collection(db, COLLECTION_NAME),
    where("userId", "==", userId)
  );
  const currentSnapshot = await getDocs(plantsQuery);
  const duplicateKeys = new Set(
    currentSnapshot.docs.map((item) => {
      const plant = mapPlantDocument(item.id, item.data());
      return createDuplicateKey(plant);
    })
  );

  const plantsToImport: Plant[] = [];
  let skippedCount = 0;

  for (const plant of importedPlants) {
    const duplicateKey = createDuplicateKey(plant);

    if (duplicateKeys.has(duplicateKey)) {
      skippedCount += 1;
      continue;
    }

    duplicateKeys.add(duplicateKey);
    plantsToImport.push(plant);
  }

  for (
    let startIndex = 0;
    startIndex < plantsToImport.length;
    startIndex += MAX_BATCH_SIZE
  ) {
    const batch = writeBatch(db);
    const batchPlants = plantsToImport.slice(
      startIndex,
      startIndex + MAX_BATCH_SIZE
    );

    batchPlants.forEach((plant) => {
      const plantRef = doc(collection(db, COLLECTION_NAME));
      const wateringHistory = normalizeDateHistory(
        plant.wateringHistory,
        plant.lastWateredAt
      );
      const fertilizingHistory = normalizeDateHistory(
        plant.fertilizingHistory,
        plant.lastFertilizedAt
      );
      const now = new Date().toISOString();

      batch.set(plantRef, {
        userId,

        name: plant.name.trim(),
        nickname: plant.nickname.trim(),

        imageUrl: plant.imageUrl,

        adoptedAt: plant.adoptedAt,

        lastWateredAt: getLatestDate(wateringHistory),
        wateringHistory,
        wateringIntervalDays: plant.wateringIntervalDays,

        lastFertilizedAt: getLatestDate(fertilizingHistory),
        fertilizingHistory,
        fertilizingIntervalDays: plant.fertilizingIntervalDays,

        memo: plant.memo,

        createdAt: plant.createdAt || now,
        updatedAt: now,

        serverCreatedAt: serverTimestamp(),
        serverUpdatedAt: serverTimestamp(),
      });
    });

    await batch.commit();
  }

  return {
    importedCount: plantsToImport.length,
    skippedCount,
  };
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
  const latestDate = getLatestDate(nextHistory);

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
  const latestDate = getLatestDate(nextHistory);

  await updateDoc(plantRef, {
    lastFertilizedAt: latestDate,
    fertilizingHistory: nextHistory,
    updatedAt: now,
    serverUpdatedAt: serverTimestamp(),
  });
}

export async function deleteWateredRecord(
  plantId: string,
  date: string
): Promise<void> {
  const now = new Date().toISOString();
  const plantRef = doc(db, COLLECTION_NAME, plantId);
  const snapshot = await getDoc(plantRef);
  const currentData = snapshot.data();
  const currentHistory = normalizeDateHistory(
    currentData?.wateringHistory,
    normalizeString(currentData?.lastWateredAt)
  );
  const nextHistory = currentHistory.filter((item) => item !== date);

  await updateDoc(plantRef, {
    lastWateredAt: getLatestDate(nextHistory),
    wateringHistory: nextHistory,
    updatedAt: now,
    serverUpdatedAt: serverTimestamp(),
  });
}

export async function deleteFertilizedRecord(
  plantId: string,
  date: string
): Promise<void> {
  const now = new Date().toISOString();
  const plantRef = doc(db, COLLECTION_NAME, plantId);
  const snapshot = await getDoc(plantRef);
  const currentData = snapshot.data();
  const currentHistory = normalizeDateHistory(
    currentData?.fertilizingHistory,
    normalizeString(currentData?.lastFertilizedAt)
  );
  const nextHistory = currentHistory.filter((item) => item !== date);

  await updateDoc(plantRef, {
    lastFertilizedAt: getLatestDate(nextHistory),
    fertilizingHistory: nextHistory,
    updatedAt: now,
    serverUpdatedAt: serverTimestamp(),
  });
}

export async function deletePlant(plantId: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTION_NAME, plantId));
}