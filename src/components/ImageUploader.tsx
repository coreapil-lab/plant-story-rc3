import type { ChangeEvent } from "react";

type ImageUploaderProps = {
  imageUrl: string;
  uploading: boolean;
  onUpload: (file: File) => Promise<void>;
};

function ImageUploader({ imageUrl, uploading, onUpload }: ImageUploaderProps) {
  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) {
      return;
    }

    await onUpload(file);

    e.target.value = "";
  };

  return (
    <section className="form-card photo-form-card">
      <div className="photo-preview-box">
        {imageUrl ? (
          <img src={imageUrl} alt="식물 사진 미리보기" />
        ) : (
          <div className="photo-placeholder">
            <span>🌿</span>
            <p>식물 사진을 추가해 주세요.</p>
          </div>
        )}
      </div>

      <label className="photo-upload-button">
        {uploading ? "업로드 중..." : "사진 선택"}
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          disabled={uploading}
        />
      </label>
    </section>
  );
}

export default ImageUploader;