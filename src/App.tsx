import { useEffect, useState } from "react";
import type { User } from "firebase/auth";
import {
  onAuthStateChanged,
  signOut,
} from "firebase/auth";

import "./App.css";

import { auth } from "./firebase";
import type { Plant, PlantFormValues } from "./types/plant";
import {
  createPlant,
  deleteFertilizedRecord,
  deletePlant,
  deleteWateredRecord,
  importPlants,
  subscribePlants,
  updateFertilizedAt,
  updatePlant,
  updateWateredAt,
} from "./services/plantService";

import BottomTabBar from "./components/BottomTabBar";
import AddEditPlant from "./pages/AddEditPlant";
import Home from "./pages/Home";
import Login from "./pages/Login";
import PlantDetail from "./pages/PlantDetail";
import PlantGuide from "./pages/PlantGuide";
import PlantGuideDetail from "./pages/PlantGuideDetail";
import { plantGuideData } from "./data/plantGuideData";

type PageMode =
  | "home"
  | "add"
  | "edit"
  | "detail"
  | "guide"
  | "guideDetail";

type PlantStoryHistoryState = {
  plantStory: true;
  pageMode: PageMode;
  plantId: string | null;
  guideId: string | null;
};

const GUIDE_STATE_STORAGE_KEY = "plant-story-guide-state";

function getTodayString() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function createHistoryState(
  pageMode: PageMode,
  plantId: string | null = null,
  guideId: string | null = null
): PlantStoryHistoryState {
  return {
    plantStory: true,
    pageMode,
    plantId,
    guideId,
  };
}

