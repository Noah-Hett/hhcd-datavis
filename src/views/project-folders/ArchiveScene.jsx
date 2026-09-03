import { useEffect, useRef } from "react";
import * as THREE from "three";
import { reports } from "../../data/index.js";
import { GROUPINGS, groupReports } from "./grouping.js";
import {
  FOLDER_BACK_H,
  FOLDER_D,
  FOLDER_W,
  REPORT_H,
  CAROUSEL_FEATURED_SCALE,
  carouselOrigin,
  carouselSignedOffset,
  carouselSpan,
  computeArchiveLayout,
  computeCarouselPose,
  computeLayout,
  createFolderMesh,
  createReportMesh,
  createSharedResources,
  disposeSharedResources,
  layoutExtents,
  reportHitAllowed,
  shortestAngleDelta,
  shouldUseTwoRows,
} from "./geometry.js";

function easeInOut(t) {
  const x = Math.min(1, Math.max(0, t));
  return x < 0.5 ? 2 * x * x : -1 + (4 - 2 * x) * x;
}

function sideSign(x) {
  return x < 0 ? -1 : 1;
}

const EXIT_X = 12;
const MORPH_MS = 900;
const CAM_FOV = 22;
const TAP_SLOP = 18;
/** Same as `--archive-bg` / `--bg` so the canvas matches the page, not a darker well. */
const SCENE_CLEAR = "#c9dce0";
const SELECT_SCALE = 1.06;
const REST_SCALE = 0.86;
const SELECT_FORWARD = 0.28;
const REST_RECEDE = 1.05;
const FOLLOW_SELECTED = 0.07;
const FOLLOW_FOLDER = 0.06;
const FOLLOW_CAROUSEL = 0.12;
const FOLLOW_REPORT = 0.2;

function folderTarget(fromLayout, toLayout, id, entry) {
  const from = fromLayout.folderPos[id];
  const to = toLayout.folderPos[id];
  if (to) {
    entry.restX = to.x;
    entry.restZ = to.z;
  } else if (from) {
    entry.restX = from.x;
    entry.restZ = from.z;
  }

  if (to) {
    return { x: to.x, y: 0, z: to.z, meta: to.folder, onStage: true };
  }
  const restX = entry.restX ?? 0;
  const restZ = entry.restZ ?? 0;
  return {
    x: restX + sideSign(restX) * EXIT_X,
    y: 0,
    z: restZ,
    meta: from?.folder ?? null,
    onStage: false,
  };
}

function fitRowCamera(layout, aspect, outPos, outLook) {
  const ext = layoutExtents(layout);
  const padX = 1.15;
  const padZ = 0.95;
  const worldW = ext.width + padX * 2;
  const worldH = FOLDER_BACK_H + 1.55;
  const worldD = ext.depth + padZ * 2;
  const fov = CAM_FOV * (Math.PI / 180);
  const distX = worldW / 2 / (Math.tan(fov / 2) * Math.max(aspect, 0.4));
  const distY = worldH / 2 / Math.tan(fov / 2);
  const distZ = worldD / 2 / Math.tan(fov / 2);
  const dist = Math.max(distX, distY, distZ, 7.2) * 1.08;

  outLook.set((ext.minX + ext.maxX) / 2, 1.18, (ext.minZ + ext.maxZ) / 2);
  outPos.set(outLook.x - 0.36 * dist, outLook.y + 0.5 * dist, outLook.z + dist);
}

function folderReportCount(layout, folderId) {
  const meta = layout.folderPos[folderId]?.folder;
  return meta?.count ?? meta?.reports?.length ?? 7;
}

function fitCarouselCamera(layout, aspect, folderId, outPos, outLook) {
  const origin = carouselOrigin(layout);
  const span = carouselSpan(folderReportCount(layout, folderId));
  const fov = CAM_FOV * (Math.PI / 180);
  const a = Math.max(aspect, 0.5);
  const worldW = span * 1.02;
  const worldH = REPORT_H * CAROUSEL_FEATURED_SCALE + 0.5;
  const distX = worldW / 2 / (Math.tan(fov / 2) * a);
  const distY = worldH / 2 / Math.tan(fov / 2);
  const dist = Math.max(distX, distY, 3.2) * 0.8;

  outLook.set(origin.x, REPORT_H * 0.56, origin.z);
  outPos.set(origin.x - 0.04 * dist, outLook.y + 0.12 * dist, origin.z + dist);
}

