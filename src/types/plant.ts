export type PlantId = string;

export interface Plant {
  id: PlantId;
  userId: string;

  name: string;
  nickname: string;

  imageUrl: string;

  adoptedAt: string;

  lastWateredAt: string;
  wateringIntervalDays: number;

  lastFertilizedAt: string;
  fertilizingIntervalDays: number;

  memo: string;

  createdAt: string;
  updatedAt: string;
}

export interface PlantFormValues {
  name: string;
  nickname: string;

  imageUrl: string;

  adoptedAt: string;

  lastWateredAt: string;
  wateringIntervalDays: number;

  lastFertilizedAt: string;
  fertilizingIntervalDays: number;

  memo: string;
}