import {
  lazy,
  Suspense,
  useEffect,
  useRef,
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
  exitGuard?: boolean;
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
      식물 정보를 불러오는 중...
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
  const [showExitToast, setShowExitToast] = useState(false);

  const exitReadyRef = useRef(false);
  const exitTimerRef = useRef<number | null>(null);

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
    if (!user || pageMode !== "home") return;

    const currentState = window.history
      .state as PlantStoryHistoryState | null;

    if (
      currentState?.plantStory === true &&
      currentState.pageMode === "home" &&
      currentState.exitGuard === true
    ) {
      return;
    }

    const baseHomeState = createHistoryState("home");
    const guardedHomeState: PlantStoryHistoryState = {
      ...baseHomeState,
      exitGuard: true,
    };

    window.history.replaceState(
      baseHomeState,
      "",
      window.location.href
    );
    window.history.pushState(
      guardedHomeState,
      "",
      window.location.href
    );
  }, [user, pageMode]);

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
    const clearExitTimer = () => {
      if (exitTimerRef.current !== null) {
        window.clearTimeout(exitTimerRef.current);
        exitTimerRef.current = null;
      }
    };

    const resetExitReady = () => {
      clearExitTimer();
      exitReadyRef.current = false;
      setShowExitToast(false);
    };

    const baseHomeState = createHistoryState("home");
    const guardedHomeState: PlantStoryHistoryState = {
      ...baseHomeState,
      exitGuard: true,
    };

    window.history.replaceState(
      baseHomeState,
      "",
      window.location.href
    );
    window.history.pushState(
      guardedHomeState,
      "",
      window.location.href
    );

    const handlePopState = (event: PopStateEvent) => {
      const state = event.state as PlantStoryHistoryState | null;

      const reachedHomeExitBoundary =
        state?.plantStory === true &&
        state.pageMode === "home" &&
        state.exitGuard !== true;

      if (reachedHomeExitBoundary) {
        if (exitReadyRef.current) {
          resetExitReady();
          window.history.back();
          return;
        }

        exitReadyRef.current = true;
        setShowExitToast(true);

        window.history.pushState(
          guardedHomeState,
          "",
          window.location.href
        );

        clearExitTimer();
        exitTimerRef.current = window.setTimeout(() => {
          exitReadyRef.current = false;
          setShowExitToast(false);
          exitTimerRef.current = null;
        }, 2000);

        return;
      }

      resetExitReady();

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
      clearExitTimer();
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

      {showExitToast && (
        <div
          role="status"
          aria-live="polite"
          style={{
            position: "fixed",
            left: "50%",
            bottom: "calc(88px + env(safe-area-inset-bottom))",
            zIndex: 9999,
            width: "max-content",
            maxWidth: "calc(100vw - 32px)",
            padding: "10px 15px",
            borderRadius: "14px",
            background: "rgba(38, 43, 39, 0.82)",
            color: "rgba(255, 255, 255, 0.88)",
            fontSize: "14px",
            fontWeight: 650,
            lineHeight: 1.4,
            textAlign: "center",
            boxShadow: "0 8px 24px rgba(0, 0, 0, 0.18)",
            transform: "translateX(-50%)",
            pointerEvents: "none",
          }}
        >
          한 번 더 뒤로가기를 누르면 앱이 종료됩니다.
        </div>
      )}
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