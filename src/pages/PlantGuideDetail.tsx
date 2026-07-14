import { useEffect } from "react";
import type { PlantGuide } from "../types/plantGuide";
import "./PlantGuideDetail.css";

type PlantGuideDetailProps = {
  plant: PlantGuide;
  onBack: () => void;
};

function DifficultyStars({ value }: { value: number }) {
  return (
    <div
      className="guide-difficulty"
      aria-label={`키우기 난이도 ${value}점, 7점 만점`}
    >
      <span className="guide-stars" aria-hidden="true">
        {Array.from({ length: 7 }, (_, index) =>
          index < value ? "★" : "☆"
        ).join("")}
      </span>

      <strong>{value}/7</strong>
    </div>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) {
  return (
    <section className="guide-info-row">
      <div className="guide-info-label">
        <span aria-hidden="true">{icon}</span>
        <strong>{label}</strong>
      </div>

      <p>{value}</p>
    </section>
  );
}

function PlantGuideDetail({
  plant,
  onBack,
}: PlantGuideDetailProps) {
  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: "auto",
    });
  }, []);

  return (
    <div className="plant-guide-detail-page">
      <header className="guide-detail-header">
        <button
          type="button"
          onClick={onBack}
          aria-label="식물정보 목록으로 돌아가기"
        >
          ‹
        </button>

        <span>식물정보</span>
      </header>

      <main>
        <section className="guide-hero">
          <div
            className="guide-hero-emoji"
            aria-hidden="true"
          >
            {plant.emoji}
          </div>

          <div className="guide-hero-copy">
            <span>{plant.category}</span>
            <h1>{plant.name}</h1>
            <p>{plant.scientificName}</p>
          </div>
        </section>

        <section className="guide-summary-card">
          <div>
            <span className="guide-summary-label">
              키우기 난이도
            </span>

            <DifficultyStars value={plant.difficulty} />
          </div>

          <div className="guide-growth">
            <span className="guide-summary-label">
              성장 속도
            </span>

            <strong>{plant.growthSpeed}</strong>
          </div>
        </section>

        <div className="guide-info-card">
          <InfoRow
            icon="🌡️"
            label="적정 온도"
            value={plant.temperature}
          />

          <InfoRow
            icon="💧"
            label="적정 습도"
            value={plant.humidity}
          />

          <InfoRow
            icon="☀️"
            label="빛 환경"
            value={plant.light}
          />

          <InfoRow
            icon="📍"
            label="추천 위치"
            value={plant.recommendedLocation}
          />

          <InfoRow
            icon="🌏"
            label="주요 자생지"
            value={plant.nativeHabitat}
          />

          <InfoRow
            icon="🚿"
            label="물주기"
            value={plant.watering}
          />

          <InfoRow
            icon="🌬️"
            label="통풍"
            value={plant.ventilation}
          />

          <InfoRow
            icon="🪴"
            label="토양"
            value={plant.soil}
          />

          <InfoRow
            icon="⚠️"
            label="주의사항"
            value={plant.caution}
          />
        </div>

        {plant.aliases.length > 0 && (
          <section className="guide-aliases">
            <strong>다른 이름</strong>
            <p>{plant.aliases.join(", ")}</p>
          </section>
        )}

        <p className="guide-detail-disclaimer">
          이 정보는 일반적인 실내 재배 기준입니다. 같은 식물도
          품종, 계절, 화분 크기와 실내 환경에 따라 관리 방법이
          달라질 수 있습니다.
        </p>
      </main>
    </div>
  );
}

export default PlantGuideDetail;