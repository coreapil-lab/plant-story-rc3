import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
} from "react";
import type {
  Plant,
  PlantImportResult,
} from "../types/plant";
import PlantCard from "../components/PlantCard";
import "./Home.css";

type HomeProps = {
  plants: Plant[];
  loading: boolean;
  onAddPlant: () => void;
  onSelectPlant: (plant: Plant) => void;
  onQuickWater: (plant: Plant) => Promise<void>;
  onQuickFertilize: (plant: Plant) => Promise<void>;
  onImportPlants: (plants: Plant[]) => Promise<PlantImportResult>;
  onLogout: () => Promise<void>;
};

type BackupFile = {
  app?: unknown;
  version?: unknown;
  exportedAt?: unknown;
  plantCount?: unknown;
  plants?: unknown;
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

  const rows = plants.map((plant) =>
    [
      plant.name,
      plant.nickname,
      plant.adoptedAt,
      plant.lastWateredAt,
      plant.wateringIntervalDays,
      plant.wateringHistory,
      plant.lastFertilizedAt,
      plant.fertilizingIntervalDays,
      plant.fertilizingHistory,
      plant.memo,
      plant.imageUrl,
      plant.createdAt,
      plant.updatedAt,
    ]
      .map(escapeCsvValue)
      .join(",")
  );

  return [headers.map(escapeCsvValue).join(","), ...rows].join("\r\n");
}

function normalizeString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function normalizeNumber(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) && value > 0
    ? value
    : fallback;
}

function normalizeHistory(value: unknown, fallbackDate: string): string[] {
  const history = Array.isArray(value)
    ? value.filter(
        (item): item is string =>
          typeof item === "string" && item.trim().length > 0
      )
    : [];

  if (fallbackDate) {
    history.push(fallbackDate);
  }

  return [...new Set(history)].sort((a, b) => a.localeCompare(b));
}

function parseBackupPlants(value: unknown): Plant[] {
  const backup = value as BackupFile;

  if (
    !backup ||
    typeof backup !== "object" ||
    backup.app !== "Plant Story" ||
    !Array.isArray(backup.plants)
  ) {
    throw new Error("Plant Story JSON 백업 파일이 아닙니다.");
  }

  const plants = backup.plants.map((item, index) => {
    if (!item || typeof item !== "object") {
      throw new Error(`${index + 1}번째 식물 데이터가 올바르지 않습니다.`);
    }

    const rawPlant = item as Record<string, unknown>;
    const name = normalizeString(rawPlant.name).trim();

    if (!name) {
      throw new Error(`${index + 1}번째 식물의 이름이 없습니다.`);
    }

    const lastWateredAt = normalizeString(rawPlant.lastWateredAt);
    const lastFertilizedAt = normalizeString(rawPlant.lastFertilizedAt);
    const wateringHistory = normalizeHistory(
      rawPlant.wateringHistory,
      lastWateredAt
    );
    const fertilizingHistory = normalizeHistory(
      rawPlant.fertilizingHistory,
      lastFertilizedAt
    );

    return {
      id: "",
      userId: "",

      name,
      nickname: normalizeString(rawPlant.nickname).trim(),

      imageUrl: normalizeString(rawPlant.imageUrl),

      adoptedAt: normalizeString(rawPlant.adoptedAt),

      lastWateredAt:
        wateringHistory[wateringHistory.length - 1] ?? "",
      wateringHistory,
      wateringIntervalDays: normalizeNumber(
        rawPlant.wateringIntervalDays,
        7
      ),

      lastFertilizedAt:
        fertilizingHistory[fertilizingHistory.length - 1] ?? "",
      fertilizingHistory,
      fertilizingIntervalDays: normalizeNumber(
        rawPlant.fertilizingIntervalDays,
        30
      ),

      memo: normalizeString(rawPlant.memo),

      createdAt: normalizeString(rawPlant.createdAt),
      updatedAt: normalizeString(rawPlant.updatedAt),
    };
  });

  if (plants.length === 0) {
    throw new Error("백업 파일에 복원할 식물이 없습니다.");
  }

  return plants;
}

function Home({
  plants,
  loading,
  onAddPlant,
  onSelectPlant,
  onQuickWater,
  onQuickFertilize,
  onImportPlants,
  onLogout,
}: HomeProps) {
  const [searchText, setSearchText] = useState("");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const importInputRef = useRef<HTMLInputElement | null>(null);

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

  const handleImportButton = () => {
    setIsMenuOpen(false);
    importInputRef.current?.click();
  };

  const handleJsonImport = async (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    setIsImporting(true);

    try {
      const fileText = await file.text();
      const backupData: unknown = JSON.parse(fileText);
      const importedPlants = parseBackupPlants(backupData);

      const shouldImport = window.confirm(
        `${importedPlants.length}개의 식물을 가져옵니다.\n` +
          "현재 식물은 유지되며 중복 식물은 건너뜁니다."
      );

      if (!shouldImport) return;

      const result = await onImportPlants(importedPlants);

      window.alert(
        `가져오기 완료\n` +
          `추가: ${result.importedCount}개\n` +
          `중복 건너뜀: ${result.skippedCount}개`
      );
    } catch (error) {
      console.error(error);

      window.alert(
        error instanceof Error
          ? `가져오기에 실패했습니다.\n${error.message}`
          : "가져오기에 실패했습니다."
      );
    } finally {
      setIsImporting(false);
    }
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

                <button
                  type="button"
                  onClick={handleImportButton}
                  disabled={isImporting}
                >
                  {isImporting ? "가져오는 중" : "JSON 가져오기"}
                </button>

                <button type="button" onClick={handleCsvExport}>
                  CSV 내보내기
                </button>
              </div>
            )}

            <input
              ref={importInputRef}
              type="file"
              accept=".json,application/json"
              onChange={handleJsonImport}
              hidden
            />
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