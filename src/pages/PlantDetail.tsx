import { useEffect, useMemo, useRef, useState } from "react";
import type { TouchEvent } from "react";
import type { Plant } from "../types/plant";
import "./PlantDetail.css";

type DateAction = "water" | "fertilizer";

type PlantDetailProps = {
  plant: Plant;
  onBack: () => void;
  onEdit: (plant: Plant) => void;
  onDelete: (plantId: string) => Promise<void>;
  onWater: (plant: Plant, date: string) => Promise<void>;
  onFertilize: (plant: Plant, date: string) => Promise<void>;
  onDeleteWaterRecord: (plant: Plant, date: string) => Promise<void>;
  onDeleteFertilizerRecord: (plant: Plant, date: string) => Promise<void>;
};

type CalendarDay = {
  dateString: string;
  dayNumber: number;
  isCurrentMonth: boolean;
  isFuture: boolean;
};

const MS_PER_DAY = 1000 * 60 * 60 * 24;
const WEEKDAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

function getDateString(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getTodayString() {
  return getDateString(new Date());
}

function parseDateString(dateString: string) {
  const [year, month, day] = dateString.split("-").map(Number);

  if (!year || !month || !day) return null;

  const date = new Date(year, month - 1, day);
  date.setHours(0, 0, 0, 0);

  return Number.isNaN(date.getTime()) ? null : date;
}

function getDaysFrom(dateString: string) {
  const target = parseDateString(dateString);

  if (!target) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return Math.floor((today.getTime() - target.getTime()) / MS_PER_DAY);
}

function formatDPlus(days: number | null) {
  if (days === null) return "기록 없음";

  return `D+${days}`;
}

function formatDate(dateString: string) {
  const date = parseDateString(dateString);

  if (!date) return "기록 없음";

  return date.toLocaleDateString("ko-KR", {
    year: "2-digit",
    month: "numeric",
    day: "numeric",
  });
}

function getMonthStart(dateString: string) {
  const date = parseDateString(dateString) ?? new Date();

  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function createCalendarDays(monthStart: Date): CalendarDay[] {
  const firstDay = new Date(
    monthStart.getFullYear(),
    monthStart.getMonth(),
    1
  );
  const gridStart = new Date(firstDay);
  gridStart.setDate(firstDay.getDate() - firstDay.getDay());

  const today = parseDateString(getTodayString()) as Date;

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + index);
    date.setHours(0, 0, 0, 0);

    return {
      dateString: getDateString(date),
      dayNumber: date.getDate(),
      isCurrentMonth:
        date.getMonth() === monthStart.getMonth() &&
        date.getFullYear() === monthStart.getFullYear(),
      isFuture: date.getTime() > today.getTime(),
    };
  });
}

function getCloudinaryThumbnailUrl(imageUrl: string) {
  if (!imageUrl) return "";

  const uploadSegment = "/image/upload/";

  if (
    !imageUrl.includes("res.cloudinary.com") ||
    !imageUrl.includes(uploadSegment)
  ) {
    return imageUrl;
  }

  const transformation =
    "w_420,h_500,c_fill,g_auto,f_auto,q_auto";

  return imageUrl.replace(
    uploadSegment,
    `${uploadSegment}${transformation}/`
  );
}

