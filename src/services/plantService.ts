import {
  addDoc,
  collection,
  deleteDoc,
  doc,
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

export function mapPlantDocument(id: string, data: DocumentData): Plant {
  return {
    id,
    userId: normalizeString(data.userId),

    name: normalizeString(data.name),
    nickname: normalizeString(data.nickname),

    adoptedAt: normalizeString(data.adoptedAt),

    lastWateredAt: normalizeString(data.lastWateredAt),
    wateringIntervalDays: normalizeNumber(data.wateringIntervalDays, 7),

    lastFertilizedAt: normalizeString(data.lastFertilizedAt),
    fertilizingIntervalDays: normalizeNumber(data.fertilizingIntervalDays, 30),

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
  const q = query(collection(db, COLLECTION_NAME), where("userId", "==", userId));

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

  await addDoc(collection(db, COLLECTION_NAME), {
    userId,

    name: values.name,
    nickname: values.nickname,

    adoptedAt: values.adoptedAt,

    lastWateredAt: values.lastWateredAt,
    wateringIntervalDays: values.wateringIntervalDays,

    lastFertilizedAt: values.lastFertilizedAt,
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

  await updateDoc(doc(db, COLLECTION_NAME, plantId), {
    name: values.name,
    nickname: values.nickname,

    adoptedAt: values.adoptedAt,

    lastWateredAt: values.lastWateredAt,
    wateringIntervalDays: values.wateringIntervalDays,

    lastFertilizedAt: values.lastFertilizedAt,
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

  await updateDoc(doc(db, COLLECTION_NAME, plantId), {
    lastWateredAt: date,
    updatedAt: now,
    serverUpdatedAt: serverTimestamp(),
  });
}

export async function updateFertilizedAt(
  plantId: string,
  date: string
): Promise<void> {
  const now = new Date().toISOString();

  await updateDoc(doc(db, COLLECTION_NAME, plantId), {
    lastFertilizedAt: date,
    updatedAt: now,
    serverUpdatedAt: serverTimestamp(),
  });
}

export async function deletePlant(plantId: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTION_NAME, plantId));
}