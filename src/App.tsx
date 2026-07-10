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
  deletePlant,
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
    />
  );
}

export default App;