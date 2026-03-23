import type { MainModule, VectorFloat32, VectorUInt8T } from "./build/main";

const copyFloatVector = (
  wasmModule: MainModule,
  vec: VectorFloat32,
): Float32Array => {
  const pointer = wasmModule.vf32_ptr(vec);
  const size = vec.size();
  const floatOffset = pointer / Float32Array.BYTES_PER_ELEMENT;

  return wasmModule.HEAPF32.slice(floatOffset, floatOffset + size);
};

/**
 * create new Float32Array from cpp FloatVector
 * @param wasmModule emscripten main module
 * @param vec cpp float32 vector
 * @returns copied float32 array
 */
export const floatVectorToFloatArray = (
  wasmModule: MainModule,
  vec: VectorFloat32,
  enhancementFunc: (n: number) => number = (n) => n,
): Float32Array => {
  const size = vec.size();
  const copiedBuffer = copyFloatVector(wasmModule, vec);

  if (enhancementFunc !== undefined) {
    for (let i = 0; i < size; i++) {
      copiedBuffer[i] = enhancementFunc(copiedBuffer[i]);
    }
  }

  return copiedBuffer;
};

export const floatVectorToFloatArrayExp = (
  wasmModule: MainModule,
  vec: VectorFloat32,
): Float32Array => {
  const copiedBuffer = copyFloatVector(wasmModule, vec);
  for (let i = 0; i < copiedBuffer.length; i++) {
    copiedBuffer[i] = Math.exp(copiedBuffer[i]);
  }
  return copiedBuffer;
};

export const floatVectorToFloatArraySigmoid = (
  wasmModule: MainModule,
  vec: VectorFloat32,
): Float32Array => {
  const copiedBuffer = copyFloatVector(wasmModule, vec);
  for (let i = 0; i < copiedBuffer.length; i++) {
    const value = copiedBuffer[i];
    copiedBuffer[i] = 1 / (1 + Math.exp(-value));
  }
  return copiedBuffer;
};

export const floatVectorToFloatArrayColor = (
  wasmModule: MainModule,
  vec: VectorFloat32,
  colorScale: number,
): Float32Array => {
  const copiedBuffer = copyFloatVector(wasmModule, vec);
  for (let i = 0; i < copiedBuffer.length; i++) {
    copiedBuffer[i] = copiedBuffer[i] * colorScale + 0.5;
  }
  return copiedBuffer;
};

export type PositionBounds = {
  min: [number, number, number];
  max: [number, number, number];
};

export const floatVectorToFloatArrayWithBounds = (
  wasmModule: MainModule,
  vec: VectorFloat32,
): {
  array: Float32Array;
  bounds: PositionBounds;
} => {
  const pointer = wasmModule.vf32_ptr(vec);
  const size = vec.size();
  const floatOffset = pointer / Float32Array.BYTES_PER_ELEMENT;
  const source = wasmModule.HEAPF32.subarray(floatOffset, floatOffset + size);
  const copiedBuffer = new Float32Array(size);

  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let minZ = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;
  let maxZ = Number.NEGATIVE_INFINITY;

  for (let i = 0; i < size; i += 3) {
    const x = source[i];
    const y = source[i + 1];
    const z = source[i + 2];

    copiedBuffer[i] = x;
    copiedBuffer[i + 1] = y;
    copiedBuffer[i + 2] = z;

    if (x < minX) {
      minX = x;
    }
    if (x > maxX) {
      maxX = x;
    }
    if (y < minY) {
      minY = y;
    }
    if (y > maxY) {
      maxY = y;
    }
    if (z < minZ) {
      minZ = z;
    }
    if (z > maxZ) {
      maxZ = z;
    }
  }

  return {
    array: copiedBuffer,
    bounds: {
      min: [minX, minY, minZ],
      max: [maxX, maxY, maxZ],
    },
  };
};

const clampToByte = (value: number): number => {
  if (value <= 0) {
    return 0;
  }
  if (value >= 255) {
    return 255;
  }
  return value;
};

export const floatVectorsToRgba8Array = (
  wasmModule: MainModule,
  colorsVec: VectorFloat32,
  alphasVec: VectorFloat32,
  colorScale: number,
): Uint8Array => {
  const colorsPointer = wasmModule.vf32_ptr(colorsVec);
  const alphaPointer = wasmModule.vf32_ptr(alphasVec);
  const colorCount = colorsVec.size();
  const alphaCount = alphasVec.size();
  const colorsOffset = colorsPointer / Float32Array.BYTES_PER_ELEMENT;
  const alphaOffset = alphaPointer / Float32Array.BYTES_PER_ELEMENT;
  const colors = wasmModule.HEAPF32.subarray(colorsOffset, colorsOffset + colorCount);
  const alphas = wasmModule.HEAPF32.subarray(alphaOffset, alphaOffset + alphaCount);
  const rgba = new Uint8Array(alphaCount * 4);

  for (let i = 0; i < alphaCount; i++) {
    rgba[i * 4] = clampToByte((colors[i * 3] * colorScale + 0.5) * 255.0);
    rgba[i * 4 + 1] = clampToByte(
      (colors[i * 3 + 1] * colorScale + 0.5) * 255.0,
    );
    rgba[i * 4 + 2] = clampToByte(
      (colors[i * 3 + 2] * colorScale + 0.5) * 255.0,
    );

    const alpha = alphas[i];
    rgba[i * 4 + 3] = clampToByte((1 / (1 + Math.exp(-alpha))) * 255.0);
  }

  return rgba;
};

export const uint8VecToArray = (
  wasmModule: MainModule,
  vec: VectorUInt8T,
): Uint8Array => {
  const pointer = wasmModule.vf32_ptr(vec);
  const size = vec.size();

  const buffer = new Uint8Array(wasmModule.HEAPU8.buffer, pointer, size);
  const copiedBuffer = new Uint8Array(buffer);

  return copiedBuffer;
};
