import { apiFetch } from "./client";

/**
 * Screen oral lesion photo.
 * Quality gate checks blur and lighting, then classifier generates label & heatmap.
 * @param {object} params
 * @param {File|Blob} params.file - image file
 * @param {number|null} params.patient_id - optional patient ID
 * @param {boolean} params.send_to_doctor - whether to retain for clinician review
 */
export async function screenPhoto({ file, patient_id = null, send_to_doctor = true }) {
  const formData = new FormData();
  formData.append("file", file);
  if (patient_id !== null && patient_id !== undefined) {
    formData.append("patient_id", String(patient_id));
  }
  formData.append("send_to_doctor", String(send_to_doctor));

  return apiFetch("/photos/screen", {
    method: "POST",
    body: formData,
    timeoutMs: 60000,
  });
}

/**
 * Retrieve retained photo image for clinician review.
 * Returns Blob.
 */
export async function getPhotoImage(photoId) {
  return apiFetch(`/photos/${photoId}/image`, {
    method: "GET",
  });
}
