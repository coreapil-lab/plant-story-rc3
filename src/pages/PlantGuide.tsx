import {
  useEffect,
  useMemo,
  useState,
} from "react";
import { plantGuideData } from "../data/plantGuideData";
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

const PAGE_SIZE = 20;

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

const GROWTH_SPEED_ORDER: Record<
  PlantGuideItem["growthSpeed"],
  number
> = {
  빠름: 0,
  보통: 1,
  느림: 2,
};

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
  const [searchText, setSearchText] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("전체");
  const [selectedLight, setSelectedLight] =
    useState<LightFilter>("전체");
  const [sortOption, setSortOption] =
    useState<SortOption>("전체");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const categories = useMemo(
    () => [
      "전체",
      ...Array.from(
        new Set(plantGuideData.map((plant) => plant.category))
      ).sort((a, b) => a.localeCompare(b, "ko")),
    ],
    []
  );

  const filteredPlants = useMemo(() => {
    const keyword = searchText.trim().toLowerCase();

    const matches = plantGuideData.filter((plant) => {
      const matchesKeyword =
        !keyword || createSearchText(plant).includes(keyword);

      const matchesCategory =
        selectedCategory === "전체" ||
        plant.category === selectedCategory;

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
  ]);

  const visiblePlants = filteredPlants.slice(0, visibleCount);
  const hasMore = visibleCount < filteredPlants.length;

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [
    searchText,
    selectedCategory,
    selectedLight,
    sortOption,
  ]);

  const resetFilters = () => {
    setSearchText("");
    setSelectedCategory("전체");
    setSelectedLight("전체");
    setSortOption("전체");
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
            실내에서 자주 키우는 식물 {plantGuideData.length}종
          </p>
        </div>
      </header>

      <div className="plant-guide-search">
        <span aria-hidden="true">🔍</span>
        <input
          value={searchText}
          onChange={(event) => setSearchText(event.target.value)}
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
              onClick={() => setSortOption(option)}
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
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              className={
                selectedCategory === category
                  ? "plant-guide-filter-button plant-guide-filter-button-active"
                  : "plant-guide-filter-button"
              }
              onClick={() => setSelectedCategory(category)}
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
              onClick={() => setSelectedLight(light)}
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

      {visiblePlants.length > 0 ? (
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