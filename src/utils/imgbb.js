const IMGBB_API_KEY = import.meta.env.VITE_IMGBB_API_KEY;

/**
 * Upload an image file to ImgBB and return the hosted URL.
 * @param {File} file - The image file to upload.
 * @returns {Promise<string>} The permanent ImgBB image URL.
 */
export const uploadToImgBB = async (file) => {
  if (!IMGBB_API_KEY) {
    throw new Error('ImgBB API key is not configured. Set VITE_IMGBB_API_KEY in your .env file.');
  }

  const formData = new FormData();
  formData.append('image', file);

  const response = await fetch(
    `https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`,
    { method: 'POST', body: formData }
  );

  const data = await response.json();

  if (!data.success) {
    throw new Error(data.error?.message || 'ImgBB upload failed');
  }

  // Return the direct image URL
  return data.data.url;
};
