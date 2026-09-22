const TRANSFORMERS_URL =
  "https://cdn.jsdelivr.net/npm/@huggingface/transformers@4.3.0/+esm";
const MODEL_ID = "Xenova/modnet";
const MODEL_REVISION = "fa2fa54";

let pipelinePromise;

async function getPipeline() {
  if (!pipelinePromise) {
    pipelinePromise = import(TRANSFORMERS_URL).then(({ pipeline }) =>
      pipeline("background-removal", MODEL_ID, {
        dtype: "q8",
        revision: MODEL_REVISION,
      }),
    );
  }
  return pipelinePromise;
}

self.onmessage = async (event) => {
  const { id, blob } = event.data || {};
  if (!id || !(blob instanceof Blob)) return;
  const objectUrl = URL.createObjectURL(blob);
  try {
    const remove = await getPipeline();
    const output = await remove(objectUrl);
    const image = Array.isArray(output) ? output[0] : output;
    if (!image || typeof image.toBlob !== "function")
      throw new Error("Background model returned an invalid image.");
    const result = await image.toBlob();
    if (!(result instanceof Blob) || !result.size)
      throw new Error("Background model returned an empty image.");
    self.postMessage({ id, ok: true, blob: result });
  } catch {
    self.postMessage({
      id,
      ok: false,
      error:
        "Background removal could not be completed on this device. Keep the original photo and continue manually.",
    });
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
};
