import { useEffect, useMemo, useRef, useState } from "react";
import type { Plant } from "../types/plant";
import PlantCard from "../components/PlantCard";
import "./Home.css";

type HomeProps = {
  plants: Plant[];
  loading: boolean;
  onAddPlant: () => void;
  onSelectPlant: (plant: Plant) => void;
  onQuickWater: (plant: Plant) => Promise<void>;
  onQuickFertilize: (plant: Plant) => Promise<void>;
  onLogout: () => Promise<void>;
};

function getTodayFileString() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function downloadFile(
  content: string,
  fileName: string,
  mimeType: string
) {
  const blob = new Blob([content], {
    type: `${mimeType};charset=utf-8`,
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();

  URL.revokeObjectURL(url);
}

function escapeCsvValue(value: unknown) {
  if (Array.isArray(value)) {
    return `"${value.join(" | ").replaceAll('"', '""')}"`;
  }

  const text = String(value ?? "").replaceAll('"', '""');
  return `"${text}"`;
}

function createCsv(plants: Plant[]) {
  const headers = [
    "이름",
    "별명",
    "입양일",
    "최근 물주기",
    "물주기 주기(일)",
    "물주기 기록",
    "최근 영양제",
    "영양제 주기(일)",
    "영양제 기록",
    "메모",
    "사진 주소",
    "등록일",
    "수정일",
  ];

  const rows = plants.map((plant) => {
    const plantWithHistory = plant as Plant & {
      wateringHistory?: string[];
      fertilizingHistory?: string[];
    };

    return [
      plant.name,
      plant.nickname,
      plant.adoptedAt,
      plant.lastWateredAt,
      plant.wateringIntervalDays,
      plantWithHistory.wateringHistory ?? [],
      plant.lastFertilizedAt,
      plant.fertilizingIntervalDays,
      plantWithHistory.fertilizingHistory ?? [],
      plant.memo,
      plant.imageUrl,
      plant.createdAt,
      plant.updatedAt,
    ]
      .map(escapeCsvValue)
      .join(",");
  });

  return [headers.map(escapeCsvValue).join(","), ...rows].join("\r\n");
}

function Home({
  plants,
  loading,
  onAddPlant,
  onSelectPlant,
  onQuickWater,
  onQuickFertilize,
  onLogout,
}: HomeProps) {
  const [searchText, setSearchText] = useState("");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const filteredPlants = useMemo(() => {
    const keyword = searchText.trim().toLowerCase();

    if (!keyword) return plants;

    return plants.filter((plant) =>
      plant.name.toLowerCase().includes(keyword)
    );
  }, [plants, searchText]);

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node)
      ) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, []);

  const handleJsonBackup = () => {
    if (plants.length === 0) {
      window.alert("백업할 식물이 없습니다.");
      return;
    }

    const backupData = {
      app: "Plant Story",
      version: "RC10",
      exportedAt: new Date().toISOString(),
      plantCount: plants.length,
      plants,
    };

    downloadFile(
      JSON.stringify(backupData, null, 2),
      `plant-story-backup-${getTodayFileString()}.json`,
      "application/json"
    );

    setIsMenuOpen(false);
  };

  const handleCsvExport = () => {
    if (plants.length === 0) {
      window.alert("내보낼 식물이 없습니다.");
      return;
    }

    downloadFile(
      `\uFEFF${createCsv(plants)}`,
      `plant-story-${getTodayFileString()}.csv`,
      "text/csv"
    );

    setIsMenuOpen(false);
  };

  return (
    <div className="page">
      <header className="home-header">
        <div className="home-title-group">
          <h1>Plant Story</h1>
          <p className="plant-count">🌿 내 식물 {plants.length}개</p>
        </div>

        <div className="home-actions">
          <div className="settings-menu" ref={menuRef}>
            <button
              className="settings-button"
              type="button"
              aria-label="설정 메뉴 열기"
              aria-expanded={isMenuOpen}
              onClick={() => setIsMenuOpen((previous) => !previous)}
            >
              ⋯
            </button>

            {isMenuOpen && (
              <div className="settings-popover">
                <button type="button" onClick={handleJsonBackup}>
                  JSON 백업
                </button>

                <button type="button" onClick={handleCsvExport}>
                  CSV 내보내기
                </button>
              </div>
            )}
          </div>

          <button
            className="logout-button"
            type="button"
            onClick={onLogout}
          >
            로그아웃
          </button>
        </div>
      </header>

      <div className="search-box">
        <span aria-hidden="true">🔍</span>
        <input
          value={searchText}
          onChange={(event) => setSearchText(event.target.value)}
          className="search-input"
          placeholder="검색"
          aria-label="식물 검색"
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
              onQuickWater={onQuickWater}
              onQuickFertilize={onQuickFertilize}
            />
          ))}
        </main>
      ) : (
        <div className="empty-box">
          <p>
            {searchText.trim()
              ? "검색 결과가 없습니다."
              : "아직 등록된 식물이 없습니다."}
          </p>
        </div>
      )}

      <button
        className="floating-add-button"
        type="button"
        onClick={onAddPlant}
        aria-label="식물 추가"
      >
        +
      </button>
    </div>
  );
}

export default Home;