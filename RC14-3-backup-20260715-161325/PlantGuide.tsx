import {
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  loadPlantGuideData,
  PLANT_GUIDE_TOTAL_COUNT,
} from "../data/plants";
import type { PlantGuide as PlantGuideItem } from "../types/plantGuide";
import "./PlantGuide.css";

type PlantGuideProps = {
  onSelectPlant: (plant: PlantGuideItem) => void;
};

type LightFilter =
  | "전체"
  | "음지"
  | "반음지"
  | "반양지"
  | "양지";

type SortOption =
  | "전체"
  | "쉬움"
  | "어려움"
  | "이름"
  | "성장";

type MajorCategory =
  | "전체"
  | "관엽"
  | "꽃"
  | "다육"
  | "허브"
  | "양치"
  | "기타";

type SavedGuideState = {
  searchText: string;
  selectedCategory: MajorCategory;
  selectedLight: LightFilter;
  sortOption: SortOption;
  visibleCount: number;
  scrollY: number;
};

const PAGE_SIZE = 20;
const STORAGE_KEY = "plant-story-guide-state";

const LIGHT_FILTERS: LightFilter[] = [
  "전체",
  "음지",
  "반음지",
  "반양지",
  "양지",
];

const SORT_OPTIONS: SortOption[] = [
  "전체",
  "쉬움",
  "어려움",
  "이름",
  "성장",
];

const MAJOR_CATEGORIES: MajorCategory[] = [
  "전체",
  "관엽",
  "꽃",
  "다육",
  "허브",
  "양치",
  "기타",
];

const GROWTH_SPEED_ORDER: Record<
  PlantGuideItem["growthSpeed"],
  number
> = {
  빠름: 0,
  보통: 1,
  느림: 2,
};

const DEFAULT_STATE: SavedGuideState = {
  searchText: "",
  selectedCategory: "전체",
  selectedLight: "전체",
  sortOption: "전체",
  visibleCount: PAGE_SIZE,
  scrollY: 0,
};

function loadSavedState(): SavedGuideState {
  try {
    const savedValue = sessionStorage.getItem(STORAGE_KEY);

    if (!savedValue) return DEFAULT_STATE;

    const parsed = JSON.parse(savedValue) as Partial<SavedGuideState>;

    return {
      searchText:
        typeof parsed.searchText === "string"
          ? parsed.searchText
          : DEFAULT_STATE.searchText,
      selectedCategory:
        parsed.selectedCategory &&
        MAJOR_CATEGORIES.includes(parsed.selectedCategory)
          ? parsed.selectedCategory
          : DEFAULT_STATE.selectedCategory,
      selectedLight:
        parsed.selectedLight &&
        LIGHT_FILTERS.includes(parsed.selectedLight)
          ? parsed.selectedLight
          : DEFAULT_STATE.selectedLight,
      sortOption:
        parsed.sortOption &&
        SORT_OPTIONS.includes(parsed.sortOption)
          ? parsed.sortOption
          : DEFAULT_STATE.sortOption,
      visibleCount:
        typeof parsed.visibleCount === "number" &&
        parsed.visibleCount >= PAGE_SIZE
          ? parsed.visibleCount
          : DEFAULT_STATE.visibleCount,
      scrollY:
        typeof parsed.scrollY === "number" && parsed.scrollY >= 0
          ? parsed.scrollY
          : DEFAULT_STATE.scrollY,
    };
  } catch {
    return DEFAULT_STATE;
  }
}

function createSearchText(plant: PlantGuideItem) {
  return [
    plant.name,
    ...plant.aliases,
    plant.scientificName,
    plant.category,
    plant.light,
    plant.recommendedLocation,
    plant.nativeHabitat,
  ]
    .join(" ")
    .toLowerCase();
}

function matchesLightFilter(
  plant: PlantGuideItem,
  lightFilter: LightFilter
) {
  if (lightFilter === "전체") return true;

  return plant.light.includes(lightFilter);
}

function getMajorCategory(
  category: string
): Exclude<MajorCategory, "전체"> {
  if (category.includes("허브")) {
    return "허브";
  }

  if (
    category.includes("양치") ||
    category.includes("고사리") ||
    category.includes("펀")
  ) {
    return "양치";
  }

  if (
    category.includes("다육") ||
    category.includes("선인장")
  ) {
    return "다육";
  }

  if (
    category.includes("꽃") ||
    category.includes("난초")
  ) {
    return "꽃";
  }

  if (
    category.includes("관엽") ||
    category.includes("야자") ||
    category.includes("덩굴") ||
    category.includes("목본") ||
    category.includes("행잉") ||
    category.includes("소형") ||
    category.includes("대형")
  ) {
    return "관엽";
  }

  return "기타";
}

