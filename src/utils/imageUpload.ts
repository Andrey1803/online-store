const MAX_SIZE_MB = 8;

/** Без изменения — как в файле (миниатюры из Excel уже мелкие) */
export async function blobToDataUrlOriginal(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') resolve(reader.result);
      else reject(new Error('Не удалось прочитать изображение'));
    };
    reader.onerror = () => reject(reader.error ?? new Error('Ошибка чтения файла'));
    reader.readAsDataURL(blob);
  });
}

/** Импорт в каталог: оригинальный размер из файла, без canvas/JPEG */
export async function blobToStoredDataUrl(blob: Blob): Promise<string> {
  if (typeof FileReader === 'undefined') {
    const mime = blob.type || 'image/png';
    const buf = Buffer.from(await blob.arrayBuffer());
    return `data:${mime};base64,${buf.toString('base64')}`;
  }
  return blobToDataUrlOriginal(blob);
}

/** Ручная загрузка в админке */
export async function fileToImageDataUrl(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Выберите файл изображения (JPG, PNG, WebP)');
  }
  if (file.size > MAX_SIZE_MB * 1024 * 1024) {
    throw new Error(`Файл слишком большой (макс. ${MAX_SIZE_MB} МБ)`);
  }
  return blobToDataUrlOriginal(file);
}