function PlantDetail({
  plant,
  onBack,
  onEdit,
  onDelete,
  onWater,
  onFertilize,
  onDeleteWaterRecord,
  onDeleteFertilizerRecord,
}: PlantDetailProps) {
  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: "auto",
    });
  }, []);

  const adoptedDays = getDaysFrom(plant.adoptedAt);
  const thumbnailUrl = getCloudinaryThumbnailUrl(plant.imageUrl);
  const [dateAction, setDateAction] = useState<DateAction | null>(null);
  const [selectedDate, setSelectedDate] = useState(getTodayString());
  const [calendarMonth, setCalendarMonth] = useState(
    getMonthStart(getTodayString())
  );
  const [savingDate, setSavingDate] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const touchCurrentX = useRef<number | null>(null);

  const calendarDays = useMemo(
    () => createCalendarDays(calendarMonth),
    [calendarMonth]
  );

  const todayMonth = getMonthStart(getTodayString());
  const isNextMonthDisabled =
    calendarMonth.getFullYear() === todayMonth.getFullYear() &&
    calendarMonth.getMonth() === todayMonth.getMonth();

  const handleDelete = async () => {
    if (!window.confirm("정말 삭제할까요?")) return;

    if (
      !window.confirm(
        "삭제하면 복구할 수 없습니다. 그래도 삭제할까요?"
      )
    ) {
      return;
    }

    await onDelete(plant.id);
  };

  const openDatePicker = (action: DateAction) => {
    const today = getTodayString();

    setSelectedDate(today);
    setCalendarMonth(getMonthStart(today));
    setDateAction(action);
  };

  const closeDatePicker = () => {
    if (savingDate) return;

    const today = getTodayString();

    setDateAction(null);
    setSelectedDate(today);
    setCalendarMonth(getMonthStart(today));
  };

  const moveCalendarMonth = (offset: number) => {
    setCalendarMonth((current) => {
      const nextMonth = new Date(
        current.getFullYear(),
        current.getMonth() + offset,
        1
      );

      if (nextMonth.getTime() > todayMonth.getTime()) {
        return current;
      }

      return nextMonth;
    });
  };

  const handleCalendarTouchStart = (
    event: TouchEvent<HTMLDivElement>
  ) => {
    const startX = event.touches[0]?.clientX ?? null;

    touchStartX.current = startX;
    touchCurrentX.current = startX;
  };

  const handleCalendarTouchMove = (
    event: TouchEvent<HTMLDivElement>
  ) => {
    touchCurrentX.current = event.touches[0]?.clientX ?? null;
  };

  const handleCalendarTouchEnd = () => {
    if (
      touchStartX.current === null ||
      touchCurrentX.current === null
    ) {
      return;
    }

    const distance = touchCurrentX.current - touchStartX.current;
    const swipeThreshold = 48;

    if (distance > swipeThreshold) {
      moveCalendarMonth(-1);
    } else if (distance < -swipeThreshold && !isNextMonthDisabled) {
      moveCalendarMonth(1);
    }

    touchStartX.current = null;
    touchCurrentX.current = null;
  };

  const handleDeleteSelectedRecord = async () => {
    if (!dateAction || !selectedDate) return;

    const hasRecord =
      dateAction === "water"
        ? plant.wateringHistory.includes(selectedDate)
        : plant.fertilizingHistory.includes(selectedDate);

    if (!hasRecord) {
      window.alert("선택한 날짜에 취소할 기록이 없습니다.");
      return;
    }

    const label = dateAction === "water" ? "물주기" : "영양제";

    if (
      !window.confirm(
        `${selectedDate} ${label} 기록을 취소할까요?`
      )
    ) {
      return;
    }

    setSavingDate(true);

    try {
      if (dateAction === "water") {
        await onDeleteWaterRecord(plant, selectedDate);
      } else {
        await onDeleteFertilizerRecord(plant, selectedDate);
      }

      setDateAction(null);
    } finally {
      setSavingDate(false);
    }
  };

  const handleConfirmDate = async () => {
    if (!dateAction || !selectedDate) return;

    setSavingDate(true);

    try {
      if (dateAction === "water") {
        await onWater(plant, selectedDate);
      } else {
        await onFertilize(plant, selectedDate);
      }

      const today = getTodayString();

      setDateAction(null);
      setSelectedDate(today);
      setCalendarMonth(getMonthStart(today));
    } finally {
      setSavingDate(false);
    }
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
                  src={thumbnailUrl}
                  alt={plant.name}
                  loading="lazy"
                  decoding="async"
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
            onClick={() => openDatePicker("water")}
          >
            💧 물 준 날짜 기록
          </button>

          <button
            type="button"
            className="pd-action-button pd-fertilizer-button"
            onClick={() => openDatePicker("fertilizer")}
          >
            🌱 영양제 날짜 기록
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

      {dateAction && (
        <div
          className="pd-date-modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeDatePicker();
            }
          }}
        >
          <section
            className="pd-date-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="pd-date-modal-title"
          >
            <h2 id="pd-date-modal-title" className="pd-date-modal-title">
              {dateAction === "water"
                ? "물 준 날짜"
                : "영양제 준 날짜"}
            </h2>

            <p className="pd-date-modal-description">
              날짜를 선택해 주세요.
            </p>

            <div
              className="pd-calendar"
              onTouchStart={handleCalendarTouchStart}
              onTouchMove={handleCalendarTouchMove}
              onTouchEnd={handleCalendarTouchEnd}
            >
              <div className="pd-calendar-header">
                <button
                  type="button"
                  className="pd-calendar-nav-button"
                  onClick={() => moveCalendarMonth(-1)}
                  aria-label="이전 달"
                  disabled={savingDate}
                >
                  ‹
                </button>

                <strong className="pd-calendar-month">
                  {calendarMonth.getFullYear()}년{" "}
                  {calendarMonth.getMonth() + 1}월
                </strong>

                <button
                  type="button"
                  className="pd-calendar-nav-button"
                  onClick={() => moveCalendarMonth(1)}
                  aria-label="다음 달"
                  disabled={savingDate || isNextMonthDisabled}
                >
                  ›
                </button>
              </div>

              <div className="pd-calendar-weekdays">
                {WEEKDAY_LABELS.map((label) => (
                  <span key={label}>{label}</span>
                ))}
              </div>

              <div className="pd-calendar-grid">
                {calendarDays.map((day) => {
                  const isSelected = selectedDate === day.dateString;
                  const isWatered =
                    plant.wateringHistory.includes(day.dateString);
                  const isFertilized =
                    plant.fertilizingHistory.includes(day.dateString);
                  const isDisabled =
                    !day.isCurrentMonth || day.isFuture || savingDate;

                  return (
                    <button
                      key={day.dateString}
                      type="button"
                      className={[
                        "pd-calendar-day",
                        !day.isCurrentMonth
                          ? "pd-calendar-day-outside"
                          : "",
                        day.isFuture
                          ? "pd-calendar-day-future"
                          : "",
                        isSelected
                          ? "pd-calendar-day-selected"
                          : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                      onClick={() => setSelectedDate(day.dateString)}
                      disabled={isDisabled}
                      aria-label={`${day.dateString}${
                        isWatered ? ", 물 준 날" : ""
                      }${isFertilized ? ", 영양제 준 날" : ""}`}
                    >
                      <span className="pd-calendar-day-number">
                        {day.dayNumber}
                      </span>

                      <span className="pd-calendar-day-dots">
                        {isWatered && (
                          <span
                            className="pd-calendar-dot pd-calendar-dot-water"
                            aria-hidden="true"
                          />
                        )}

                        {isFertilized && (
                          <span
                            className="pd-calendar-dot pd-calendar-dot-fertilizer"
                            aria-hidden="true"
                          />
                        )}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="pd-calendar-legend">
                <span>
                  <i className="pd-calendar-dot pd-calendar-dot-water" />
                  물 준 날
                </span>
                <span>
                  <i className="pd-calendar-dot pd-calendar-dot-fertilizer" />
                  영양제 준 날
                </span>
              </div>
            </div>

            <button
              type="button"
              className="pd-date-record-cancel-button"
              onClick={handleDeleteSelectedRecord}
              disabled={
                savingDate ||
                !selectedDate ||
                (dateAction === "water"
                  ? !plant.wateringHistory.includes(selectedDate)
                  : !plant.fertilizingHistory.includes(selectedDate))
              }
            >
              선택한 {dateAction === "water" ? "물주기" : "영양제"} 기록 취소
            </button>

            <div className="pd-date-modal-actions">
              <button
                type="button"
                className="pd-date-modal-button pd-date-cancel-button"
                onClick={closeDatePicker}
                disabled={savingDate}
              >
                닫기
              </button>

              <button
                type="button"
                className="pd-date-modal-button pd-date-confirm-button"
                onClick={handleConfirmDate}
                disabled={savingDate || !selectedDate}
              >
                {savingDate ? "처리 중" : "확인"}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

export default PlantDetail;