function fitArchiveCamera(archive, aspect, outPos, outLook) {
  const a = Math.min(2.15, Math.max(0.72, Number.isFinite(aspect) && aspect > 0 ? aspect : 1.6));
  const lookX = ((archive.minX ?? 0) + (archive.maxX ?? 0)) / 2;
  const lookZ = ((archive.minZ ?? 0) + (archive.maxZ ?? 0)) / 2;
  outLook.set(lookX, REPORT_H * 0.48, lookZ);
  const fov = CAM_FOV * (Math.PI / 180);
  const worldW = (archive.span ?? 1) + 1.8;
  const worldH = REPORT_H + 0.7;
  const worldD = (archive.maxZ ?? 0) - (archive.minZ ?? 0) + 1.15;
  const distX = worldW / 2 / (Math.tan(fov / 2) * a);
  const distY = worldH / 2 / Math.tan(fov / 2);
  const distZ = worldD / 2 / Math.tan(fov / 2);
  const dist = Math.max(distX, distY, distZ, 7.6) * 1.1;
  outPos.set(lookX - 0.18 * dist, REPORT_H * 0.72 + 0.28 * dist, lookZ + dist);
}

function fitShadow(sun, layout) {
  const ext = layoutExtents(layout);
  const pad = 3.2;
  sun.shadow.camera.left = ext.minX - pad;
  sun.shadow.camera.right = ext.maxX + pad;
  sun.shadow.camera.top = Math.max(ext.depth, 8) + pad;
  sun.shadow.camera.bottom = -Math.max(ext.depth, 6) - pad;
  sun.shadow.camera.updateProjectionMatrix();
  sun.target.position.set((ext.minX + ext.maxX) / 2, 0, (ext.minZ + ext.maxZ) / 2);
  sun.target.updateMatrixWorld();
}