function matchesMajorCategory(
  plant: PlantGuideItem,
  selectedCategory: MajorCategory
) {
  if (selectedCategory === "전체") {
    return true;
  }

  return getMajorCategory(plant.category) === selectedCategory;
}

function sortPlants(
  plants: PlantGuideItem[],
  sortOption: SortOption
) {
  const nextPlants = [...plants];

  if (sortOption === "쉬움") {
    return nextPlants.sort(
      (a, b) =>
        a.difficulty - b.difficulty ||
        a.name.localeCompare(b.name, "ko")
    );
  }

  if (sortOption === "어려움") {
    return nextPlants.sort(
      (a, b) =>
        b.difficulty - a.difficulty ||
        a.name.localeCompare(b.name, "ko")
    );
  }

  if (sortOption === "이름") {
    return nextPlants.sort((a, b) =>
      a.name.localeCompare(b.name, "ko")
    );
  }

  if (sortOption === "성장") {
    return nextPlants.sort(
      (a, b) =>
        GROWTH_SPEED_ORDER[a.growthSpeed] -
          GROWTH_SPEED_ORDER[b.growthSpeed] ||
        a.difficulty - b.difficulty ||
        a.name.localeCompare(b.name, "ko")
    );
  }

  return nextPlants;
}

function PlantGuide({ onSelectPlant }: PlantGuideProps) {
  const savedState = useMemo(loadSavedState, []);

  const [plantGuideData, setPlantGuideData] = useState<
    PlantGuideItem[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [searchText, setSearchText] = useState(
    savedState.searchText
  );
  const [selectedCategory, setSelectedCategory] =
    useState<MajorCategory>(savedState.selectedCategory);
  const [selectedLight, setSelectedLight] =
    useState<LightFilter>(savedState.selectedLight);
  const [sortOption, setSortOption] =
    useState<SortOption>(savedState.sortOption);
  const [visibleCount, setVisibleCount] = useState(
    savedState.visibleCount
  );

  useEffect(() => {
    let isMounted = true;

    setIsLoading(true);
    setLoadError("");

    loadPlantGuideData()
      .then((plants) => {
        if (!isMounted) return;

        setPlantGuideData(plants);
      })
      .catch(() => {
        if (!isMounted) return;

        setLoadError(
          "식물정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요."
        );
      })
      .finally(() => {
        if (!isMounted) return;

        setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredPlants = useMemo(() => {
    const keyword = searchText.trim().toLowerCase();

    const matches = plantGuideData.filter((plant) => {
      const matchesKeyword =
        !keyword || createSearchText(plant).includes(keyword);

      const matchesCategory = matchesMajorCategory(
        plant,
        selectedCategory
      );

      const matchesLight = matchesLightFilter(
        plant,
        selectedLight
      );

      return matchesKeyword && matchesCategory && matchesLight;
    });

    return sortPlants(matches, sortOption);
  }, [
    searchText,
    selectedCategory,
    selectedLight,
    sortOption,
    plantGuideData,
  ]);

  const visiblePlants = filteredPlants.slice(0, visibleCount);
  const hasMore = visibleCount < filteredPlants.length;

  useEffect(() => {
    const nextState: SavedGuideState = {
      searchText,
      selectedCategory,
      selectedLight,
      sortOption,
      visibleCount,
      scrollY: window.scrollY,
    };

    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(nextState)
    );
  }, [
    searchText,
    selectedCategory,
    selectedLight,
    sortOption,
    visibleCount,
  ]);

  useEffect(() => {
    const handleScroll = () => {
      const nextState: SavedGuideState = {
        searchText,
        selectedCategory,
        selectedLight,
        sortOption,
        visibleCount,
        scrollY: window.scrollY,
      };

      sessionStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(nextState)
      );
    };

    window.addEventListener("scroll", handleScroll, {
      passive: true,
    });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [
    searchText,
    selectedCategory,
    selectedLight,
    sortOption,
    visibleCount,
  ]);

  useEffect(() => {
    window.requestAnimationFrame(() => {
      window.scrollTo({
        top: savedState.scrollY,
        behavior: "auto",
      });
    });
  }, [savedState.scrollY]);

  const resetFilters = () => {
    setSearchText("");
    setSelectedCategory("전체");
    setSelectedLight("전체");
    setSortOption("전체");
    setVisibleCount(PAGE_SIZE);

    sessionStorage.removeItem(STORAGE_KEY);
    window.scrollTo({ top: 0, behavior: "auto" });
  };

  const hasActiveFilter =
    selectedCategory !== "전체" ||
    selectedLight !== "전체" ||
    sortOption !== "전체" ||
    Boolean(searchText.trim());

  return (
    <div className="plant-guide-page">
      <header className="plant-guide-header">
        <div>
          <h1>식물정보</h1>
          <p>
            실내에서 자주 키우는 식물 {PLANT_GUIDE_TOTAL_COUNT}종
          </p>
        </div>
      </header>

      <div className="plant-guide-search">
        <span aria-hidden="true">🔍</span>
        <input
          value={searchText}
          onChange={(event) => {
            setSearchText(event.target.value);
            setVisibleCount(PAGE_SIZE);
          }}
          placeholder="식물명, 학명, 반양지 등으로 검색"
          aria-label="식물정보 검색"
        />
      </div>

      <section className="plant-guide-filter-section">
        <strong className="plant-guide-filter-title">정렬</strong>

        <div
          className="plant-guide-filter-scroll"
          role="group"
          aria-label="식물 정렬"
        >
          {SORT_OPTIONS.map((option) => (
            <button
              key={option}
              type="button"
              className={
                sortOption === option
                  ? "plant-guide-filter-button plant-guide-filter-button-active"
                  : "plant-guide-filter-button"
              }
              onClick={() => {
                setSortOption(option);
                setVisibleCount(PAGE_SIZE);
              }}
            >
              {option}
            </button>
          ))}
        </div>
      </section>

      <section className="plant-guide-filter-section">
        <strong className="plant-guide-filter-title">식물 분류</strong>

        <div
          className="plant-guide-filter-scroll"
          role="group"
          aria-label="식물 분류 필터"
        >
          {MAJOR_CATEGORIES.map((category) => (
            <button
              key={category}
              type="button"
              className={
                selectedCategory === category
                  ? "plant-guide-filter-button plant-guide-filter-button-active"
                  : "plant-guide-filter-button"
              }
              onClick={() => {
                setSelectedCategory(category);
                setVisibleCount(PAGE_SIZE);
              }}
            >
              {category}
            </button>
          ))}
        </div>
      </section>

      <section className="plant-guide-filter-section">
        <strong className="plant-guide-filter-title">빛 환경</strong>

        <div
          className="plant-guide-filter-scroll"
          role="group"
          aria-label="빛 환경 필터"
        >
          {LIGHT_FILTERS.map((light) => (
            <button
              key={light}
              type="button"
              className={
                selectedLight === light
                  ? "plant-guide-filter-button plant-guide-filter-button-active"
                  : "plant-guide-filter-button"
              }
              onClick={() => {
                setSelectedLight(light);
                setVisibleCount(PAGE_SIZE);
              }}
            >
              {light}
            </button>
          ))}
        </div>
      </section>

      <div className="plant-guide-result-row">
        <p className="plant-guide-result-count">
          검색 결과 {filteredPlants.length}개
        </p>

        {hasActiveFilter && (
          <button
            type="button"
            className="plant-guide-filter-reset"
            onClick={resetFilters}
          >
            필터 초기화
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="plant-guide-empty">
          식물정보를 불러오는 중입니다.
        </div>
      ) : loadError ? (
        <div className="plant-guide-empty">{loadError}</div>
      ) : visiblePlants.length > 0 ? (
        <>
          <main className="plant-guide-list">
            {visiblePlants.map((plant) => (
              <button
                key={plant.id}
                type="button"
                className="plant-guide-card"
                onClick={() => onSelectPlant(plant)}
              >
                <span
                  className="plant-guide-card-emoji"
                  aria-hidden="true"
                >
                  {plant.emoji}
                </span>

                <span className="plant-guide-card-copy">
                  <h2>{plant.name}</h2>
                  <p>{plant.scientificName}</p>
                  <span className="plant-guide-card-meta">
                    {plant.category} · 난이도 {plant.difficulty}/7
                  </span>
                </span>

                <span
                  className="plant-guide-chevron"
                  aria-hidden="true"
                >
                  ›
                </span>
              </button>
            ))}
          </main>

          {hasMore && (
            <button
              type="button"
              className="plant-guide-more-button"
              onClick={() =>
                setVisibleCount(
                  (currentCount) => currentCount + PAGE_SIZE
                )
              }
            >
              더 보기
              <span>
                {visiblePlants.length}/{filteredPlants.length}
              </span>
            </button>
          )}
        </>
      ) : (
        <div className="plant-guide-empty">
          조건에 맞는 식물이 없습니다.
        </div>
      )}

      <p className="plant-guide-disclaimer">
        온도·습도와 관리 조건은 일반적인 실내 재배 기준이며,
        품종과 계절, 주거 환경에 따라 달라질 수 있습니다.
      </p>
    </div>
  );
}

export default PlantGuide;