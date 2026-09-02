import * as THREE from "three";

export const FOLDER_W = 0.62;
export const FOLDER_D = 1.48;
export const FOLDER_BACK_H = 2.58;
export const FOLDER_FRONT_H = 1.32;
export const WALL = 0.034;
export const FOLDER_LIP = 0.075;

export const REPORT_H = 2.22;
export const REPORT_THICK = 0.05;
/** Jacket is 2:3, matching the cover canvas so type is not stretched. */
export const COVER_CANVAS_W = 512;
export const COVER_CANVAS_H = 768;
export const COVER_W = REPORT_H * (COVER_CANVAS_W / COVER_CANVAS_H);

const C_LEFT = "#8A6A4C";
const C_FRONT = "#6B4A34";
const C_DARK = "#5A3E2A";
const C_LABEL = "#F4EEE4";
const C_PAGES = "#F7F3EC";
const C_RINGS = "#1A120C";
const C_INK = "#1C140C";

/** Jacket colours — same pool as grouping.js; kept local so layout tests can import this module. */
const COVER_POOL = [
  "#F4EFE6",
  "#F4EFE6",
  "#F4EFE6",
  "#F4EFE6",
  "#F4EFE6",
  "#F4EFE6",
  "#E8C4B8",
  "#C5D4E6",
  "#D2E3C8",
  "#EDD99A",
];

function coverColorFor(reportNo) {
  const str = String(reportNo);
  let hash = 0;
  for (let i = 0; i < str.length; i += 1) {
    hash = (hash * 31 + str.charCodeAt(i)) | 0;
  }
  return COVER_POOL[Math.abs(hash) % COVER_POOL.length];
}

function lambert(color, extra = {}) {
  return new THREE.MeshLambertMaterial({
    color,
    flatShading: true,
    ...extra,
  });
}

function makeSideWallGeometry() {
  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  shape.lineTo(FOLDER_D, 0);
  shape.lineTo(FOLDER_D, FOLDER_FRONT_H);
  shape.lineTo(0, FOLDER_BACK_H);
  shape.closePath();
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: WALL,
    bevelEnabled: false,
    steps: 1,
  });
  geo.computeVertexNormals();
  return geo;
}

function makeFrontGeometry() {
  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  shape.lineTo(FOLDER_W, 0);
  shape.lineTo(FOLDER_W, FOLDER_FRONT_H);
  shape.lineTo(0, FOLDER_FRONT_H);
  shape.closePath();
  const hole = new THREE.Path();
  hole.absellipse(FOLDER_W / 2, 0.42, 0.095, 0.048, 0, Math.PI * 2, true);
  shape.holes.push(hole);
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: WALL,
    bevelEnabled: false,
    steps: 1,
    curveSegments: 16,
  });
  geo.computeVertexNormals();
  return geo;
}

export function createSharedResources() {
  const pagesGeo = new THREE.BoxGeometry(
    REPORT_THICK,
    REPORT_H * 0.98,
    COVER_W * 0.96,
  );
  const coverGeo = new THREE.PlaneGeometry(COVER_W, REPORT_H);
  const reportBackGeo = new THREE.BoxGeometry(0.008, REPORT_H, COVER_W);
  const ringGeo = new THREE.TorusGeometry(0.036, 0.012, 6, 12);
  const reportHitGeo = new THREE.BoxGeometry(0.16, REPORT_H * 1.08, COVER_W * 1.02);
  const reportHitMat = new THREE.MeshBasicMaterial({ visible: false });
  const pagesMat = lambert(C_PAGES);
  const reportBackMat = lambert("#E8E0D4");
  const ringMat = lambert(C_RINGS);

  const folderSideGeo = makeSideWallGeometry();
  const folderFrontGeo = makeFrontGeometry();
  const folderBottomGeo = new THREE.BoxGeometry(FOLDER_W, WALL, FOLDER_D);
  const folderBackGeo = new THREE.BoxGeometry(FOLDER_W, FOLDER_BACK_H, WALL);
  const folderLipGeo = new THREE.BoxGeometry(FOLDER_W, WALL * 1.35, FOLDER_LIP);
  const folderLabelGeo = new THREE.PlaneGeometry(0.44, 0.22);

  const folderMats = {
    left: lambert(C_LEFT),
    right: lambert(C_DARK),
    front: lambert(C_FRONT),
    back: lambert(C_DARK),
    bottom: lambert(C_DARK),
    lip: lambert(C_FRONT),
    label: lambert(C_LABEL),
  };

  return {
    pagesGeo,
    coverGeo,
    reportBackGeo,
    ringGeo,
    reportHitGeo,
    reportHitMat,
    pagesMat,
    reportBackMat,
    ringMat,
    folderSideGeo,
    folderFrontGeo,
    folderBottomGeo,
    folderBackGeo,
    folderLipGeo,
    folderLabelGeo,
    folderMats,
  };
}