function clearPlantGuideState() {
  sessionStorage.removeItem(GUIDE_STATE_STORAGE_KEY);
}

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [plants, setPlants] = useState<Plant[]>([]);
  const [pageMode, setPageMode] = useState<PageMode>("home");
  const [selectedPlantId, setSelectedPlantId] = useState<string | null>(
    null
  );
  const [selectedGuideId, setSelectedGuideId] = useState<string | null>(
    null
  );
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isPlantsLoading, setIsPlantsLoading] = useState(false);

  const selectedPlant =
    plants.find((plant) => plant.id === selectedPlantId) ?? null;

  const selectedGuide =
    plantGuideData.find((plant) => plant.id === selectedGuideId) ?? null;

  useEffect(() => {
    clearPlantGuideState();
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthLoading(false);

      if (!currentUser) {
        clearPlantGuideState();
        setPlants([]);
        setPageMode("home");
        setSelectedPlantId(null);
        setSelectedGuideId(null);

        window.history.replaceState(
          createHistoryState("home"),
          "",
          window.location.href
        );
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;

    setIsPlantsLoading(true);

    const unsubscribe = subscribePlants(
      user.uid,
      (nextPlants) => {
        setPlants(nextPlants);
        setIsPlantsLoading(false);
      },
      () => {
        setIsPlantsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    window.history.replaceState(
      createHistoryState("home"),
      "",
      window.location.href
    );

    const handlePopState = (event: PopStateEvent) => {
      const state = event.state as PlantStoryHistoryState | null;

      if (!state?.plantStory) {
        clearPlantGuideState();
        setPageMode("home");
        setSelectedPlantId(null);
        setSelectedGuideId(null);
        return;
      }

      if (state.pageMode === "home") {
        clearPlantGuideState();
      }

      setPageMode(state.pageMode);
      setSelectedPlantId(state.plantId);
      setSelectedGuideId(state.guideId);
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  const movePage = (
    nextPageMode: PageMode,
    plantId: string | null = null,
    guideId: string | null = null
  ) => {
    setPageMode(nextPageMode);
    setSelectedPlantId(plantId);
    setSelectedGuideId(guideId);

    window.history.pushState(
      createHistoryState(nextPageMode, plantId, guideId),
      "",
      window.location.href
    );
  };

  const replacePage = (
    nextPageMode: PageMode,
    plantId: string | null = null,
    guideId: string | null = null
  ) => {
    setPageMode(nextPageMode);
    setSelectedPlantId(plantId);
    setSelectedGuideId(guideId);

    window.history.replaceState(
      createHistoryState(nextPageMode, plantId, guideId),
      "",
      window.location.href
    );
  };

  const moveToHomeAndResetGuide = () => {
    clearPlantGuideState();
    movePage("home");
  };

  const handleLogout = async () => {
    clearPlantGuideState();
    await signOut(auth);
  };

  const handleSaveNewPlant = async (values: PlantFormValues) => {
    if (!user) return;

    await createPlant(user.uid, values);
    replacePage("home");
  };

  const handleImportPlants = async (importedPlants: Plant[]) => {
    if (!user) {
      return {
        importedCount: 0,
        skippedCount: importedPlants.length,
      };
    }

    return importPlants(user.uid, importedPlants);
  };

  const handleSaveEditPlant = async (values: PlantFormValues) => {
    if (!selectedPlantId) return;

    await updatePlant(selectedPlantId, values);
    replacePage("detail", selectedPlantId);
  };

  const handleDeletePlant = async (plantId: string) => {
    await deletePlant(plantId);
    replacePage("home");
  };

  const handleWaterPlant = async (plant: Plant, date: string) => {
    await updateWateredAt(plant.id, date);
  };

  const handleFertilizePlant = async (
    plant: Plant,
    date: string
  ) => {
    await updateFertilizedAt(plant.id, date);
  };

  const handleQuickWater = async (plant: Plant) => {
    const shouldRecord = window.confirm(
      `${plant.name}에게 오늘 물을 준 것으로 기록할까요?`
    );

    if (!shouldRecord) return;

    await updateWateredAt(plant.id, getTodayString());
  };

  const handleQuickFertilize = async (plant: Plant) => {
    const shouldRecord = window.confirm(
      `${plant.name}에게 오늘 영양제를 준 것으로 기록할까요?`
    );

    if (!shouldRecord) return;

    await updateFertilizedAt(plant.id, getTodayString());
  };

  const handleDeleteWaterRecord = async (
    plant: Plant,
    date: string
  ) => {
    await deleteWateredRecord(plant.id, date);
  };

  const handleDeleteFertilizerRecord = async (
    plant: Plant,
    date: string
  ) => {
    await deleteFertilizedRecord(plant.id, date);
  };

  const renderHome = () => (
    <>
      <Home
        plants={plants}
        loading={isPlantsLoading}
        onLogout={handleLogout}
        onAddPlant={() => movePage("add")}
        onSelectPlant={(plant) => movePage("detail", plant.id)}
        onQuickWater={handleQuickWater}
        onQuickFertilize={handleQuickFertilize}
        onImportPlants={handleImportPlants}
      />

      <BottomTabBar
        activeTab="home"
        onHome={() => replacePage("home")}
        onGuide={() => movePage("guide")}
      />
    </>
  );

  if (isAuthLoading) {
    return <div className="app-loading">불러오는 중...</div>;
  }

  if (!user) {
    return <Login />;
  }

  if (pageMode === "add") {
    return (
      <AddEditPlant
        onSave={handleSaveNewPlant}
        onCancel={() => movePage("home")}
      />
    );
  }

  if (pageMode === "edit") {
    return (
      <AddEditPlant
        plant={selectedPlant}
        onSave={handleSaveEditPlant}
        onCancel={() => {
          if (selectedPlantId) {
            movePage("detail", selectedPlantId);
            return;
          }

          movePage("home");
        }}
      />
    );
  }

  if (pageMode === "detail") {
    if (!selectedPlant) {
      return renderHome();
    }

    return (
      <PlantDetail
        plant={selectedPlant}
        onBack={() => movePage("home")}
        onEdit={(plant) => movePage("edit", plant.id)}
        onDelete={handleDeletePlant}
        onWater={handleWaterPlant}
        onFertilize={handleFertilizePlant}
        onDeleteWaterRecord={handleDeleteWaterRecord}
        onDeleteFertilizerRecord={handleDeleteFertilizerRecord}
      />
    );
  }

  if (pageMode === "guideDetail") {
    if (!selectedGuide) {
      replacePage("guide");
      return null;
    }

    return (
      <PlantGuideDetail
        plant={selectedGuide}
        onBack={() => movePage("guide")}
      />
    );
  }

  if (pageMode === "guide") {
    return (
      <>
        <PlantGuide
          onSelectPlant={(plant) =>
            movePage("guideDetail", null, plant.id)
          }
        />

        <BottomTabBar
          activeTab="guide"
          onHome={moveToHomeAndResetGuide}
          onGuide={() => replacePage("guide")}
        />
      </>
    );
  }

  return renderHome();
}

export default App;