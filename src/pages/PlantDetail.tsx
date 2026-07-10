import type { Plant } from "../types/plant";
import "./PlantDetail.css";

type PlantDetailProps = {
  plant: Plant;
  onBack: () => void;
  onEdit: (plant: Plant) => void;
  onDelete: (plantId: string) => Promise<void>;
  onWater: (plant: Plant) => Promise<void>;
  onFertilize: (plant: Plant) => Promise<void>;
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

function PlantDetail({
  plant,
  onBack,
  onEdit,
  onDelete,
  onWater,
  onFertilize,
}: PlantDetailProps) {
  const adoptedDays = getDaysFrom(plant.adoptedAt);
  const wateredDays = getDaysFrom(plant.lastWateredAt);
  const fertilizedDays = getDaysFrom(plant.lastFertilizedAt);

  const handleDelete = async () => {
    if (!window.confirm("정말 삭제할까요?")) return;

    if (
      !window.confirm(
        "삭제하면 복구할 수 없습니다. 그래도 삭제할까요?",
      )
    ) {
      return;
    }

    await onDelete(plant.id);
  };

  return (
    <div className="pd-page">
      <header className="pd-header">
        <button
          type="button"
          className="pd-header-button"
          onClick={onBack}
        >
          뒤로
        </button>

        <button
          type="button"
          className="pd-header-button"
          onClick={() => onEdit(plant)}
        >
          수정
        </button>
      </header>

      <main className="pd-content">
        <section className="pd-profile">
          <div className="pd-photo-column">
            <div className="pd-photo-frame">
              {plant.imageUrl ? (
                <img
                  className="pd-photo-image"
                  src={plant.imageUrl}
                  alt={plant.name}
                />
              ) : (
                <div className="pd-photo-placeholder">
                  <svg
                    width="88"
                    height="88"
                    viewBox="0 0 96 96"
                    fill="none"
                    aria-hidden="true"
                  >
                    <rect
                      x="32"
                      y="58"
                      width="32"
                      height="22"
                      rx="6"
                      fill="#D9A066"
                    />

                    <path
                      d="M48 61C48 44 48 35 48 23"
                      stroke="#4F8F62"
                      strokeWidth="5"
                      strokeLinecap="round"
                    />

                    <path
                      d="M46 39C31 38 23 30 22 18C35 18 45 25 46 39Z"
                      fill="#79B77B"
                    />

                    <path
                      d="M50 45C66 44 75 35 76 22C61 22 51 30 50 45Z"
                      fill="#67A96B"
                    />

                    <path
                      d="M47 54C34 54 26 47 25 36C38 36 46 42 47 54Z"
                      fill="#8BCB8E"
                    />
                  </svg>
                </div>
              )}
            </div>

            <div className="pd-status-list">
              <div className="pd-status-item">
                <span aria-hidden="true">💧</span>
                <span>{formatDPlus(wateredDays)}</span>
              </div>

              <div className="pd-status-item">
                <span aria-hidden="true">🌱</span>
                <span>{formatDPlus(fertilizedDays)}</span>
              </div>
            </div>
          </div>

          <div className="pd-profile-info">
            <div className="pd-profile-field">
              <span className="pd-profile-label">식물 이름</span>
              <h1 className="pd-profile-name">{plant.name}</h1>
            </div>

            <div className="pd-profile-field">
              <span className="pd-profile-label">별명</span>
              <p className="pd-profile-value">
                {plant.nickname || "별명 없음"}
              </p>
            </div>

            <div className="pd-profile-field">
              <span className="pd-profile-label">입양일</span>
              <p className="pd-profile-value">
                {formatDate(plant.adoptedAt)}
              </p>

              <span className="pd-adopted-days">
                {formatDPlus(adoptedDays)}
              </span>
            </div>
          </div>
        </section>

        <section className="pd-section">
          <h2 className="pd-section-title">기본 정보</h2>

          <div className="pd-info-list">
            <div className="pd-info-row">
              <span className="pd-info-label">
                <span aria-hidden="true">📅</span>
                입양일
              </span>

              <span className="pd-info-value">
                {formatDate(plant.adoptedAt)} /{" "}
                {formatDPlus(adoptedDays)}
              </span>
            </div>

            <div className="pd-info-row">
              <span className="pd-info-label">
                <span aria-hidden="true">💧</span>
                최근 물 준 날
              </span>

              <span className="pd-info-value">
                {formatDate(plant.lastWateredAt)} /{" "}
                {plant.wateringIntervalDays}일 주기
              </span>
            </div>

            <div className="pd-info-row">
              <span className="pd-info-label">
                <span aria-hidden="true">🌱</span>
                최근 영양제
              </span>

              <span className="pd-info-value">
                {formatDate(plant.lastFertilizedAt)} /{" "}
                {plant.fertilizingIntervalDays}일 주기
              </span>
            </div>
          </div>
        </section>

        <section className="pd-section">
          <h2 className="pd-section-title">메모</h2>

          <p className="pd-memo">
            {plant.memo
              ? plant.memo
              : "작성된 메모가 없습니다."}
          </p>
        </section>

        <div className="pd-actions">
          <button
            type="button"
            className="pd-action-button pd-water-button"
            onClick={() => onWater(plant)}
          >
            💧 오늘 물 줬어요
          </button>

          <button
            type="button"
            className="pd-action-button pd-fertilizer-button"
            onClick={() => onFertilize(plant)}
          >
            🌱 오늘 영양제 줬어요
          </button>

          <button
            type="button"
            className="pd-action-button pd-delete-button"
            onClick={handleDelete}
          >
            삭제
          </button>
        </div>
      </main>
    </div>
  );
}

export default PlantDetail;