export function disposeSharedResources(shared) {
  shared.pagesGeo.dispose();
  shared.coverGeo.dispose();
  shared.reportBackGeo.dispose();
  shared.ringGeo.dispose();
  shared.reportHitGeo.dispose();
  shared.reportHitMat.dispose();
  shared.pagesMat.dispose();
  shared.reportBackMat.dispose();
  shared.ringMat.dispose();
  shared.folderSideGeo.dispose();
  shared.folderFrontGeo.dispose();
  shared.folderBottomGeo.dispose();
  shared.folderBackGeo.dispose();
  shared.folderLipGeo.dispose();
  shared.folderLabelGeo.dispose();
  Object.values(shared.folderMats).forEach((mat) => mat.dispose());
}

function markFolder(mesh, folderId, pickable) {
  mesh.userData.kind = "folder";
  mesh.userData.folderId = folderId;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  pickable.push(mesh);
}

export function createFolderMesh(folderId, shared) {
  const group = new THREE.Group();
  const pickable = [];
  const { folderMats } = shared;

  const bottom = new THREE.Mesh(shared.folderBottomGeo, folderMats.bottom);
  bottom.position.set(FOLDER_W / 2, WALL / 2, FOLDER_D / 2);
  markFolder(bottom, folderId, pickable);
  group.add(bottom);

  const back = new THREE.Mesh(shared.folderBackGeo, folderMats.back);
  back.position.set(FOLDER_W / 2, FOLDER_BACK_H / 2, WALL / 2);
  markFolder(back, folderId, pickable);
  group.add(back);

  const left = new THREE.Mesh(shared.folderSideGeo, folderMats.left);
  left.rotation.y = -Math.PI / 2;
  left.position.set(WALL, 0, 0);
  markFolder(left, folderId, pickable);
  group.add(left);

  const right = new THREE.Mesh(shared.folderSideGeo, folderMats.right);
  right.rotation.y = -Math.PI / 2;
  right.position.set(FOLDER_W, 0, 0);
  markFolder(right, folderId, pickable);
  group.add(right);

  const front = new THREE.Mesh(shared.folderFrontGeo, folderMats.front);
  front.position.set(0, 0, FOLDER_D - WALL);
  markFolder(front, folderId, pickable);
  group.add(front);

  const lip = new THREE.Mesh(shared.folderLipGeo, folderMats.lip);
  lip.position.set(
    FOLDER_W / 2,
    FOLDER_FRONT_H - WALL * 0.2,
    FOLDER_D - WALL - FOLDER_LIP / 2,
  );
  markFolder(lip, folderId, pickable);
  group.add(lip);

  const plate = new THREE.Mesh(shared.folderLabelGeo, folderMats.label);
  plate.position.set(FOLDER_W / 2, 0.22, FOLDER_D + 0.003);
  plate.userData.kind = "folder";
  plate.userData.folderId = folderId;
  plate.castShadow = false;
  plate.receiveShadow = false;
  group.add(plate);
  pickable.push(plate);

  group.userData.kind = "folder";
  group.userData.folderId = folderId;
  return { group, pickable };
}

