import { useEffect, useState } from "react";
import type { Plant } from "../types/plant";
import { subscribePlants } from "../services/plantService";

export function usePlants(userId: string | undefined) {
  const [plants, setPlants] = useState<Plant[]>([]);
  const [plantsLoading, setPlantsLoading] = useState(true);
  const [plantsError, setPlantsError] = useState<string>("");

  useEffect(() => {
    if (!userId) {
      setPlants([]);
      setPlantsLoading(false);
      setPlantsError("");
      return;
    }

    setPlantsLoading(true);
    setPlantsError("");

    const unsubscribe = subscribePlants(
      userId,
      (items) => {
        setPlants(items);
        setPlantsLoading(false);
      },
      (error) => {
        setPlants([]);
        setPlantsLoading(false);
        setPlantsError(error.message);
      }
    );

    return () => unsubscribe();
  }, [userId]);

  return {
    plants,
    plantsLoading,
    plantsError,
  };
}