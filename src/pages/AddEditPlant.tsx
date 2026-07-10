import { useEffect, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { uploadPlantImage } from "../services/cloudinary";
import type { Plant, PlantFormValues } from "../types/plant";
import "./AddEditPlant.css";

type AddEditPlantProps = {
  plant?: Plant | null;
  onSave: (values: PlantFormValues) => Promise<void>;
  onCancel: () => void;
};

const emptyForm: PlantFormValues = {
  name: "",
  nickname: "",
  adoptedAt: "",
  lastWateredAt: "",
  wateringIntervalDays: 7,
  lastFertilizedAt: "",
  fertilizingIntervalDays: 30,
  memo: "",
  imageUrl: "",
};

function AddEditPlant({ plant, onSave, onCancel }: AddEditPlantProps) {
  const [form, setForm] = useState<PlantFormValues>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    if (!plant) {
      setForm(emptyForm);
      return;
    }

    setForm({
      name: plant.name ?? "",
      nickname: plant.nickname ?? "",
      adoptedAt: plant.adoptedAt ?? "",
      lastWateredAt: plant.lastWateredAt ?? "",
      wateringIntervalDays: plant.wateringIntervalDays ?? 7,
      lastFertilizedAt: plant.lastFertilizedAt ?? "",
      fertilizingIntervalDays: plant.fertilizingIntervalDays ?? 30,
      memo: plant.memo ?? "",
      imageUrl: plant.imageUrl ?? "",
    });
  }, [plant]);

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]:
        name === "wateringIntervalDays" || name === "fertilizingIntervalDays"
          ? Number(value)
          : value,
    }));
  };

  const handleImageChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) return;

    setUploadingImage(true);

    try {
      const imageUrl = await uploadPlantImage(file);

      setForm((prev) => ({
        ...prev,
        imageUrl,
      }));
    } catch (error) {
      console.error(error);
      alert("사진 업로드에 실패했습니다. 다시 시도해 주세요.");
    } finally {
      setUploadingImage(false);
      e.target.value = "";
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!form.name.trim()) {
      alert("식물 이름을 입력해 주세요.");
      return;
    }

    if (uploadingImage) {
      alert("사진 업로드가 끝난 후 저장해 주세요.");
      return;
    }

    setSaving(true);

    try {
      await onSave({
        name: form.name.trim(),
        nickname: form.nickname.trim(),
        adoptedAt: form.adoptedAt,
        lastWateredAt: form.lastWateredAt,
        wateringIntervalDays: form.wateringIntervalDays,
        lastFertilizedAt: form.lastFertilizedAt,
        fertilizingIntervalDays: form.fertilizingIntervalDays,
        memo: form.memo.trim(),
        imageUrl: form.imageUrl.trim(),
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="ae-page">
      <form className="ae-form" onSubmit={handleSubmit}>
        <header className="ae-header">
          <button
            type="button"
            className="ae-header-button"
            onClick={onCancel}
          >
            뒤로
          </button>

          <h1 className="ae-header-title">
            {plant ? "식물 수정" : "식물 추가"}
          </h1>

          <button
            type="submit"
            className="ae-header-button"
            disabled={saving || uploadingImage}
          >
            {saving ? "저장 중" : "저장"}
          </button>
        </header>

        <main className="ae-content">
          <section className="ae-profile">
            <div className="ae-photo-column">
              <div className="ae-photo-frame">
                {form.imageUrl ? (
                  <img
                    className="ae-photo-image"
                    src={form.imageUrl}
                    alt={form.name || "식물 사진"}
                  />
                ) : (
                  <div className="ae-photo-placeholder">
                    <span aria-hidden="true">🌿</span>
                  </div>
                )}
              </div>

              <label className="ae-photo-button">
                {uploadingImage ? "업로드 중" : "사진 변경"}

                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  disabled={saving || uploadingImage}
                />
              </label>
            </div>

            <div className="ae-profile-fields">
              <div className="ae-profile-field">
                <label htmlFor="ae-name">식물 이름</label>

                <input
                  id="ae-name"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="예: 몬스테라"
                />
              </div>

              <div className="ae-profile-field">
                <label htmlFor="ae-nickname">별명</label>

                <input
                  id="ae-nickname"
                  name="nickname"
                  value={form.nickname}
                  onChange={handleChange}
                  placeholder="선택 입력"
                />
              </div>
            </div>
          </section>

          <section className="ae-section">
            <h2 className="ae-section-title">관리 정보</h2>

            <div className="ae-care-grid">
              <div className="ae-form-group ae-form-group-full">
                <label htmlFor="ae-adopted-at">📅 입양일</label>

                <input
                  id="ae-adopted-at"
                  type="date"
                  name="adoptedAt"
                  value={form.adoptedAt}
                  onChange={handleChange}
                />
              </div>

              <div className="ae-form-group">
                <label htmlFor="ae-watered-at">💧 물 준 날짜</label>

                <input
                  id="ae-watered-at"
                  type="date"
                  name="lastWateredAt"
                  value={form.lastWateredAt}
                  onChange={handleChange}
                />
              </div>

              <div className="ae-form-group">
                <label htmlFor="ae-watering-interval">💧 물주기</label>

                <input
                  id="ae-watering-interval"
                  type="number"
                  name="wateringIntervalDays"
                  min="1"
                  value={form.wateringIntervalDays}
                  onChange={handleChange}
                />
              </div>

              <div className="ae-form-group">
                <label htmlFor="ae-fertilized-at">🌱 최근 영양제</label>

                <input
                  id="ae-fertilized-at"
                  type="date"
                  name="lastFertilizedAt"
                  value={form.lastFertilizedAt}
                  onChange={handleChange}
                />
              </div>

              <div className="ae-form-group">
                <label htmlFor="ae-fertilizing-interval">
                  🌱 영양제 주기
                </label>

                <input
                  id="ae-fertilizing-interval"
                  type="number"
                  name="fertilizingIntervalDays"
                  min="1"
                  value={form.fertilizingIntervalDays}
                  onChange={handleChange}
                />
              </div>
            </div>
          </section>

          <section className="ae-section">
            <h2 className="ae-section-title">메모</h2>

            <div className="ae-form-group">
              <textarea
                name="memo"
                value={form.memo}
                onChange={handleChange}
                placeholder="식물 상태나 관리 메모를 적어 주세요."
                rows={5}
              />
            </div>
          </section>

          <div className="ae-button-row">
            <button
              type="submit"
              className="ae-save-button"
              disabled={saving || uploadingImage}
            >
              {uploadingImage
                ? "사진 업로드 중"
                : saving
                  ? "저장 중"
                  : "저장하기"}
            </button>
          </div>
        </main>
      </form>
    </div>
  );
}

export default AddEditPlant;