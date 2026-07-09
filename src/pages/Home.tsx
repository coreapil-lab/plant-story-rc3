import { useMemo, useState } from 'react';
import type { Plant } from '../types/plant';
import PlantCard from '../components/PlantCard';
import "./Home.css";
type HomeProps = {
  plants: Plant[];
  loading: boolean;
  onAddPlant: () => void;
  onSelectPlant: (plant: Plant) => void;
  onLogout: () => Promise<void>;
};

function Home({
  plants,
  loading,
  onAddPlant,
  onSelectPlant,
  onLogout,
}: HomeProps) {
  const [searchText, setSearchText] = useState('');

  const filteredPlants = useMemo(() => {
    const keyword = searchText.trim().toLowerCase();

    if (!keyword) return plants;

    return plants.filter((plant) =>
      plant.name.toLowerCase().includes(keyword)
    );
  }, [plants, searchText]);

  return (
    <div className="page">
      <header className="home-header">
        <div>
          <h1>🌿 Plant Story</h1>
        </div>

        <button className="logout-button" type="button" onClick={onLogout}>
          로그아웃
        </button>
      </header>

      <div className="search-box">
        <span aria-hidden="true">🔍</span>
        <input
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          className="search-input"
          placeholder="검색"
        />
      </div>

      {loading ? (
        <div className="empty-box">
          <p>식물 정보를 불러오는 중입니다.</p>
        </div>
      ) : filteredPlants.length > 0 ? (
        <main className="plant-list">
          {filteredPlants.map((plant) => (
            <PlantCard
              key={plant.id}
              plant={plant}
              onClick={onSelectPlant}
            />
          ))}
        </main>
      ) : (
        <div className="empty-box">
          <p>
            {searchText.trim()
              ? '검색 결과가 없습니다.'
              : '아직 등록된 식물이 없습니다.'}
          </p>
        </div>
      )}

      <button className="floating-add-button" type="button" onClick={onAddPlant}>
        +
      </button>
    </div>
  );
}

export default Home;