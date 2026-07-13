import { useState } from "react";
import type { KeyboardEvent, MouseEvent } from "react";
import type { Plant } from "../types/plant";
import "./PlantCard.css";

type PlantCardProps = {
  plant: Plant;
  onClick: (plant: Plant) => void;
  onQuickWater: (plant: Plant) => Promise<void>;
  onQuickFertilize: (plant: Plant) => Promise<void>;
};

type QuickAction = "water" | "fertilizer";
type CareStatus = "empty" | "safe" | "today" | "overdue";

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

function getCareStatus(
  days: number | null,
  intervalDays: number
): CareStatus {
  if (days === null) return "empty";
  if (days > intervalDays) return "overdue";
  if (days === intervalDays) return "today";
  return "safe";
}

function PlantCard({
  plant,
  onClick,
  onQuickWater,
  onQuickFertilize,
}: PlantCardProps) {
  const wateredDays = getDaysFrom(plant.lastWateredAt);
  const fertilizedDays = getDaysFrom(plant.lastFertilizedAt);
  const waterStatus = getCareStatus(
    wateredDays,
    plant.wateringIntervalDays
  );
  const fertilizerStatus = getCareStatus(
    fertilizedDays,
    plant.fertilizingIntervalDays
  );

  const [quickAction, setQuickAction] = useState<QuickAction | null>(null);

  const handleCardKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "Enter" && event.key !== " ") return;

    event.preventDefault();
    onClick(plant);
  };

  const handleQuickAction = async (
    event: MouseEvent<HTMLButtonElement>,
    action: QuickAction
  ) => {
    event.stopPropagation();

    if (quickAction) return;

    setQuickAction(action);

    try {
      if (action === "water") {
        await onQuickWater(plant);
      } else {
        await onQuickFertilize(plant);
      }
    } finally {
      setQuickAction(null);
    }
  };

  return (
    <div
      className="ps-plant-card"
      role="button"
      tabIndex={0}
      onClick={() => onClick(plant)}
      onKeyDown={handleCardKeyDown}
      aria-label={`${plant.name} 상세 보기`}
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

        <div className="ps-card-quick-actions">
          <button
            type="button"
            className={[
              "ps-card-quick-button",
              "ps-card-fertilizer-button",
              quickAction === "fertilizer"
                ? "ps-card-quick-button-loading"
                : "",
            ]
              .filter(Boolean)
              .join(" ")}
            onClick={(event) =>
              void handleQuickAction(event, "fertilizer")
            }
            disabled={quickAction !== null}
            aria-label={`${plant.name} 오늘 영양제 기록`}
          >
            <span aria-hidden="true">🌱</span>
          </button>

          <button
            type="button"
            className={[
              "ps-card-quick-button",
              "ps-card-water-button",
              quickAction === "water"
                ? "ps-card-quick-button-loading"
                : "",
            ]
              .filter(Boolean)
              .join(" ")}
            onClick={(event) =>
              void handleQuickAction(event, "water")
            }
            disabled={quickAction !== null}
            aria-label={`${plant.name} 오늘 물주기 기록`}
          >
            <span aria-hidden="true">💧</span>
          </button>
        </div>
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

            <strong
              className={`ps-card-care-value ps-card-care-status-${waterStatus}`}
            >
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

            <strong
              className={`ps-card-care-value ps-card-care-status-${fertilizerStatus}`}
            >
              {formatDPlus(fertilizedDays)}
            </strong>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PlantCard;