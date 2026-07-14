import { useMemo, useState } from "react";
import { plantGuideData } from "../data/plantGuideData";
import type { PlantGuide as PlantGuideItem } from "../types/plantGuide";
import "./PlantGuide.css";

type PlantGuideProps = {
  onSelectPlant: (plant: PlantGuideItem) => void;
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

function PlantGuide({ onSelectPlant }: PlantGuideProps) {
  const [searchText, setSearchText] = useState("");

  const filteredPlants = useMemo(() => {
    const keyword = searchText.trim().toLowerCase();
    if (!keyword) return plantGuideData;
    return plantGuideData.filter((plant) =>
      createSearchText(plant).includes(keyword)
    );
  }, [searchText]);

  return (
    <div className="plant-guide-page">
      <header className="plant-guide-header">
        <div>
          <h1>식물정보</h1>
          <p>실내에서 자주 키우는 식물 {plantGuideData.length}종</p>
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

      <p className="plant-guide-result-count">
        {searchText.trim()
          ? `검색 결과 ${filteredPlants.length}개`
          : `전체 ${filteredPlants.length}개`}
      </p>

      {filteredPlants.length > 0 ? (
        <main className="plant-guide-list">
          {filteredPlants.map((plant) => (
            <button
              key={plant.id}
              type="button"
              className="plant-guide-card"
              onClick={() => onSelectPlant(plant)}
            >
              <span className="plant-guide-emoji" aria-hidden="true">
                {plant.emoji}
              </span>

              <span className="plant-guide-card-content">
                <strong>{plant.name}</strong>
                <small>{plant.scientificName}</small>
                <span className="plant-guide-card-meta">
                  {plant.category} · 난이도 {plant.difficulty}/7
                </span>
              </span>

              <span className="plant-guide-chevron" aria-hidden="true">›</span>
            </button>
          ))}
        </main>
      ) : (
        <div className="plant-guide-empty">검색 결과가 없습니다.</div>
      )}

      <p className="plant-guide-disclaimer">
        온도·습도와 관리 조건은 일반적인 실내 재배 기준이며, 품종과 계절,
        주거 환경에 따라 달라질 수 있습니다.
      </p>
    </div>
  );
}

export default PlantGuide;
