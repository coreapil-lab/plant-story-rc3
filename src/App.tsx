import { useEffect, useState } from "react";
import type { User } from "firebase/auth";
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
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
  subscribePlants,
  updateFertilizedAt,
  updatePlant,
  updateWateredAt,
} from "./services/plantService";

import Home from "./pages/Home";
import AddEditPlant from "./pages/AddEditPlant";
import PlantDetail from "./pages/PlantDetail";
import Login from "./pages/Login";

type PageMode = "home" | "add" | "edit" | "detail";

type PlantStoryHistoryState = {
  plantStory: true;
  pageMode: PageMode;
  plantId: string | null;
};

function getTodayString() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function createHistoryState(
  pageMode: PageMode,
  plantId: string | null = null
): PlantStoryHistoryState {
  return {
    plantStory: true,
    pageMode,
    plantId,
  };
}

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [plants, setPlants] = useState<Plant[]>([]);
  const [pageMode, setPageMode] = useState<PageMode>("home");
  const [selectedPlantId, setSelectedPlantId] = useState<string | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isPlantsLoading, setIsPlantsLoading] = useState(false);

  const selectedPlant =
    plants.find((plant) => plant.id === selectedPlantId) ?? null;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthLoading(false);

      if (!currentUser) {
        setPlants([]);
        setPageMode("home");
        setSelectedPlantId(null);

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
        setPageMode("home");
        setSelectedPlantId(null);
        return;
      }

      setPageMode(state.pageMode);
      setSelectedPlantId(state.plantId);
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  const movePage = (nextPageMode: PageMode, plantId: string | null = null) => {
    setPageMode(nextPageMode);
    setSelectedPlantId(plantId);

    window.history.pushState(
      createHistoryState(nextPageMode, plantId),
      "",
      window.location.href
    );
  };

  const replacePage = (
    nextPageMode: PageMode,
    plantId: string | null = null
  ) => {
    setPageMode(nextPageMode);
    setSelectedPlantId(plantId);

    window.history.replaceState(
      createHistoryState(nextPageMode, plantId),
      "",
      window.location.href
    );
  };

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const handleLogout = async () => {
    await signOut(auth);
  };

  const handleAddPlant = () => {
    movePage("add");
  };

  const handleSelectPlant = (plant: Plant) => {
    movePage("detail", plant.id);
  };

  const handleEditPlant = (plant: Plant) => {
    movePage("edit", plant.id);
  };

  const handleBackToHome = () => {
    movePage("home");
  };

  const handleBackToDetail = (plantId: string) => {
    movePage("detail", plantId);
  };

  const handleSaveNewPlant = async (values: PlantFormValues) => {
    if (!user) return;

    await createPlant(user.uid, values);
    replacePage("home");
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

  const handleFertilizePlant = async (plant: Plant, date: string) => {
    await updateFertilizedAt(plant.id, date);
  };

  const handleQuickWater = async (plant: Plant) => {
    if (!window.confirm(`${plant.name}에게 오늘 물을 준 것으로 기록할까요?`)) return;
    await updateWateredAt(plant.id, getTodayString());
  };

  const handleQuickFertilize = async (plant: Plant) => {
    if (!window.confirm(`${plant.name}에게 오늘 영양제를 준 것으로 기록할까요?`)) return;
    await updateFertilizedAt(plant.id, getTodayString());
  };

  const handleDeleteWaterRecord = async (plant: Plant, date: string) => {
    await deleteWateredRecord(plant.id, date);
  };

  const handleDeleteFertilizerRecord = async (plant: Plant, date: string) => {
    await deleteFertilizedRecord(plant.id, date);
  };

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
        onCancel={handleBackToHome}
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
            handleBackToDetail(selectedPlantId);
            return;
          }

          handleBackToHome();
        }}
      />
    );
  }

  if (pageMode === "detail") {
    if (!selectedPlant) {
      return (
        <Home
          plants={plants}
          loading={isPlantsLoading}
          onLogout={handleLogout}
          onAddPlant={handleAddPlant}
          onSelectPlant={handleSelectPlant}
          onQuickWater={handleQuickWater}
          onQuickFertilize={handleQuickFertilize}
        />
      );
    }

    return (
      <PlantDetail
        plant={selectedPlant}
        onBack={handleBackToHome}
        onEdit={handleEditPlant}
        onDelete={handleDeletePlant}
        onWater={handleWaterPlant}
        onFertilize={handleFertilizePlant}
        onDeleteWaterRecord={handleDeleteWaterRecord}
        onDeleteFertilizerRecord={handleDeleteFertilizerRecord}
      />
    );
  }

  return (
    <Home
      plants={plants}
      loading={isPlantsLoading}
      onLogout={handleLogout}
      onAddPlant={handleAddPlant}
      onSelectPlant={handleSelectPlant}
      onQuickWater={handleQuickWater}
      onQuickFertilize={handleQuickFertilize}
    />
  );
}

export default App;