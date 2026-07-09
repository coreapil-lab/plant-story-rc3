const CLOUDINARY_CLOUD_NAME = "bnvkepdw";
const CLOUDINARY_UPLOAD_PRESET = "plant_story_unsigned";

type CloudinaryUploadResponse = {
  secure_url: string;
};

export async function uploadPlantImage(file: File): Promise<string> {
  const formData = new FormData();

  formData.append("file", file);
  formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
    {
      method: "POST",
      body: formData,
    }
  );

  if (!response.ok) {
    throw new Error("Cloudinary 이미지 업로드에 실패했습니다.");
  }

  const data = (await response.json()) as CloudinaryUploadResponse;

  if (!data.secure_url) {
    throw new Error("Cloudinary 이미지 URL을 받지 못했습니다.");
  }

  return data.secure_url;
}