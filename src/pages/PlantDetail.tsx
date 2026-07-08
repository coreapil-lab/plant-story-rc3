import type { Plant } from "../types/plant";
import "./PlantDetail.css";

type PlantDetailProps = {
  plant: Plant;
  onBack: () => void;
  onEdit: (plant: Plant) => void;
  onDelete: (plantId: string) => Promise<void>;
  onWater: (plant: Plant) => Promise<void>;
};

const MS_PER_DAY = 1000 * 60 * 60 * 24;

function getDaysFrom(dateString: string) {
  if (!dateString) return null;

  const target = new Date(dateString);
  const today = new Date();

  if (Number.isNaN(target.getTime())) return null;

  target.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);

  return Math.floor((today.getTime() - target.getTime()) / MS_PER_DAY);
}

function formatDPlus(days: number | null) {
  if (days === null) return "기록 없음";
  return `D+${days}`;
}

function formatDate(dateString: string) {
  if (!dateString) return "기록 없음";

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) return "기록 없음";

  return date.toLocaleDateString("ko-KR", {
    year: "2-digit",
    month: "numeric",
    day: "numeric",
  });
}

function PlantIcon() {
  return (
    <div className="plant-icon" aria-hidden="true">
      <svg
        width="74"
        height="74"
        viewBox="0 0 96 96"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect x="32" y="58" width="32" height="22" rx="6" fill="#D9A066" />
        <path
          d="M48 61C48 44 48 35 48 23"
          stroke="#4F8F62"
          strokeWidth="5"
          strokeLinecap="round"
        />
        <path d="M46 39C31 38 23 30 22 18C35 18 45 25 46 39Z" fill="#79B77B" />
        <path d="M50 45C66 44 75 35 76 22C61 22 51 30 50 45Z" fill="#67A96B" />
        <path d="M47 54C34 54 26 47 25 36C38 36 46 42 47 54Z" fill="#8BCB8E" />
      </svg>
    </div>
  );
}

function PlantDetail({
  plant,
  onBack,
  onEdit,
  onDelete,
  onWater,
}: PlantDetailProps) {
  const adoptedDays = getDaysFrom(plant.adoptedAt);
  const wateredDays = getDaysFrom(plant.lastWateredAt);
  const fertilizedDays = getDaysFrom(plant.lastFertilizedAt);

  const handleDelete = async () => {
    if (!window.confirm("정말 삭제할까요?")) return;
    if (!window.confirm("삭제하면 복구할 수 없습니다. 그래도 삭제할까요?")) return;

    await onDelete(plant.id);
  };

  return (
    <div className="page">
      <header className="header">
        <button type="button" className="top-button" onClick={onBack}>
          뒤로
        </button>

        <button type="button" className="top-button" onClick={() => onEdit(plant)}>
          수정
        </button>
      </header>

      <section className="hero">
        <PlantIcon />

        <h1 className="hero-title">{plant.name}</h1>

        {plant.nickname && <p className="hero-desc">{plant.nickname}</p>}

        <div className="plant-meta">
          <span className="meta-pill">💧 {formatDPlus(wateredDays)}</span>
          <span className="meta-pill">🌱 {formatDPlus(fertilizedDays)}</span>
        </div>
      </section>

      <section className="detail-card">
        <h2 className="plant-name">기본 정보</h2>

        <div className="plant-list">
          <div className="meta-pill">
            📅 입양일 {formatDate(plant.adoptedAt)} / {formatDPlus(adoptedDays)}
          </div>
          <div className="meta-pill">
            💧 최근 물 준 날 {formatDate(plant.lastWateredAt)} /{" "}
            {plant.wateringIntervalDays}일 주기
          </div>
          <div className="meta-pill">
            🌱 최근 영양제 {formatDate(plant.lastFertilizedAt)} /{" "}
            {plant.fertilizingIntervalDays}일 주기
          </div>
        </div>
      </section>

      <section className="detail-card">
        <h2 className="plant-name">메모</h2>
        <p className="hero-desc">
          {plant.memo ? plant.memo : "작성된 메모가 없습니다."}
        </p>
      </section>

      <div className="button-row">
        <button type="button" className="primary-button" onClick={() => onWater(plant)}>
          오늘 물 줬어요
        </button>
      </div>

      <div className="button-row">
        <button type="button" className="danger-button" onClick={handleDelete}>
          삭제
        </button>
      </div>
    </div>
  );
}

export default PlantDetail;