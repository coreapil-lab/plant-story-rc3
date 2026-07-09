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
  if (days === null) return "없음";
  return `D+${days}`;
}

function PlantCard({ plant, onClick }: PlantCardProps) {
  const wateredDays = getDaysFrom(plant.lastWateredAt);
  const fertilizedDays = getDaysFrom(plant.lastFertilizedAt);

  return (
    <button className="ps-plant-card" type="button" onClick={() => onClick(plant)}>
      <div className="ps-card-icon" aria-hidden="true">
        🌿
      </div>

      <div className="ps-card-name">{plant.name}</div>

      <div className="ps-card-meta">
        <span>💧 {formatDPlus(wateredDays)}</span>
        <span>🌱 {formatDPlus(fertilizedDays)}</span>
      </div>
    </button>
  );
}

export default PlantCard;