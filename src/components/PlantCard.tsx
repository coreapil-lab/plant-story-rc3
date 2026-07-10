import type { Plant } from "../types/plant";
import "./PlantCard.css";

type PlantCardProps = {
  plant: Plant;
  onClick: (plant: Plant) => void;
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

function PlantCard({ plant, onClick }: PlantCardProps) {
  const wateredDays = getDaysFrom(plant.lastWateredAt);
  const fertilizedDays = getDaysFrom(plant.lastFertilizedAt);

  return (
    <button
      className="ps-plant-card"
      type="button"
      onClick={() => onClick(plant)}
    >
      <div className="ps-card-photo-frame">
        {plant.imageUrl ? (
          <img
            className="ps-card-photo"
            src={plant.imageUrl}
            alt={plant.name}
          />
        ) : (
          <div className="ps-card-placeholder" aria-hidden="true">
            🌿
          </div>
        )}
      </div>

      <div className="ps-card-content">
        <div className="ps-card-heading">
          <div className="ps-card-name">{plant.name}</div>

          <div className="ps-card-nickname">
            {plant.nickname || "별명 없음"}
          </div>
        </div>

        <div className="ps-card-divider" />

        <div className="ps-card-care-list">
          <div className="ps-card-care-row">
            <span className="ps-card-care-label">
              <span className="ps-card-care-icon" aria-hidden="true">
                💧
              </span>
              물주기
            </span>

            <strong className="ps-card-care-value ps-card-care-value-water">
              {formatDPlus(wateredDays)}
            </strong>
          </div>

          <div className="ps-card-care-row">
            <span className="ps-card-care-label">
              <span className="ps-card-care-icon" aria-hidden="true">
                🌱
              </span>
              영양제
            </span>

            <strong className="ps-card-care-value">
              {formatDPlus(fertilizedDays)}
            </strong>
          </div>
        </div>
      </div>
    </button>
  );
}

export default PlantCard;