function wrapTitle(ctx, text, x, y, maxWidth, lineHeight, maxLines) {
  const words = String(text || "").split(/\s+/).filter(Boolean);
  if (!words.length) return;
  const lines = [];
  let line = "";
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
      if (lines.length === maxLines) break;
    } else {
      line = test;
    }
  }
  if (line && lines.length < maxLines) lines.push(line);
  if (lines.length === maxLines && words.join(" ").length > lines.join(" ").length) {
    let last = lines[maxLines - 1];
    while (last.length && ctx.measureText(`${last}…`).width > maxWidth) {
      last = last.slice(0, -1);
    }
    lines[maxLines - 1] = `${last}…`;
  }
  lines.forEach((entry, index) => {
    ctx.fillText(entry, x, y + index * lineHeight);
  });
}

export function createCoverTexture(report) {
  const jacket = coverColorFor(report.reportNo);
  const canvas = document.createElement("canvas");
  canvas.width = COVER_CANVAS_W;
  canvas.height = COVER_CANVAS_H;
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = jacket;
  ctx.fillRect(0, 0, COVER_CANVAS_W, COVER_CANVAS_H);

  ctx.fillStyle = "rgba(28, 20, 12, 0.08)";
  ctx.fillRect(0, 0, COVER_CANVAS_W, 92);

  ctx.strokeStyle = "rgba(28, 20, 12, 0.16)";
  ctx.lineWidth = 10;
  ctx.strokeRect(8, 8, COVER_CANVAS_W - 16, COVER_CANVAS_H - 16);

  ctx.fillStyle = C_INK;
  ctx.textAlign = "left";
  ctx.font = "bold 40px ui-sans-serif, system-ui, sans-serif";
  ctx.fillText(`No. ${report.reportNo}`, 32, 68);

  ctx.font = "bold 44px ui-sans-serif, system-ui, sans-serif";
  wrapTitle(ctx, report.title, 32, 168, 448, 54, 5);

  ctx.font = "28px ui-sans-serif, system-ui, sans-serif";
  ctx.fillText(String(report.year ?? ""), 32, 712);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

export function createReportMesh(report, shared) {
  const group = new THREE.Group();
  const pickable = [];
  const jacket = coverColorFor(report.reportNo);
  const texture = createCoverTexture(report);
  const bindZ = -COVER_W / 2 + 0.018;

  const pages = new THREE.Mesh(shared.pagesGeo, shared.pagesMat);
  pages.position.x = 0.006;
  pages.castShadow = true;
  pages.receiveShadow = true;
  group.add(pages);
  pickable.push(pages);

  const back = new THREE.Mesh(shared.reportBackGeo, shared.reportBackMat);
  back.position.x = 0.028;
  back.castShadow = true;
  group.add(back);
  pickable.push(back);

  const coverMat = new THREE.MeshBasicMaterial({
    map: texture,
    side: THREE.DoubleSide,
    toneMapped: false,
  });
  const cover = new THREE.Mesh(shared.coverGeo, coverMat);
  cover.rotation.y = -Math.PI / 2;
  cover.position.x = -0.03;
  cover.castShadow = false;
  cover.receiveShadow = false;
  group.add(cover);
  pickable.push(cover);

  const spine = new THREE.Mesh(
    new THREE.BoxGeometry(REPORT_THICK + 0.012, REPORT_H * 0.98, 0.022),
    lambert(jacket),
  );
  spine.position.set(0.002, 0, bindZ);
  spine.castShadow = true;
  group.add(spine);
  pickable.push(spine);

  for (let i = 0; i < 6; i += 1) {
    const ring = new THREE.Mesh(shared.ringGeo, shared.ringMat);
    ring.position.set(0, -REPORT_H / 2 + 0.28 + i * 0.34, bindZ);
    ring.rotation.y = Math.PI / 2;
    group.add(ring);
    pickable.push(ring);
  }

  const hit = new THREE.Mesh(shared.reportHitGeo, shared.reportHitMat);
  hit.position.x = 0;
  group.add(hit);
  pickable.push(hit);

  group.traverse((obj) => {
    if (obj.isMesh) {
      obj.userData.kind = "report";
      obj.userData.reportNo = report.reportNo;
    }
  });

  group.userData.kind = "report";
  group.userData.reportNo = report.reportNo;
  group.userData.texture = texture;
  group.userData.coverMat = coverMat;

  return { group, pickable, texture, coverMat };
}

export const PEEK_REST = 6;
export const PEEK_SELECT = 8;
export const PEEK_RISE = 0.68;
const PEEK_SLOT = 0.062;
const ROW_GAP_Z = 2.28;
export const ARCHIVE_ROWS = 3;

/** Cover-flow: max neighbours each side (13 cards). Smaller folders show every cover. */
export const CAROUSEL_RADIUS = 6;
export const CAROUSEL_SPACING = 0.72;
export const CAROUSEL_FORWARD = 4.4;
export const CAROUSEL_RECEDE = 0.18;
export const CAROUSEL_FEATURED_SCALE = 1.28;
/** Cover sits on local −X; +π/2 yaw faces it toward a camera on +Z. */
export const CAROUSEL_FACE_YAW = Math.PI / 2;
/** Neighbour tilt stays small enough that cover titles keep facing the camera. */
export const CAROUSEL_YAW_STEP = 0.12;
export const CAROUSEL_YAW_CAP = 0.42;

/** Rest peek spacing stays tight; selected folders fan wide enough to read titles. */
export function selectPeekSlot(count) {
  const n = Math.max(count, 1);
  if (n <= 4) return 0.11;
  if (n <= 8) return 0.14;
  if (n <= 12) return 0.165;
  return Math.max(0.125, Math.min(0.2, 2.7 / Math.max(n - 1, 1)));
}

/** Shortest signed slot distance on a ring of `count` items. */
export function carouselSignedOffset(slotIndex, featuredIndex, count) {
  if (count <= 0) return 0;
  let delta = slotIndex - featuredIndex;
  const half = count / 2;
  if (delta > half) delta -= count;
  if (delta <= -half) delta += count;
  return delta;
}

export function stepCarouselIndex(index, delta, count, { wrap = true } = {}) {
  if (count <= 0) return 0;
  const current = ((Number(index) || 0) % count + count) % count;
  if (!wrap) {
    return Math.min(count - 1, Math.max(0, current + delta));
  }
  return ((current + delta) % count + count) % count;
}

export function carouselAnnouncement(index, count, title) {
  const n = Math.max(0, count);
  if (n === 0) return "No reports in this folder";
  const i = Math.min(n, Math.max(1, index + 1));
  return `Report ${i} of ${n}, ${title || "Untitled"}`;
}

/**
 * Filed folders only pick reports from the open sleeve. Scatter / unfiled
 * reports stay clickable.
 */
export function reportHitAllowed({ filed, selectedFolderId, folderId }) {
  if (!filed) return true;
  if (!selectedFolderId) return false;
  return folderId === selectedFolderId;
}

/** How many cards sit each side of the featured cover for a folder of `count`. */
export function carouselVisibleRadius(count) {
  const n = Math.max(1, Number(count) || 1);
  return Math.min(Math.ceil((n - 1) / 2), CAROUSEL_RADIUS);
}

export function carouselSpacing(count) {
  const visible = carouselVisibleRadius(count) * 2 + 1;
  const face = COVER_W;
  if (visible <= 5) return face * 0.7;
  if (visible <= 9) return face * 0.52;
  return face * 0.42;
}

export function carouselSpan(count) {
  const radius = carouselVisibleRadius(count);
  const featuredW = COVER_W * CAROUSEL_FEATURED_SCALE;
  return radius * 2 * carouselSpacing(count) + featuredW;
}

/** Half-angle of the cover-flow arc, in radians. */
export function carouselArc(count) {
  const radius = carouselVisibleRadius(count);
  if (radius <= 2) return 0.46;
  if (radius <= 4) return 0.64;
  return 0.82;
}

/** Ring radius so the wing x matches the previous linear span. */
export function carouselRing(count) {
  const slots = carouselVisibleRadius(count);
  if (slots <= 0) return 1;
  const half = slots * carouselSpacing(count);
  const s = Math.sin(carouselArc(count));
  return s > 0.08 ? half / s : half;
}

/** Shortest signed turn from `from` to `to`, in (−π, π]. */
export function shortestAngleDelta(from, to) {
  let delta = to - from;
  while (delta > Math.PI) delta -= Math.PI * 2;
  while (delta < -Math.PI) delta += Math.PI * 2;
  return delta;
}

/**
 * Local cover-flow pose relative to the carousel origin.
 * Offset 0 is featured (large, facing camera); neighbours sit on a circular arc.
 */
export function computeCarouselPose(offset, count = CAROUSEL_RADIUS * 2 + 1) {
  const abs = Math.abs(offset);
  const slots = carouselVisibleRadius(count);
  const arc = carouselArc(count);
  const ring = carouselRing(count);
  const t = slots <= 0 ? 0 : Math.max(-1, Math.min(1, offset / slots));
  const theta = t * arc;
  const yawTilt = Math.sign(theta) * Math.min(Math.abs(theta) * 0.7, CAROUSEL_YAW_CAP);
  const maxRecede = Math.max(0.12, CAROUSEL_FORWARD - FOLDER_D - 0.55);
  return {
    x: ring * Math.sin(theta),
    y: REPORT_H * 0.5 + (abs === 0 ? 0.22 : 0.08),
    z: Math.max(-maxRecede, ring * (Math.cos(theta) - 1)),
    rx: 0,
    ry: CAROUSEL_FACE_YAW - yawTilt,
    scale: abs === 0 ? CAROUSEL_FEATURED_SCALE : Math.max(0.74, 1 - abs * 0.05),
    visible: abs <= slots,
    featured: offset === 0,
  };
}

export function folderSpacing(count) {
  if (count <= 3) return 1.72;
  if (count <= 4) return 1.42;
  if (count <= 5) return 1.22;
  return 1.05;
}

export function layoutColumns(folderCount, twoRows) {
  if (!twoRows) return folderCount;
  return Math.ceil(folderCount / 2);
}

function folderGridPosition(index, n, twoRows) {
  if (!twoRows) {
    const spacing = folderSpacing(n);
    return {
      x: -((n - 1) * spacing) / 2 + index * spacing,
      y: 0,
      z: 0,
      spacing,
    };
  }
  const cols = Math.ceil(n / 2);
  const row = index < cols ? 0 : 1;
  const col = row === 0 ? index : index - cols;
  const rowCount = row === 0 ? Math.min(cols, n) : n - cols;
  const spacing = folderSpacing(Math.max(rowCount, 1));
  return {
    x: -((rowCount - 1) * spacing) / 2 + col * spacing,
    y: 0,
    z: row === 0 ? -ROW_GAP_Z / 2 : ROW_GAP_Z / 2,
    spacing,
  };
}

export function shouldUseTwoRows(width, height, previous = false) {
  const w = Math.max(width, 1);
  const h = Math.max(height, 1);
  const ratio = w / h;
  if (previous) {
    return w < 760 || ratio < 1.28;
  }
  return w < 700 || ratio < 1.15;
}

export function layoutExtents(layout) {
  const positions = Object.values(layout.folderPos);
  if (!positions.length) {
    return {
      minX: -FOLDER_W,
      maxX: FOLDER_W,
      minZ: 0,
      maxZ: FOLDER_D,
      width: FOLDER_W * 2,
      depth: FOLDER_D,
    };
  }
  let minX = Infinity;
  let maxX = -Infinity;
  let minZ = Infinity;
  let maxZ = -Infinity;
  for (const pos of positions) {
    minX = Math.min(minX, pos.x);
    maxX = Math.max(maxX, pos.x + FOLDER_W);
    minZ = Math.min(minZ, pos.z);
    maxZ = Math.max(maxZ, pos.z + FOLDER_D);
  }
  return {
    minX,
    maxX,
    minZ,
    maxZ,
    width: maxX - minX,
    depth: maxZ - minZ,
  };
}

/** World-space origin for the selected-folder carousel, in front of the folder row. */
export function carouselOrigin(layout) {
  const ext = layoutExtents(layout);
  return {
    x: (ext.minX + ext.maxX) / 2,
    y: 0,
    z: (ext.minZ + ext.maxZ) / 2 + CAROUSEL_FORWARD,
  };
}

export function computeLayout(folders, { twoRows = false } = {}) {
  const n = folders.length;
  const folderPos = {};
  const reportPos = {};
  let spacing = folderSpacing(layoutColumns(n, twoRows));

  folders.forEach((folder, index) => {
    const grid = folderGridPosition(index, n, twoRows);
    spacing = grid.spacing;
    folderPos[folder.id] = { x: grid.x, y: grid.y, z: grid.z, folder };
    const count = folder.reports.length;
    const restN = Math.min(PEEK_REST, count);
    const fanSlot = selectPeekSlot(count);
    folder.reports.forEach((report, slotIndex) => {
      const u = count <= 1 ? 0 : slotIndex - (count - 1) / 2;
      const packRest = (shown) =>
        FOLDER_W * 0.5 + (slotIndex - (shown - 1) / 2) * PEEK_SLOT;
      reportPos[report.reportNo] = {
        x: slotIndex < restN ? packRest(restN) : FOLDER_W * 0.5,
        selectX: FOLDER_W * 0.5 + u * fanSlot,
        y: WALL + REPORT_H * 0.42,
        riseY: WALL + REPORT_H * 0.42 + PEEK_RISE,
        z: FOLDER_D / 2,
        selectZ: FOLDER_D / 2 + Math.abs(u) * 0.035,
        rx: 0.04,
        folderId: folder.id,
        slotIndex,
        count,
        visibleAtRest: slotIndex < PEEK_REST,
        visibleOnSelect: true,
      };
    });
  });

  return { folderPos, reportPos, folders, spacing, count: n, twoRows };
}

export function computeArchiveLayout(list) {
  const n = list.length;
  const reportPos = {};
  if (n === 0) {
    return { reportPos, span: 1, minX: 0, maxX: 0, minZ: 0, maxZ: 0, rows: ARCHIVE_ROWS };
  }

  const rows = ARCHIVE_ROWS;
  const rowCounts = new Array(rows).fill(Math.floor(n / rows));
  for (let extra = n % rows, i = 0; i < extra; i += 1) {
    rowCounts[i] += 1;
  }

  const colGap = REPORT_THICK + 0.052;
  const rowGap = 0.62;
  let minX = Infinity;
  let maxX = -Infinity;
  let minZ = Infinity;
  let maxZ = -Infinity;
  let cursor = 0;

  for (let row = 0; row < rows; row += 1) {
    const count = rowCounts[row];
    const span = Math.max(count - 1, 0) * colGap;
    const zBase = (row - (rows - 1) / 2) * rowGap;
    const stagger = ((row % 2) - 0.5) * colGap * 0.42;
    for (let col = 0; col < count; col += 1) {
      const report = list[cursor];
      cursor += 1;
      if (!report) continue;
      const u = count <= 1 ? 0 : col / (count - 1) - 0.5;
      const x = -span / 2 + col * colGap + stagger;
      const z = zBase + u * u * 0.78;
      reportPos[report.reportNo] = {
        x,
        y: REPORT_H * 0.5,
        z,
        rx: -0.03,
        ry: 0.18 + u * 0.92,
        row,
        col,
      };
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minZ = Math.min(minZ, z);
      maxZ = Math.max(maxZ, z);
    }
  }

  return {
    reportPos,
    span: Math.max(maxX - minX, 1),
    minX,
    maxX,
    minZ,
    maxZ,
    rows,
  };
}
