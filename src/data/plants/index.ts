import type { PlantGuide } from "../../types/plantGuide";

export const PLANT_GUIDE_TOTAL_COUNT = 200;

export const PLANT_GUIDE_CATEGORIES = [
  "과실·관엽식물",
  "과실·덩굴식물",
  "과실수",
  "과실식물",
  "관엽식물",
  "구근성 관엽식물",
  "구근식물",
  "꽃 관엽식물",
  "꽃·잎 관엽식물",
  "꽃·향기식물",
  "꽃식물",
  "난초류",
  "다육성 관엽식물",
  "다육성 꽃식물",
  "다육식물",
  "대형 관엽식물",
  "덩굴성 관엽식물",
  "목본성 과실수",
  "목본성 관엽식물",
  "목본식물",
  "브로멜리아드",
  "선인장",
  "소형 관엽식물",
  "식충식물",
  "야자류",
  "양치류형 관엽식물",
  "양치식물",
  "에어플랜트",
  "착생 관엽식물",
  "착생 선인장",
  "채소·허브",
  "침엽 관엽식물",
  "포자식물",
  "행잉 관엽식물",
  "허브",
  "허브·목본",
] as const;

const plantModuleLoaders = [
  () => import("./foliagePlants"),
  () => import("./succulentPlants"),
  () => import("./floweringPlants"),
  () => import("./herbPlants"),
  () => import("./fruitPlants"),
  () => import("./fernPlants"),
  () => import("./specialtyPlants"),
];

let cachedPlants: PlantGuide[] | null = null;
let loadingPromise: Promise<PlantGuide[]> | null = null;

function extractPlants(module: unknown): PlantGuide[] {
  if (!module || typeof module !== "object") return [];

  const plants = Object.values(module).find(Array.isArray);

  return Array.isArray(plants) ? (plants as PlantGuide[]) : [];
}

export async function loadPlantGuideData(): Promise<PlantGuide[]> {
  if (cachedPlants) return cachedPlants;
  if (loadingPromise) return loadingPromise;

  loadingPromise = Promise.all(plantModuleLoaders.map((load) => load()))
    .then((modules) => modules.flatMap(extractPlants))
    .then((plants) => {
      cachedPlants = plants;
      return plants;
    })
    .finally(() => {
      loadingPromise = null;
    });

  return loadingPromise;
}
