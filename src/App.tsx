import {
  lazy,
  Suspense,
  useEffect,
  useState,
} from "react";
import type { User } from "firebase/auth";
import {
  onAuthStateChanged,
  signOut,
} from "firebase/auth";

import "./App.css";

import { auth } from "./firebase";
import type { Plant, PlantFormValues } from "./types/plant";
import type { PlantGuide as PlantGuideItem } from "./types/plantGuide";
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

const PlantGuide = lazy(() => import("./pages/PlantGuide"));
const PlantGuideDetail = lazy(
  () => import("./pages/PlantGuideDetail")
);

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

function GuideLoading() {
  return (
    <div className="app-loading">
      ?뙼 ?앸Ъ ?뺣낫瑜?遺덈윭?ㅻ뒗 以?..
    </div>
  );
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
  const [selectedGuide, setSelectedGuide] =
    useState<PlantGuideItem | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isPlantsLoading, setIsPlantsLoading] = useState(false);
  const [isGuideLookupLoading, setIsGuideLookupLoading] =
    useState(false);

  const selectedPlant =
    plants.find((plant) => plant.id === selectedPlantId) ?? null;

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
        setSelectedGuide(null);

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
        setSelectedGuide(null);
        return;
      }

      if (state.pageMode === "home") {
        clearPlantGuideState();
        setSelectedGuide(null);
      }

      setPageMode(state.pageMode);
      setSelectedPlantId(state.plantId);
      setSelectedGuideId(state.guideId);

      if (state.pageMode !== "guideDetail") {
        setSelectedGuide(null);
      }
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  useEffect(() => {
    if (
      pageMode !== "guideDetail" ||
      !selectedGuideId ||
      selectedGuide?.id === selectedGuideId
    ) {
      return;
    }

    let cancelled = false;

    const loadSelectedGuide = async () => {
      setIsGuideLookupLoading(true);

      try {
        const { loadPlantGuideData } = await import(
          "./data/plants"
        );
        const plantGuideData = await loadPlantGuideData();

        if (cancelled) return;

        const foundGuide =
          plantGuideData.find(
            (plant: PlantGuideItem) =>
              plant.id === selectedGuideId
          ) ?? null;

        setSelectedGuide(foundGuide);
      } finally {
        if (!cancelled) {
          setIsGuideLookupLoading(false);
        }
      }
    };

    void loadSelectedGuide();

    return () => {
      cancelled = true;
    };
  }, [pageMode, selectedGuideId, selectedGuide]);

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
    setSelectedGuide(null);
    movePage("home");
  };

  const handleOpenGuideDetail = (plant: PlantGuideItem) => {
    setSelectedGuide(plant);
    movePage("guideDetail", null, plant.id);
  };

  const handleLogout = async () => {
    clearPlantGuideState();
    setSelectedGuide(null);
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
      `${plant.name}?먭쾶 ?ㅻ뒛 臾쇱쓣 以 寃껋쑝濡?湲곕줉?좉퉴??`
    );

    if (!shouldRecord) return;

    await updateWateredAt(plant.id, getTodayString());
  };

  const handleQuickFertilize = async (plant: Plant) => {
    const shouldRecord = window.confirm(
      `${plant.name}?먭쾶 ?ㅻ뒛 ?곸뼇?쒕? 以 寃껋쑝濡?湲곕줉?좉퉴??`
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
    return <div className="app-loading">遺덈윭?ㅻ뒗 以?..</div>;
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
    if (isGuideLookupLoading || !selectedGuide) {
      return <GuideLoading />;
    }

    return (
      <Suspense fallback={<GuideLoading />}>
        <PlantGuideDetail
          plant={selectedGuide}
          onBack={() => movePage("guide")}
        />
      </Suspense>
    );
  }

  if (pageMode === "guide") {
    return (
      <>
        <Suspense fallback={<GuideLoading />}>
          <PlantGuide onSelectPlant={handleOpenGuideDetail} />
        </Suspense>

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
