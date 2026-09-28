const TRANSFORMERS_URL =
  "https://cdn.jsdelivr.net/npm/@huggingface/transformers@4.3.0/+esm";

const MODELS = {
  background: "Xenova/modnet",
  enhance: "Xenova/swin2SR-classical-sr-x2-64",
};

let transformersPromise;
let backgroundPromise;
let enhancePromise;

async function transformers() {
  if (!transformersPromise) transformersPromise = import(TRANSFORMERS_URL);
  return transformersPromise;
}

async function backgroundPipeline() {
  if (!backgroundPromise) {
    backgroundPromise = transformers().then(({ pipeline }) =>
      pipeline("background-removal", MODELS.background, {
        dtype: "q8",
        revision: "fa2fa54",
      }),
    );
  }
  return backgroundPromise;
}

async function enhancePipeline() {
  if (!enhancePromise) {
    enhancePromise = transformers().then(({ pipeline }) =>
      pipeline("image-to-image", MODELS.enhance, { dtype: "q8" }),
    );
  }
  return enhancePromise;
}

async function outputBlob(value) {
  const image = Array.isArray(value) ? value[0] : value;
  if (!image) throw new Error("Photo model returned no image.");
  if (typeof image.toBlob === "function") {
    const blob = await image.toBlob();
    if (blob instanceof Blob && blob.size) return blob;
  }
  if (typeof image.toCanvas === "function") {
    const canvas = image.toCanvas();
    const blob = await new Promise((resolve, reject) =>
      canvas.toBlob(
        (value) =>
          value
            ? resolve(value)
            : reject(new Error("Unable to export processed photo.")),
        "image/png",
      ),
    );
    if (blob instanceof Blob && blob.size) return blob;
  }
  throw new Error("Photo model returned an unsupported image.");
}

self.onmessage = async (event) => {
  const { id, operation, blob } = event.data || {};
  if (!id || !(blob instanceof Blob)) return;
  const objectUrl = URL.createObjectURL(blob);
  try {
    if (operation === "background-remove") {
      const remove = await backgroundPipeline();
      const result = await remove(objectUrl);
      const output = await outputBlob(result);
      self.postMessage({ id, ok: true, blob: output });
      return;
    }
    if (operation === "enhance-x2") {
      const enhance = await enhancePipeline();
      const result = await enhance(objectUrl);
      const output = await outputBlob(result);
      self.postMessage({ id, ok: true, blob: output });
      return;
    }
    throw new Error("Unknown photo operation.");
  } catch {
    self.postMessage({
      id,
      ok: false,
      error:
        operation === "enhance-x2"
          ? "On-device 2× enhancement could not be completed. Keep the original and continue."
          : "Background removal could not be completed on this device. Keep the original and continue manually.",
    });
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
};
