export type PlantGrowthSpeed = "느림" | "보통" | "빠름";

export type PlantGuide = {
  id: string;
  name: string;
  aliases: string[];
  scientificName: string;
  emoji: string;
  category: string;

  difficulty: number;
  growthSpeed: PlantGrowthSpeed;

  temperature: string;
  humidity: string;
  light: string;
  recommendedLocation: string;
  nativeHabitat: string;

  watering: string;
  ventilation: string;
  soil: string;
  caution: string;
};