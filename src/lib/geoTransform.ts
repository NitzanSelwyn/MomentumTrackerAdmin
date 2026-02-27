export interface CalibrationPoint {
  px: number; // pixel x in natural image dimensions
  py: number; // pixel y in natural image dimensions
  lat: number;
  lng: number;
}

/**
 * Builds a function that converts (lat, lng) → normalized image fractions {x: 0-1, y: 0-1}.
 * Uses a 2-point affine transform. With 3+ points it falls back to a least-squares fit.
 * Returns null if fewer than 2 calibration points or the transform is degenerate.
 */
export function buildTransform(
  points: CalibrationPoint[],
  imageWidth: number,
  imageHeight: number
): ((lat: number, lng: number) => { x: number; y: number } | null) | null {
  if (points.length < 2) return null;

  if (points.length === 2) {
    const [p1, p2] = points;
    const dLng = p2.lng - p1.lng;
    const dLat = p2.lat - p1.lat;

    if (Math.abs(dLng) < 1e-10 || Math.abs(dLat) < 1e-10) return null;

    const scaleX = (p2.px - p1.px) / dLng;
    const scaleY = (p2.py - p1.py) / dLat;

    return (lat: number, lng: number) => {
      const px = p1.px + (lng - p1.lng) * scaleX;
      const py = p1.py + (lat - p1.lat) * scaleY;
      return { x: px / imageWidth, y: py / imageHeight };
    };
  }

  // 3+ points: least-squares affine fit
  // Model: px = a*lng + b*lat + c, py = d*lng + e*lat + f
  // We solve the 3x3 system via normal equations
  const n = points.length;
  let slng = 0, slat = 0, slng2 = 0, slat2 = 0, slnglat = 0;
  let spxlng = 0, spxlat = 0, spx = 0;
  let spylng = 0, spylat = 0, spy = 0;

  for (const p of points) {
    slng += p.lng;
    slat += p.lat;
    slng2 += p.lng * p.lng;
    slat2 += p.lat * p.lat;
    slnglat += p.lng * p.lat;
    spxlng += p.px * p.lng;
    spxlat += p.px * p.lat;
    spx += p.px;
    spylng += p.py * p.lng;
    spylat += p.py * p.lat;
    spy += p.py;
  }

  // Build 3x3 matrix A and right-hand sides bx, by
  const A = [
    [slng2, slnglat, slng],
    [slnglat, slat2, slat],
    [slng, slat, n],
  ];
  const bx = [spxlng, spxlat, spx];
  const by = [spylng, spylat, spy];

  const coeffX = solveLinear3(A, bx);
  const coeffY = solveLinear3(A, by);

  if (!coeffX || !coeffY) return null;

  const [a, b, c] = coeffX;
  const [d, e, f] = coeffY;

  return (lat: number, lng: number) => {
    const px = a * lng + b * lat + c;
    const py = d * lng + e * lat + f;
    return { x: px / imageWidth, y: py / imageHeight };
  };
}

/** Gaussian elimination for 3x3 system Ax = b. Returns null if singular. */
function solveLinear3(
  A: number[][],
  b: number[]
): [number, number, number] | null {
  // Clone to avoid mutation
  const M = A.map((row) => [...row]);
  const v = [...b];
  const n = 3;

  for (let col = 0; col < n; col++) {
    // Find pivot
    let maxRow = col;
    for (let row = col + 1; row < n; row++) {
      if (Math.abs(M[row][col]) > Math.abs(M[maxRow][col])) maxRow = row;
    }
    [M[col], M[maxRow]] = [M[maxRow], M[col]];
    [v[col], v[maxRow]] = [v[maxRow], v[col]];

    if (Math.abs(M[col][col]) < 1e-12) return null;

    for (let row = col + 1; row < n; row++) {
      const factor = M[row][col] / M[col][col];
      for (let j = col; j < n; j++) {
        M[row][j] -= factor * M[col][j];
      }
      v[row] -= factor * v[col];
    }
  }

  // Back substitution
  const x = [0, 0, 0];
  for (let i = n - 1; i >= 0; i--) {
    x[i] = v[i];
    for (let j = i + 1; j < n; j++) {
      x[i] -= M[i][j] * x[j];
    }
    x[i] /= M[i][i];
  }

  return x as [number, number, number];
}