export default function ArchiveScene({
  grouping,
  organize = 1,
  reduceMotion,
  selectedFolderId,
  selectedReportNo,
  carouselIndex = 0,
  onSelectFolder,
  onSelectReport,
  onCarouselIndexChange,
  onWebglError,
}) {
  const mountRef = useRef(null);
  const labelRef = useRef(null);
  const onErrorRef = useRef(onWebglError);
  const groupingRef = useRef(grouping);
  const organizeRef = useRef(organize);
  const reduceRef = useRef(reduceMotion);
  const selectedFolderRef = useRef(selectedFolderId);
  const selectedReportRef = useRef(selectedReportNo);
  const carouselIndexRef = useRef(carouselIndex);
  const onFolderRef = useRef(onSelectFolder);
  const onReportRef = useRef(onSelectReport);
  const onCarouselIndexRef = useRef(onCarouselIndexChange);

  groupingRef.current = grouping;
  organizeRef.current = organize;
  reduceRef.current = reduceMotion;
  selectedFolderRef.current = selectedFolderId;
  selectedReportRef.current = selectedReportNo;
  carouselIndexRef.current = carouselIndex;
  onFolderRef.current = onSelectFolder;
  onReportRef.current = onSelectReport;
  onCarouselIndexRef.current = onCarouselIndexChange;
  onErrorRef.current = onWebglError;

  useEffect(() => {
    const mount = mountRef.current;
    const labelRoot = labelRef.current;
    if (!mount || !labelRoot) return undefined;

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    } catch {
      onErrorRef.current?.();
      return undefined;
    }

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(SCENE_CLEAR);

    const camera = new THREE.PerspectiveCamera(CAM_FOV, 16 / 9, 0.1, 120);

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(Math.max(1, mount.clientWidth), Math.max(1, mount.clientHeight), false);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.BasicShadowMap;
    renderer.domElement.setAttribute("aria-hidden", "true");
    renderer.domElement.setAttribute("tabindex", "-1");
    renderer.domElement.style.display = "block";
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    renderer.domElement.style.touchAction = "manipulation";
    mount.appendChild(renderer.domElement);

    const hemi = new THREE.HemisphereLight("#f3f6f4", "#c4b29a", 0.38);
    scene.add(hemi);
    const sun = new THREE.DirectionalLight("#ffffff", 1.85);
    sun.position.set(-8, 14, 6);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.near = 1;
    sun.shadow.camera.far = 42;
    sun.shadow.bias = -0.0008;
    sun.shadow.normalBias = 0.02;
    sun.shadow.radius = 0;
    scene.add(sun);
    scene.add(sun.target);

    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(48, 48),
      new THREE.ShadowMaterial({ color: "#1c140c", opacity: 0.22 }),
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = 0;
    ground.receiveShadow = true;
    scene.add(ground);

    const layouts = {};
    for (const item of GROUPINGS) {
      const foldersFor = groupReports(item.id);
      layouts[item.id] = {
        single: computeLayout(foldersFor, { twoRows: false }),
        two: computeLayout(foldersFor, { twoRows: true }),
      };
    }

    const allFolderIds = new Set();
    for (const pair of Object.values(layouts)) {
      for (const id of Object.keys(pair.single.folderPos)) allFolderIds.add(id);
      for (const id of Object.keys(pair.two.folderPos)) allFolderIds.add(id);
    }

    const shared = createSharedResources();
    const folders = new Map();
    const labelNodes = new Map();
    for (const id of allFolderIds) {
      const { group, pickable } = createFolderMesh(id, shared);
      scene.add(group);
      folders.set(id, {
        group,
        pickable,
        id,
        parked: true,
        restX: 0,
        restZ: 0,
      });

      const el = document.createElement("div");
      el.className = "scene-label";
      el.setAttribute("aria-hidden", "true");
      labelRoot.appendChild(el);
      labelNodes.set(id, el);
    }

    const reportEntries = [];
    const pickables = [];

    for (const folder of folders.values()) {
      pickables.push(...folder.pickable);
    }

    const archiveLayout = computeArchiveLayout(reports);
    const startLayout = layouts.theme.single;
    for (const report of reports) {
      const { group, pickable, texture, coverMat } = createReportMesh(
        report,
        shared,
      );
      const loose = archiveLayout.reportPos[report.reportNo];
      scene.add(group);
      if (loose) {
        group.position.set(loose.x, loose.y, loose.z);
        group.rotation.y = loose.ry ?? 0;
        group.visible = true;
      } else {
        group.visible = false;
      }
      pickables.push(...pickable);
      const entry = {
        report,
        group,
        pickable,
        texture,
        coverMat,
        id: report.reportNo,
        folderId: startLayout.reportPos[report.reportNo]?.folderId ?? null,
      };
      reportEntries.push(entry);
    }

    const featuredLabel = document.createElement("div");
    featuredLabel.className = "scene-label is-report is-featured";
    featuredLabel.setAttribute("aria-hidden", "true");
    labelRoot.appendChild(featuredLabel);

    for (const [id, entry] of folders) {
      const start = startLayout.folderPos[id];
      entry.parked = true;
      entry.group.visible = false;
      entry.group.position.set(EXIT_X, 0, start?.z ?? 0);
      if (start) {
        entry.restX = start.x;
        entry.restZ = start.z;
      }
    }

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const camPos = new THREE.Vector3();
    const camLook = new THREE.Vector3();
    const introPos = new THREE.Vector3();
    const introLook = new THREE.Vector3();
    const destPos = new THREE.Vector3();
    const destLook = new THREE.Vector3();
    const projected = new THREE.Vector3();
    const parentScratch = new THREE.Vector3();

    const reparentKeepWorldPosition = (obj, parent) => {
      if (obj.parent === parent) return;
      obj.updateWorldMatrix(true, false);
      obj.getWorldPosition(parentScratch);
      parent.add(obj);
      parent.updateWorldMatrix(true, false);
      parent.worldToLocal(parentScratch);
      obj.position.copy(parentScratch);
      obj.rotation.x = 0;
      obj.rotation.z = 0;
    };

    const followYaw = (obj, target, t) => {
      obj.rotation.x = 0;
      obj.rotation.z = 0;
      const delta = shortestAngleDelta(obj.rotation.y, target);
      if (Math.abs(delta) > Math.PI / 2) {
        obj.rotation.y = target;
        return;
      }
      obj.rotation.y += delta * t;
    };

    fitArchiveCamera(archiveLayout, camera.aspect, introPos, introLook);
    fitRowCamera(startLayout, camera.aspect, destPos, destLook);
    camera.position.copy(introPos);
    camera.lookAt(introLook);
    fitShadow(sun, startLayout);

    let hovered = null;
    let dragging = false;
    let downX = 0;
    let downY = 0;
    let raf = 0;
    let twoRows = shouldUseTwoRows(
      window.innerWidth,
      window.innerHeight,
    );
    let transFrom = "theme";
    let transTo = "theme";
    let transStart = 0;
    let lastShadowKey = "";

    const setPointer = (event) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    };

    const hitTest = () => {
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(pickables, false);
      for (const hit of hits) {
        const data = hit.object.userData;
        if (!data?.kind) continue;
        let ancestor = hit.object;
        let hidden = false;
        while (ancestor) {
          if (ancestor.visible === false) {
            hidden = true;
            break;
          }
          ancestor = ancestor.parent;
        }
        if (hidden) continue;
        if (data.kind === "report") {
          const pose = layouts[transTo][twoRows ? "two" : "single"].reportPos[
            data.reportNo
          ];
          const filed = organizeRef.current >= 0.95 || reduceRef.current;
          if (!filed) return hit;
          if (!pose) continue;
          if (
            !reportHitAllowed({
              filed,
              selectedFolderId: selectedFolderRef.current,
              folderId: pose.folderId,
            })
          ) {
            continue;
          }
          return hit;
        }
        if (data.kind === "folder") {
          if (organizeRef.current < 0.95 && !reduceRef.current) continue;
          return hit;
        }
      }
      return null;
    };

    const onPointerDown = (event) => {
      dragging = false;
      downX = event.clientX;
      downY = event.clientY;
    };

    const onPointerMove = (event) => {
      if (
        event.buttons &&
        (event.clientX - downX) ** 2 + (event.clientY - downY) ** 2 >
          TAP_SLOP ** 2
      ) {
        dragging = true;
      }
      setPointer(event);
      const hit = hitTest();
      const next = hit?.object.userData ?? null;
      hovered = next;
      const over =
        next?.kind === "report" || next?.kind === "folder" ? "pointer" : "";
      renderer.domElement.style.cursor = over;
    };

    const onPointerUp = (event) => {
      if (dragging) return;
      if (
        (event.clientX - downX) ** 2 + (event.clientY - downY) ** 2 >
        TAP_SLOP ** 2
      ) {
        return;
      }
      setPointer(event);
      const hit = hitTest();
      const data = hit?.object.userData;
      if (data?.kind === "report") {
        const selected = selectedFolderRef.current;
        const pose =
          layouts[transTo][twoRows ? "two" : "single"].reportPos[data.reportNo];
        if (
          selected &&
          pose?.folderId === selected &&
          pose.slotIndex !== carouselIndexRef.current
        ) {
          onCarouselIndexRef.current?.(pose.slotIndex);
        } else {
          onReportRef.current(data.reportNo);
        }
      } else if (data?.kind === "folder") {
        onFolderRef.current(data.folderId);
      } else {
        onFolderRef.current(null);
      }
    };

    renderer.domElement.addEventListener("pointerdown", onPointerDown);
    renderer.domElement.addEventListener("pointermove", onPointerMove);
    renderer.domElement.addEventListener("pointerup", onPointerUp);

    let lastW = 0;
    let lastH = 0;
    let resizeRaf = 0;
    let sizeDirty = false;
    const applyRowMode = () => {
      twoRows = shouldUseTwoRows(
        window.innerWidth,
        window.innerHeight,
        twoRows,
      );
    };
    const applySize = () => {
      const w = Math.round(mount.clientWidth);
      const h = Math.round(mount.clientHeight);
      applyRowMode();
      if (w < 48 || h < 48) return;
      if (w === lastW && h === lastH) return;
      lastW = w;
      lastH = h;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      if (renderer.getPixelRatio() !== pixelRatio) {
        renderer.setPixelRatio(pixelRatio);
      }
      renderer.setSize(w, h, false);
      sizeDirty = true;
    };
    const resize = () => {
      if (resizeRaf) return;
      resizeRaf = requestAnimationFrame(() => {
        resizeRaf = 0;
        applySize();
      });
    };
    const ro = new ResizeObserver(resize);
    ro.observe(mount);
    window.addEventListener("resize", resize);
    applySize();

    const onContextLost = (event) => {
      event.preventDefault();
      onErrorRef.current?.();
    };
    renderer.domElement.addEventListener("webglcontextlost", onContextLost);

    const attachToFolder = (entry, folderId, pose, { snap = false } = {}) => {
      const folderEntry = folders.get(folderId);
      if (!folderEntry || !pose) return;
      if (entry.group.parent !== folderEntry.group) {
        if (snap) {
          folderEntry.group.add(entry.group);
          entry.group.position.set(pose.x, pose.y, pose.z);
          entry.group.rotation.set(pose.rx ?? 0, 0, 0);
          entry.group.scale.setScalar(1);
        } else {
          reparentKeepWorldPosition(entry.group, folderEntry.group);
        }
        entry.folderId = folderId;
      }
    };

    const tick = (now) => {
      raf = requestAnimationFrame(tick);
      if (sun.shadow.map && !sun.userData.hardened) {
        sun.shadow.map.texture.magFilter = THREE.NearestFilter;
        sun.shadow.map.texture.minFilter = THREE.NearestFilter;
        sun.userData.hardened = true;
      }

      const reduce = reduceRef.current;
      const nextGrouping = groupingRef.current;
      if (nextGrouping !== transTo) {
        transFrom = transTo;
        transTo = nextGrouping;
        transStart = now;
      }

      const elapsed = now - transStart;
      const blend = reduce
        ? 1
        : easeInOut(transFrom === transTo ? 1 : Math.min(1, elapsed / MORPH_MS));
      const shuffling = transFrom !== transTo && blend < 1;
      const rowKey = twoRows ? "two" : "single";
      const fromLayout = layouts[transFrom]?.[rowKey];
      const toLayout = layouts[transTo]?.[rowKey];
      if (!fromLayout || !toLayout) {
        renderer.render(scene, camera);
        return;
      }
      const selectedFolder = selectedFolderRef.current;
      const selectedReport = selectedReportRef.current;
      const filed = reduce
        ? 1
        : easeInOut(Math.min(1, Math.max(0, organizeRef.current)));
      const enter = easeInOut(Math.max(0, Math.min(1, (filed - 0.32) / 0.5)));
      const camT = easeInOut(Math.max(0, Math.min(1, (filed - 0.08) / 0.82)));
      const shelved = filed >= 0.995;

      fitArchiveCamera(archiveLayout, camera.aspect, introPos, introLook);
      if (selectedFolder && shelved && !shuffling) {
        fitCarouselCamera(toLayout, camera.aspect, selectedFolder, destPos, destLook);
      } else {
        fitRowCamera(toLayout, camera.aspect, destPos, destLook);
      }
      if (!shelved) {
        camPos.lerpVectors(introPos, destPos, camT);
        camLook.lerpVectors(introLook, destLook, camT);
        camera.position.copy(camPos);
        camera.lookAt(camLook);
      } else {
        camPos.copy(destPos);
        camLook.copy(destLook);
        if (reduce || sizeDirty) {
          camera.position.copy(camPos);
        } else {
          camera.position.lerp(camPos, 0.08);
        }
        camera.lookAt(camLook);
      }
      sizeDirty = false;

      const shadowKey = `${transTo}:${rowKey}:${toLayout.count}:${selectedFolder ?? ""}`;
      if (shadowKey !== lastShadowKey) {
        fitShadow(sun, toLayout);
        lastShadowKey = shadowKey;
      }

      const stageOrigin =
        selectedFolder && shelved && !shuffling
          ? carouselOrigin(toLayout)
          : null;

      for (const [id, entry] of folders) {
        const slide = folderTarget(fromLayout, toLayout, id, entry);
        const label = labelNodes.get(id);
        const selected =
          shelved && id === selectedFolder && slide.onStage && !shuffling;
        const rowBackground =
          shelved && Boolean(selectedFolder) && !selected && slide.onStage && !shuffling;
        let targetX = slide.x;
        const targetY = 0;
        const targetZ = selected
          ? slide.z + SELECT_FORWARD
          : rowBackground
            ? slide.z - REST_RECEDE
            : slide.z;
        const targetYaw = 0;
        const targetScale = selected
          ? SELECT_SCALE
          : rowBackground
            ? REST_SCALE
            : 1;
        if (!shelved && slide.onStage) {
          targetX = slide.x + sideSign(slide.x || 1) * EXIT_X * (1 - enter);
        }
        const follow = reduce ? 1 : selected ? FOLLOW_SELECTED : FOLLOW_FOLDER;
        const onStage = slide.onStage && (shelved || enter > 0);

        if (onStage) {
          if (entry.parked) {
            entry.group.position.set(
              targetX + sideSign(targetX) * EXIT_X,
              targetY,
              targetZ,
            );
            entry.parked = false;
            entry.group.visible = true;
          }
          if (reduce) {
            entry.group.position.set(targetX, targetY, targetZ);
            entry.group.rotation.y = targetYaw;
            entry.group.scale.setScalar(targetScale);
          } else {
            entry.group.position.x += (targetX - entry.group.position.x) * follow;
            entry.group.position.y += (targetY - entry.group.position.y) * follow;
            entry.group.position.z += (targetZ - entry.group.position.z) * follow;
            entry.group.rotation.y += (targetYaw - entry.group.rotation.y) * follow;
            const s = entry.group.scale.x + (targetScale - entry.group.scale.x) * follow;
            entry.group.scale.setScalar(s);
          }
        } else if (reduce) {
          entry.group.position.set(targetX, targetY, targetZ);
          entry.group.rotation.y = 0;
          entry.group.scale.setScalar(1);
          entry.parked = true;
        } else {
          entry.group.position.x += (targetX - entry.group.position.x) * follow;
          entry.group.position.y += (targetY - entry.group.position.y) * follow;
          entry.group.position.z += (targetZ - entry.group.position.z) * follow;
          entry.group.rotation.y += (0 - entry.group.rotation.y) * follow;
          entry.group.scale.setScalar(
            entry.group.scale.x + (1 - entry.group.scale.x) * follow,
          );
          if (Math.abs(entry.group.position.x) > 11) entry.parked = true;
        }
        entry.group.visible =
          onStage && !entry.parked && Math.abs(entry.group.position.x) < 14;

        if (!label) continue;
        const nearRest =
          onStage &&
          Math.abs(entry.group.position.x - targetX) < 0.55 &&
          Math.abs(entry.group.position.z - targetZ) < 0.55;
        const showLabel =
          shelved &&
          entry.group.visible &&
          nearRest &&
          !selectedFolder;
        if (!showLabel) {
          label.style.opacity = "0";
          continue;
        }
        label.textContent = slide.meta
          ? `${slide.meta.label} (${slide.meta.count})`
          : "";
        label.classList.toggle("is-selected", selected);
        projected.set(
          entry.group.position.x + FOLDER_W * 0.5,
          -0.1,
          entry.group.position.z + FOLDER_D * 0.55,
        );
        projected.project(camera);
        const lx = (projected.x * 0.5 + 0.5) * mount.clientWidth;
        const ly = (-projected.y * 0.5 + 0.5) * mount.clientHeight;
        label.style.opacity = projected.z > 1 ? "0" : "1";
        label.style.transform = `translate(-50%, 0) translate(${lx}px, ${ly}px)`;
      }

      for (const entry of reportEntries) {
        const dest = toLayout.reportPos[entry.id];
        const loose = archiveLayout.reportPos[entry.id];
        if (!dest && !loose) {
          entry.group.visible = false;
          continue;
        }
        if (!shelved) {
          if (entry.group.parent !== scene) scene.add(entry.group);
          const destFolder = dest ? toLayout.folderPos[dest.folderId] : null;
          const ax = loose?.x ?? 0;
          const ay = loose?.y ?? REPORT_H * 0.5;
          const az = loose?.z ?? 0;
          const bx = (destFolder?.x ?? 0) + (dest?.x ?? 0);
          const by = (destFolder?.y ?? 0) + (dest?.y ?? ay);
          const bz = (destFolder?.z ?? 0) + (dest?.z ?? 0);
          const g = entry.group;
          g.visible = true;
          const tx = THREE.MathUtils.lerp(ax, bx, enter);
          const ty = THREE.MathUtils.lerp(ay, by, enter);
          const tz = THREE.MathUtils.lerp(az, bz, enter);
          const targetRx = THREE.MathUtils.lerp(loose?.rx ?? 0, dest?.rx ?? 0, enter);
          const targetRy = THREE.MathUtils.lerp(loose?.ry ?? 0, 0, enter);
          const follow = reduce ? 1 : FOLLOW_REPORT;
          g.position.x += (tx - g.position.x) * follow;
          g.position.y += (ty - g.position.y) * follow;
          g.position.z += (tz - g.position.z) * follow;
          g.rotation.x += (targetRx - g.rotation.x) * follow;
          g.rotation.y += shortestAngleDelta(g.rotation.y, targetRy) * follow;
          g.scale.setScalar(1);
          continue;
        }
        if (!dest) {
          entry.group.visible = false;
          continue;
        }
        const folderEntry = folders.get(dest.folderId);
        const inCarousel =
          Boolean(selectedFolder) &&
          dest.folderId === selectedFolder &&
          !shuffling &&
          Boolean(folderEntry?.group.visible);
        const g = entry.group;

        if (inCarousel) {
          reparentKeepWorldPosition(g, scene);
          const origin = stageOrigin ?? carouselOrigin(toLayout);
          const offset = carouselSignedOffset(
            dest.slotIndex,
            carouselIndexRef.current,
            dest.count,
          );
          const pose = computeCarouselPose(offset, dest.count);
          if (!pose.visible) {
            g.visible = false;
            continue;
          }
          g.visible = true;
          const tx = origin.x + pose.x;
          const ty = origin.y + pose.y;
          const tz = origin.z + pose.z;
          const follow = reduce ? 1 : FOLLOW_CAROUSEL;
          g.position.x += (tx - g.position.x) * follow;
          g.position.y += (ty - g.position.y) * follow;
          g.position.z += (tz - g.position.z) * follow;
          followYaw(g, pose.ry, follow);
          g.scale.setScalar(g.scale.x + (pose.scale - g.scale.x) * follow);
          continue;
        }

        attachToFolder(entry, dest.folderId, dest, { snap: reduce });
        const arriving =
          shuffling &&
          Boolean(folderEntry) &&
          Math.abs(
            folderEntry.group.position.x -
              (toLayout.folderPos[dest.folderId]?.x ?? 0),
          ) > 0.55;
        const isReport = entry.id === selectedReport;
        const isHover =
          hovered?.kind === "report" && hovered.reportNo === entry.id;
        const show =
          Boolean(folderEntry?.group.visible) &&
          (isReport || dest.visibleAtRest);
        g.visible = show;

        const restY = dest.y;
        const targetX = dest.x;
        const targetY = arriving
          ? restY
          : restY + (isHover && show ? 0.06 : 0) + (isReport ? 0.08 : 0);
        const targetZ = dest.z;
        const targetRx = dest.rx;
        if (!show) {
          g.position.set(dest.x, restY, dest.z);
          g.rotation.x = dest.rx;
          g.rotation.y = 0;
          g.scale.setScalar(1);
          continue;
        }
        const follow = reduce ? 1 : FOLLOW_REPORT;
        g.position.x += (targetX - g.position.x) * follow;
        g.position.y += (targetY - g.position.y) * follow;
        g.position.z += (targetZ - g.position.z) * follow;
        g.rotation.x += (targetRx - g.rotation.x) * follow;
        g.rotation.y += shortestAngleDelta(g.rotation.y, 0) * follow;
        g.scale.setScalar(g.scale.x + (1 - g.scale.x) * follow);
      }

      {
        const featuredNo = (() => {
          if (!shelved || !selectedFolder || shuffling) return null;
          for (const entry of reportEntries) {
            const dest = toLayout.reportPos[entry.id];
            if (
              dest &&
              dest.folderId === selectedFolder &&
              dest.slotIndex === carouselIndexRef.current &&
              entry.group.visible
            ) {
              return entry;
            }
          }
          return null;
        })();
        if (!featuredNo) {
          featuredLabel.style.opacity = "0";
        } else {
          featuredLabel.textContent =
            featuredNo.report.title || `No. ${featuredNo.id}`;
          featuredLabel.classList.toggle(
            "is-selected",
            featuredNo.id === selectedReport,
          );
          featuredNo.group.getWorldPosition(projected);
          projected.y += REPORT_H * 0.52 * featuredNo.group.scale.y;
          projected.project(camera);
          if (projected.z > 1) {
            featuredLabel.style.opacity = "0";
          } else {
            const lx = (projected.x * 0.5 + 0.5) * mount.clientWidth;
            const ly = (-projected.y * 0.5 + 0.5) * mount.clientHeight;
            featuredLabel.style.opacity = "1";
            featuredLabel.style.transform = `translate(-50%, -100%) translate(${lx}px, ${ly}px)`;
          }
        }
      }

      renderer.render(scene, camera);
    };

    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      if (resizeRaf) cancelAnimationFrame(resizeRaf);
      ro.disconnect();
      window.removeEventListener("resize", resize);
      renderer.domElement.removeEventListener("pointerdown", onPointerDown);
      renderer.domElement.removeEventListener("pointermove", onPointerMove);
      renderer.domElement.removeEventListener("pointerup", onPointerUp);
      renderer.domElement.removeEventListener("webglcontextlost", onContextLost);
      const sharedGeos = new Set([
        shared.pagesGeo,
        shared.coverGeo,
        shared.reportBackGeo,
        shared.ringGeo,
        shared.reportHitGeo,
        shared.folderSideGeo,
        shared.folderFrontGeo,
        shared.folderBottomGeo,
        shared.folderBackGeo,
        shared.folderLipGeo,
        shared.folderLabelGeo,
      ]);
      const sharedMats = new Set([
        shared.pagesMat,
        shared.reportBackMat,
        shared.ringMat,
        shared.reportHitMat,
        ...Object.values(shared.folderMats),
      ]);
      const disposeObject = (root) => {
        root.traverse((obj) => {
          if (obj.geometry && !sharedGeos.has(obj.geometry)) obj.geometry.dispose();
          if (obj.material && !sharedMats.has(obj.material)) {
            obj.material.dispose?.();
          }
        });
      };
      for (const entry of reportEntries) {
        disposeObject(entry.group);
        entry.texture.dispose();
      }
      for (const folder of folders.values()) {
        disposeObject(folder.group);
      }
      disposeSharedResources(shared);
      ground.geometry.dispose();
      ground.material.dispose();
      renderer.dispose();
      if (mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }
      labelRoot.replaceChildren();
    };
  }, []);

  return (
    <div className="scene" aria-hidden="true">
      <div ref={mountRef} className="scene-mount" aria-hidden="true" />
      <div ref={labelRef} className="scene-labels" aria-hidden="true" />
    </div>
  );
}
