/* =====================================================================
   AVELINE Admin – Imagens (Supabase Storage)
   ===================================================================== */

const BUCKET = (window.AVELINE_CONFIG && window.AVELINE_CONFIG.STORAGE_BUCKET) || 'produtos';
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
const MAX_IMAGE_SIDE = 1600;

/**
 * Reduz a imagem para no máximo 1600px e converte para WebP.
 * Se a conversão não ajudar (ou falhar), devolve o arquivo original.
 */
async function optimizeImage(file) {
  if (!/^image\/(jpeg|png|webp)$/.test(file.type) || !window.createImageBitmap) return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_IMAGE_SIDE / Math.max(bitmap.width, bitmap.height));
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    canvas.getContext('2d').drawImage(bitmap, 0, 0, width, height);
    if (bitmap.close) bitmap.close();

    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/webp', 0.92));
    if (!blob || blob.size >= file.size) return file;

    const baseName = file.name.replace(/\.[^.]+$/, '');
    return new File([blob], baseName + '.webp', { type: 'image/webp' });
  } catch (err) {
    console.warn('[AVELINE] Não foi possível otimizar a imagem, enviando original.', err);
    return file;
  }
}

/** Envia uma imagem e devolve a URL pública. */
async function uploadProductImage(file, folder) {
  if (!file.type.startsWith('image/')) throw new Error('O arquivo "' + file.name + '" não é uma imagem.');

  const optimized = await optimizeImage(file);
  if (optimized.size > MAX_UPLOAD_BYTES) {
    throw new Error('"' + file.name + '" tem mais de 5 MB mesmo após otimização.');
  }

  const ext = (optimized.name.split('.').pop() || 'jpg').toLowerCase();
  const random = Math.random().toString(36).slice(2, 8);
  const path = (slugify(folder) || 'sem-nome') + '/' + Date.now() + '-' + random + '.' + ext;

  const { error } = await window.sb.storage.from(BUCKET).upload(path, optimized, {
    cacheControl: '31536000',
    upsert: false,
    contentType: optimized.type,
  });
  if (error) throw error;

  const { data } = window.sb.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

/** Caminho dentro do bucket a partir da URL pública (null se for externa). */
function storagePathFromUrl(url) {
  if (!url) return null;
  const marker = '/storage/v1/object/public/' + BUCKET + '/';
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  return decodeURIComponent(url.slice(idx + marker.length).split('?')[0]);
}

/** Exclui do Storage as imagens informadas (ignora URLs externas). */
async function deleteStorageImages(urls) {
  const paths = Array.from(new Set((urls || []).map(storagePathFromUrl).filter(Boolean)));
  if (!paths.length) return;
  const { error } = await window.sb.storage.from(BUCKET).remove(paths);
  if (error) console.warn('[AVELINE] Falha ao remover imagens antigas do Storage.', error);
}
