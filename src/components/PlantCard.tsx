import type { Plant } from "../types/plant";

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

function formatDPlus(days: number | null) {
  if (days === null) return "없음";
  return `D+${days}`;
}

function PlantCard({ plant, onClick }: PlantCardProps) {
  const wateredDays = getDaysFrom(plant.lastWateredAt);
  const fertilizedDays = getDaysFrom(plant.lastFertilizedAt);

  return (
    <button className="plant-card" type="button" onClick={() => onClick(plant)}>
      <PlantIcon />

      <div className="plant-info">
        <h3 className="plant-name">{plant.name}</h3>

        <div className="plant-meta">
          <span className="meta-pill">💧 {formatDPlus(wateredDays)}</span>
          <span className="meta-pill">🌱 {formatDPlus(fertilizedDays)}</span>
        </div>
      </div>
    </button>
  );
}

export default PlantCard;