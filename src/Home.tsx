import { useMemo, useState } from "react";
import type { Plant } from "./types/plant";
import PlantCard from "./components/PlantCard";

type HomeProps = {
  plants: Plant[];
  loading: boolean;
  onAddPlant: () => void;
  onSelectPlant: (plant: Plant) => void;
  onLogout: () => void;
};

function Home({
  plants,
  loading,
  onAddPlant,
  onSelectPlant,
  onLogout,
}: HomeProps) {
  const [search, setSearch] = useState("");

  const filteredPlants = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) return plants;

    return plants.filter((plant) =>
      plant.name.toLowerCase().includes(keyword)
    );
  }, [plants, search]);

  return (
    <div className="page">
      <header className="header">
        <div>
          <h1 className="header-title">Plant Story</h1>
          <p className="header-subtitle">나의 식물 관리 기록</p>
        </div>

        <button className="top-button" type="button" onClick={onLogout}>
          로그아웃
        </button>
      </header>

      <section className="hero">
        <span className="hero-label">🌿 오늘의 식물</span>
        <h2 className="hero-title">식물의 하루를 가볍게 기록하세요</h2>
        <p className="hero-desc">
          물주기와 영양제 기록을 한눈에 확인할 수 있습니다.
        </p>
      </section>

      <div className="search-box">
        <span className="search-icon">🔍</span>

        <input
          className="search-input"
          type="text"
          placeholder="식물 검색"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="empty-state">
          <p className="empty-state-title">불러오는 중</p>
          <p className="empty-state-desc">식물 정보를 불러오고 있습니다.</p>
        </div>
      ) : filteredPlants.length === 0 ? (
        <div className="empty-state">
          <p className="empty-state-title">등록된 식물이 없습니다</p>
          <p className="empty-state-desc">
            아래 버튼을 눌러 첫 식물을 추가해보세요.
          </p>
        </div>
      ) : (
        <div className="plant-list">
          {filteredPlants.map((plant) => (
            <PlantCard key={plant.id} plant={plant} onClick={onSelectPlant} />
          ))}
        </div>
      )}

      <button className="floating-button" type="button" onClick={onAddPlant}>
        식물 추가
      </button>
    </div>
  );
}

export default Home;