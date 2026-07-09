import { useEffect, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import ImageUploader from "../components/ImageUploader";
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

  const handleImageUpload = async (file: File) => {
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
    <div className="page">
      <form onSubmit={handleSubmit}>
        <header className="header">
          <button type="button" className="top-button" onClick={onCancel}>
            취소
          </button>

          <button
            type="submit"
            className="top-button"
            disabled={saving || uploadingImage}
          >
            {saving ? "저장 중" : "저장"}
          </button>
        </header>

        <section className="hero">
          <span className="hero-label">🌿 Plant Story</span>
          <h1 className="hero-title">{plant ? "식물 수정" : "식물 추가"}</h1>
          <p className="hero-desc">
            {plant ? "식물 기록을 수정하세요." : "새로운 식물을 등록하세요."}
          </p>
        </section>

        <ImageUploader
          imageUrl={form.imageUrl}
          uploading={uploadingImage}
          onUpload={handleImageUpload}
        />

        <section className="form-card">
          <div className="form-group">
            <label className="form-label">식물 이름</label>
            <input
              className="form-input"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="예: 몬스테라"
            />
          </div>

          <div className="form-group">
            <label className="form-label">별명</label>
            <input
              className="form-input"
              name="nickname"
              value={form.nickname}
              onChange={handleChange}
              placeholder="선택 입력"
            />
          </div>

          <div className="form-group">
            <label className="form-label">입양일</label>
            <input
              className="form-input"
              type="date"
              name="adoptedAt"
              value={form.adoptedAt}
              onChange={handleChange}
            />
          </div>
        </section>

        <section className="form-card">
          <div className="form-group">
            <label className="form-label">💧 물 준 날짜</label>
            <input
              className="form-input"
              type="date"
              name="lastWateredAt"
              value={form.lastWateredAt}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label className="form-label">💧 물주기</label>
            <input
              className="form-input"
              type="number"
              name="wateringIntervalDays"
              min="1"
              value={form.wateringIntervalDays}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label className="form-label">🌱 최근 영양제</label>
            <input
              className="form-input"
              type="date"
              name="lastFertilizedAt"
              value={form.lastFertilizedAt}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label className="form-label">🌱 영양제 주기</label>
            <input
              className="form-input"
              type="number"
              name="fertilizingIntervalDays"
              min="1"
              value={form.fertilizingIntervalDays}
              onChange={handleChange}
            />
          </div>
        </section>

        <section className="form-card">
          <div className="form-group">
            <label className="form-label">메모</label>
            <textarea
              className="form-textarea"
              name="memo"
              value={form.memo}
              onChange={handleChange}
              placeholder="식물 상태나 관리 메모를 적어 주세요."
              rows={5}
            />
          </div>
        </section>

        <div className="button-row">
          <button
            type="submit"
            className="primary-button"
            disabled={saving || uploadingImage}
          >
            {uploadingImage ? "사진 업로드 중" : saving ? "저장 중" : "저장하기"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default AddEditPlant;