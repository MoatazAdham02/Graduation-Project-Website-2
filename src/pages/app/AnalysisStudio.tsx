import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import {
  Play,
  Pause,
  Download,
  Loader2,
  Layers,
  Sliders,
  FileImage,
  PenTool,
  Square,
  Circle,
  Type,
  Eraser,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Trash2,
  User,
  Calendar,
  Scan,
  LayoutGrid,
  ArrowRight,
  Ruler,
  StickyNote,
  Undo2,
  Redo2,
  Eye,
  EyeOff,
  Pencil,
  MapPin,
  Repeat,
} from 'lucide-react';
import dicomParser from 'dicom-parser';
import './AnalysisStudio.css';
import './Annotation.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

type ScanItem = { id: string; originalName: string; size: number; createdAt: string };

type AnnotationShape = {
  id: string;
  type: 'rect' | 'circle' | 'text' | 'path' | 'arrow' | 'measurement' | 'note';
  color: string;
  opacity: number;
  x: number;
  y: number;
  w?: number;
  h?: number;
  text?: string;
  points?: { x: number; y: number }[];
  frameIndex: number;
  visible?: boolean;
};

type ParsedScanData = {
  arrayBuffer: ArrayBuffer;
  metadata: Record<string, string>;
  numberOfFrames: number;
};

type CornerLabels = { tl: string; tr: string; bl: string; br: string };

type DrawTool = AnnotationShape['type'] | 'pen' | 'eraser';

const annotationTools: { id: DrawTool; icon: typeof PenTool; label: string }[] = [
  { id: 'pen', icon: PenTool, label: 'Freehand' },
  { id: 'rect', icon: Square, label: 'Rectangle' },
  { id: 'circle', icon: Circle, label: 'Circle' },
  { id: 'text', icon: Type, label: 'Text' },
  { id: 'eraser', icon: Eraser, label: 'Eraser' },
];

const templateTools: { id: 'arrow' | 'measurement' | 'note'; icon: typeof ArrowRight; label: string }[] = [
  { id: 'arrow', icon: ArrowRight, label: 'Arrow' },
  { id: 'measurement', icon: Ruler, label: 'Measure' },
  { id: 'note', icon: StickyNote, label: 'Note' },
];

const annotationColors = ['#dc2626', '#ea580c', '#ca8a04', '#16a34a', '#0d9488', '#0284c7', '#7c3aed'];

function formatStudyDate(raw: string): string {
  const s = String(raw).trim();
  if (s.length === 8 && /^\d{8}$/.test(s)) {
    return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`;
  }
  return s || '—';
}

function getTag(dataSet: dicomParser.DataSet, tag: string, type: 'string' | 'int' = 'string'): string | number | undefined {
  try {
    const raw = (dataSet as unknown as { elements: Record<string, { dataOffset: number; length: number }> }).elements[tag];
    if (!raw) return undefined;
    const arr = new Uint8Array(dataSet.byteArray.buffer, dataSet.byteArray.byteOffset + raw.dataOffset, raw.length);
    const str = new TextDecoder().decode(arr).trim();
    if (type === 'int') {
      const n = parseInt(str, 10);
      return isNaN(n) ? undefined : n;
    }
    return str || undefined;
  } catch {
    return undefined;
  }
}

function formatAcquisitionTime(raw: string | undefined): string | undefined {
  if (!raw || !String(raw).trim()) return undefined;
  const s = String(raw).trim();
  if (s.length >= 6 && /^\d/.test(s)) {
    const h = s.slice(0, 2);
    const m = s.slice(2, 4);
    const sec = s.slice(4, 6);
    return `${h}:${m}:${sec}`;
  }
  return s;
}

/** Row / column spacing in mm (DICOM: row then column) */
function parsePixelSpacingMm(raw: string | undefined): [number, number] | null {
  if (!raw) return null;
  const parts = String(raw)
    .split('\\')
    .map((p) => parseFloat(p.trim()))
    .filter((n) => !Number.isNaN(n));
  if (parts.length >= 2) return [parts[0], parts[1]];
  if (parts.length === 1) return [parts[0], parts[0]];
  return null;
}

/** Keep preview canvas bounded to reduce GPU/RAM (ImageData scales with pixel count). */
const PREVIEW_MAX_DIM = 640;

function canvasDimsFromRowsCols(rows: number, cols: number): { cw: number; ch: number } {
  const maxDim = PREVIEW_MAX_DIM;
  if (rows >= cols) {
    return { ch: maxDim, cw: Math.round((maxDim * cols) / rows) };
  }
  return { cw: maxDim, ch: Math.round((maxDim * rows) / cols) };
}

function mmPerCanvasPixel(metadata: Record<string, string>): number | null {
  const rows = Number(metadata['Rows'] || 0);
  const spacing = parsePixelSpacingMm(metadata['Pixel Spacing']);
  if (!rows || !spacing) return null;
  const { ch } = canvasDimsFromRowsCols(rows, Number(metadata['Columns'] || 0) || rows);
  return (rows * spacing[0]) / ch;
}

function measurementLabelMm(dxCanvas: number, dyCanvas: number, metadata: Record<string, string>): string {
  const rows = Number(metadata['Rows'] || 0);
  const cols = Number(metadata['Columns'] || 0);
  const sp = parsePixelSpacingMm(metadata['Pixel Spacing']);
  if (!rows || !cols || !sp) return `${Math.hypot(dxCanvas, dyCanvas).toFixed(0)} px`;
  const { cw, ch } = canvasDimsFromRowsCols(rows, cols);
  const dRow = (dyCanvas / ch) * rows;
  const dCol = (dxCanvas / cw) * cols;
  const mm = Math.hypot(dRow * sp[0], dCol * sp[1]);
  return `${mm.toFixed(2)} mm`;
}

/** Approximate corner markers for display (HFS axial default; refined by position/modality). */
function orientationCornerLabels(metadata: Record<string, string>): CornerLabels {
  const pos = (metadata['Patient Position'] || '').toUpperCase();
  const mod = (metadata['Modality'] || '').toUpperCase();
  if ((mod === 'MR' || mod === 'CT') && (pos.includes('SAG') || pos.includes('HFDL') || pos.includes('HFD'))) {
    return { tl: 'H', tr: 'F', bl: 'A', br: 'P' };
  }
  if (pos.includes('FFP') || pos.includes('HFP')) {
    return { tl: 'R', tr: 'L', bl: 'P', br: 'A' };
  }
  return { tl: 'R', tr: 'L', bl: 'A', br: 'P' };
}

function distPointToSegment(px: number, py: number, x1: number, y1: number, x2: number, y2: number): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len2 = dx * dx + dy * dy;
  if (len2 < 1) return Math.hypot(px - x1, py - y1);
  let t = ((px - x1) * dx + (py - y1) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
}

function drawArrowLine(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  withHead: boolean
) {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  if (!withHead) return;
  const angle = Math.atan2(y2 - y1, x2 - x1);
  const L = 11;
  const spread = 0.42;
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - L * Math.cos(angle - spread), y2 - L * Math.sin(angle - spread));
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - L * Math.cos(angle + spread), y2 - L * Math.sin(angle + spread));
  ctx.stroke();
}

function renderDicomToCanvas(
  dataSet: dicomParser.DataSet,
  canvas: HTMLCanvasElement | null,
  frameIndex: number = 0
): { metadata: Record<string, string>; numberOfFrames: number } {
  const metadata: Record<string, string> = {};
  const rows = dataSet.int16('x00280010') ?? 0;
  const cols = dataSet.int16('x00280011') ?? 0;
  const bitsAllocated = dataSet.int16('x00280100') ?? 8;
  const pixelRepresentation = dataSet.int16('x00280103') ?? 0;
  const samplesPerPixel = dataSet.int16('x00280002') ?? 1;

  let numberOfFrames = 1;
  try {
    const nf = getTag(dataSet, 'x00280008', 'int');
    if (typeof nf === 'number' && nf > 1) numberOfFrames = nf;
  } catch {
    /* ignore */
  }

  metadata['Patient Name'] = (getTag(dataSet, 'x00100010') as string) ?? '—';
  metadata['Study Date'] = (getTag(dataSet, 'x00080020') as string) ?? '—';
  metadata['Modality'] = (getTag(dataSet, 'x00080060') as string) ?? '—';
  metadata['Rows'] = String(rows);
  metadata['Columns'] = String(cols);
  metadata['Bits Allocated'] = String(bitsAllocated);
  if (numberOfFrames > 1) metadata['Frames'] = String(numberOfFrames);

  const acq = formatAcquisitionTime(getTag(dataSet, 'x00080033') as string | undefined);
  if (acq) metadata['Acquisition Time'] = acq;
  const seriesDesc = getTag(dataSet, 'x0008103e') as string | undefined;
  if (seriesDesc) metadata['Series Description'] = seriesDesc;
  const pixelSp = getTag(dataSet, 'x00280030') as string | undefined;
  if (pixelSp) metadata['Pixel Spacing'] = pixelSp;
  const inst = getTag(dataSet, 'x00080080') as string | undefined;
  if (inst) metadata['Institution Name'] = inst;
  const mfg = getTag(dataSet, 'x00080070') as string | undefined;
  if (mfg) metadata['Manufacturer'] = mfg;
  const patPos = getTag(dataSet, 'x00185100') as string | undefined;
  if (patPos) metadata['Patient Position'] = patPos;
  const iop = getTag(dataSet, 'x00200037') as string | undefined;
  if (iop) metadata['Image Orientation Patient'] = iop;

  const elements = (dataSet as unknown as { elements: Record<string, { dataOffset: number; length: number }> }).elements;
  let pixelDataElement = elements?.x7fe00010 ?? elements?.x7FE00010;
  if (!pixelDataElement && elements) {
    const tag = Object.keys(elements).find((k) => k.toLowerCase() === 'x7fe00010');
    if (tag) pixelDataElement = elements[tag];
  }
  if (!pixelDataElement || rows === 0 || cols === 0) {
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        canvas.width = 400;
        canvas.height = 200;
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#888';
        ctx.font = '14px system-ui';
        ctx.fillText('No pixel data or unsupported format', 20, 40);
      }
    }
    return { metadata, numberOfFrames };
  }

  const bytesPerPixel = bitsAllocated / 8;
  const numPixelsPerFrame = rows * cols * samplesPerPixel;
  const frameOffsetBytes = frameIndex * numPixelsPerFrame * bytesPerPixel;
  const frameByteLength = numPixelsPerFrame * bytesPerPixel;

  let min = Infinity;
  let max = -Infinity;

  /** Full scans on 8k² frames allocate huge CPU time; sample for windowing. */
  const sampleStride =
    numPixelsPerFrame > 2_000_000 ? Math.max(2, Math.ceil(numPixelsPerFrame / 2_000_000)) : 1;

  if (bitsAllocated === 16) {
    const view = new DataView(
      dataSet.byteArray.buffer,
      dataSet.byteArray.byteOffset + pixelDataElement.dataOffset + frameOffsetBytes,
      Math.min(frameByteLength, pixelDataElement.length - frameOffsetBytes)
    );
    const n = Math.floor(view.byteLength / 2);
    for (let i = 0; i < n; i += sampleStride) {
      const v = pixelRepresentation === 1 ? view.getInt16(i * 2, true) : view.getUint16(i * 2, true);
      if (v < min) min = v;
      if (v > max) max = v;
    }
  } else {
    const view = new Uint8Array(
      dataSet.byteArray.buffer,
      dataSet.byteArray.byteOffset + pixelDataElement.dataOffset + frameOffsetBytes,
      Math.min(frameByteLength, pixelDataElement.length - frameOffsetBytes)
    );
    for (let i = 0; i < view.length; i += sampleStride) {
      const v = view[i];
      if (v < min) min = v;
      if (v > max) max = v;
    }
  }

  const windowCenter = dataSet.int16('x00281050');
  const windowWidth = dataSet.int16('x00281051');
  const center = windowCenter ?? (min + max) / 2;
  const width = windowWidth ?? Math.max(max - min, 1);

  const maxDim = PREVIEW_MAX_DIM;
  let canvasWidth: number;
  let canvasHeight: number;
  if (rows >= cols) {
    canvasHeight = maxDim;
    canvasWidth = Math.round((maxDim * cols) / rows);
  } else {
    canvasWidth = maxDim;
    canvasHeight = Math.round((maxDim * rows) / cols);
  }
  if (!canvas) return { metadata, numberOfFrames };
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) return { metadata, numberOfFrames };

  const imageData = ctx.createImageData(canvasWidth, canvasHeight);
  const scaleX = cols / canvasWidth;
  const scaleY = rows / canvasHeight;

  const getPixel = (r: number, c: number): number => {
    const offset = (r * cols + c) * bytesPerPixel;
    const byteOffset = dataSet.byteArray.byteOffset + pixelDataElement.dataOffset + frameOffsetBytes + offset;
    if (bitsAllocated === 16) {
      const view = new DataView(dataSet.byteArray.buffer, byteOffset, 2);
      return pixelRepresentation === 1 ? view.getInt16(0, true) : view.getUint16(0, true);
    }
    return dataSet.byteArray[dataSet.byteArray.byteOffset + pixelDataElement.dataOffset + frameOffsetBytes + offset];
  };

  for (let y = 0; y < canvasHeight; y++) {
    for (let x = 0; x < canvasWidth; x++) {
      const r = Math.min(Math.floor(y * scaleY), rows - 1);
      const c = Math.min(Math.floor(x * scaleX), cols - 1);
      const v = getPixel(r, c);
      const low = center - width / 2;
      const high = center + width / 2;
      const t = (v - low) / (high - low);
      const gray = Math.max(0, Math.min(255, Math.round(t * 255)));
      const i = (y * canvasWidth + x) * 4;
      imageData.data[i] = gray;
      imageData.data[i + 1] = gray;
      imageData.data[i + 2] = gray;
      imageData.data[i + 3] = 255;
    }
  }
  ctx.putImageData(imageData, 0, 0);
  return { metadata, numberOfFrames };
}

export default function AnalysisStudio() {
  const location = useLocation();
  const [scans, setScans] = useState<ScanItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingScans, setLoadingScans] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<Record<string, string>>({});
  const [parsedData, setParsedData] = useState<ParsedScanData | null>(null);
  const [running, setRunning] = useState(false);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [isCinePlaying, setIsCinePlaying] = useState(false);
  const [cineLoop, setCineLoop] = useState(true);
  const [viewportScale, setViewportScale] = useState(1);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const viewportScaleRafRef = useRef<number | null>(null);
  const lastCommittedScaleRef = useRef(1);

  const onViewportTransformed = useCallback((ref: { state: { scale?: number } }) => {
    const s = ref.state.scale ?? 1;
    if (Math.abs(s - lastCommittedScaleRef.current) < 0.01) return;
    lastCommittedScaleRef.current = s;
    if (viewportScaleRafRef.current != null) return;
    viewportScaleRafRef.current = requestAnimationFrame(() => {
      viewportScaleRafRef.current = null;
      setViewportScale(lastCommittedScaleRef.current);
    });
  }, []);

  useEffect(
    () => () => {
      if (viewportScaleRafRef.current != null) cancelAnimationFrame(viewportScaleRafRef.current);
    },
    []
  );

  const annPastRef = useRef<AnnotationShape[][]>([]);
  const annFutureRef = useRef<AnnotationShape[][]>([]);
  const MAX_ANN_HISTORY = 24;

  const [activeTool, setActiveTool] = useState<DrawTool>('pen');
  const [annotationColor, setAnnotationColor] = useState(annotationColors[0]);
  const [annotationOpacity, setAnnotationOpacity] = useState(80);
  const [annotations, setAnnotations] = useState<AnnotationShape[]>([]);

  const [historyBump, setHistoryBump] = useState(0);
  const bumpHistoryUi = () => setHistoryBump((b) => b + 1);

  const patchAnnotations = useCallback((fn: (prev: AnnotationShape[]) => AnnotationShape[]) => {
    setAnnotations((prev) => {
      annPastRef.current.push([...prev]);
      if (annPastRef.current.length > MAX_ANN_HISTORY) annPastRef.current.shift();
      annFutureRef.current = [];
      return fn(prev);
    });
    queueMicrotask(() => bumpHistoryUi());
  }, []);

  const undoAnnotations = useCallback(() => {
    setAnnotations((present) => {
      const past = annPastRef.current.pop();
      if (!past) return present;
      annFutureRef.current.push([...present]);
      return past;
    });
    queueMicrotask(() => bumpHistoryUi());
  }, []);

  const redoAnnotations = useCallback(() => {
    setAnnotations((present) => {
      const future = annFutureRef.current.pop();
      if (!future) return present;
      annPastRef.current.push([...present]);
      if (annPastRef.current.length > MAX_ANN_HISTORY) annPastRef.current.shift();
      return future;
    });
    queueMicrotask(() => bumpHistoryUi());
  }, []);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState<{ x: number; y: number } | null>(null);
  const [drawCurrent, setDrawCurrent] = useState<{ x: number; y: number } | null>(null);
  const [drawingPath, setDrawingPath] = useState<{ x: number; y: number }[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadingScans(true);
      try {
        const res = await fetch(`${API_URL}/api/scan`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to load scans');
        if (!cancelled) setScans(Array.isArray(data) ? data : []);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load scans');
      } finally {
        if (!cancelled) setLoadingScans(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const scanId = (location.state as { scanId?: string } | null)?.scanId;
    if (scanId && scans.some((s) => s.id === scanId)) {
      setSelectedId(scanId);
    }
  }, [location.state, scans]);

  useEffect(() => {
    if (!selectedId) {
      setMetadata({});
      setParsedData(null);
      setCurrentFrame(0);
      setIsCinePlaying(false);
      setViewportScale(1);
      setAnnotations([]);
      annPastRef.current = [];
      annFutureRef.current = [];
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    setParsedData(null);
    (async () => {
      try {
        const res = await fetch(`${API_URL}/api/scan/${selectedId}/file`);
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || 'Failed to load file');
        }
        const buf = await res.arrayBuffer();
        if (cancelled) return;
        const byteArray = new Uint8Array(buf);
        const dataSet = dicomParser.parseDicom(byteArray);
        const { metadata: meta, numberOfFrames: nFrames } = renderDicomToCanvas(dataSet, null, 0);
        if (!cancelled) {
          setParsedData({ arrayBuffer: buf, metadata: meta, numberOfFrames: nFrames });
          setMetadata(meta);
          setCurrentFrame(0);
          setIsCinePlaying(false);
          setAnnotations([]);
          annPastRef.current = [];
          annFutureRef.current = [];
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Failed to load DICOM');
          setMetadata({});
          setParsedData(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [selectedId]);

  useEffect(() => {
    if (!parsedData?.arrayBuffer || !canvasRef.current) return;
    const dataSet = dicomParser.parseDicom(new Uint8Array(parsedData.arrayBuffer));
    renderDicomToCanvas(dataSet, canvasRef.current, currentFrame);
  }, [parsedData, currentFrame]);

  useEffect(() => {
    if (!parsedData || parsedData.numberOfFrames <= 1 || !isCinePlaying) return;
    const nf = parsedData.numberOfFrames;
    const intervalId = window.setInterval(() => {
      setCurrentFrame((prev) => {
        if (cineLoop) return (prev + 1) % nf;
        if (prev + 1 >= nf) {
          queueMicrotask(() => setIsCinePlaying(false));
          return nf - 1;
        }
        return prev + 1;
      });
    }, 120);
    return () => window.clearInterval(intervalId);
  }, [parsedData, isCinePlaying, cineLoop]);

  const drawAnnotationsOnOverlay = useCallback(() => {
    const canvas = canvasRef.current;
    const overlay = overlayRef.current;
    if (!canvas || !overlay || !overlay.getContext('2d')) return;
    overlay.width = canvas.width;
    overlay.height = canvas.height;
    const ctx = overlay.getContext('2d')!;
    ctx.clearRect(0, 0, overlay.width, overlay.height);
    annotations.forEach((a) => {
      if (a.visible === false) return;
      if (a.frameIndex !== currentFrame) return;
      ctx.strokeStyle = a.color;
      ctx.fillStyle = a.color;
      ctx.globalAlpha = a.opacity / 100;
      ctx.lineWidth = 2;
      if (a.type === 'rect' && a.w != null && a.h != null) {
        ctx.strokeRect(a.x, a.y, a.w, a.h);
      } else if (a.type === 'circle' && a.w != null && a.h != null) {
        const rx = Math.abs(a.w) / 2;
        const ry = Math.abs(a.h) / 2;
        ctx.beginPath();
        ctx.ellipse(a.x + a.w / 2, a.y + a.h / 2, rx, ry, 0, 0, Math.PI * 2);
        ctx.stroke();
      } else if ((a.type === 'text' || a.type === 'note') && a.text) {
        ctx.font = '16px system-ui';
        ctx.fillText(a.text, a.x, a.y);
      } else if (a.type === 'path' && a.points && a.points.length >= 2) {
        ctx.beginPath();
        ctx.moveTo(a.points[0].x, a.points[0].y);
        for (let i = 1; i < a.points.length; i++) ctx.lineTo(a.points[i].x, a.points[i].y);
        ctx.stroke();
      } else if (
        (a.type === 'arrow' || a.type === 'measurement') &&
        a.w != null &&
        a.h != null
      ) {
        const x2 = a.x + a.w;
        const y2 = a.y + a.h;
        drawArrowLine(ctx, a.x, a.y, x2, y2, a.type === 'arrow');
        if (a.type === 'measurement' && a.text) {
          ctx.font = '13px system-ui';
          const mx = (a.x + x2) / 2;
          const my = (a.y + y2) / 2 - 6;
          ctx.fillText(a.text, mx, my);
        }
      }
    });
    ctx.globalAlpha = 1;
    if (drawingPath && drawingPath.length >= 2) {
      ctx.strokeStyle = annotationColor;
      ctx.globalAlpha = annotationOpacity / 100;
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(drawingPath[0].x, drawingPath[0].y);
      for (let i = 1; i < drawingPath.length; i++) ctx.lineTo(drawingPath[i].x, drawingPath[i].y);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
    if (isDrawing && drawStart && drawCurrent) {
      if (activeTool === 'rect' || activeTool === 'circle') {
        const x = Math.min(drawStart.x, drawCurrent.x);
        const y = Math.min(drawStart.y, drawCurrent.y);
        const w = Math.abs(drawCurrent.x - drawStart.x);
        const h = Math.abs(drawCurrent.y - drawStart.y);
        ctx.strokeStyle = annotationColor;
        ctx.globalAlpha = annotationOpacity / 100;
        ctx.lineWidth = 2;
        if (activeTool === 'rect') ctx.strokeRect(x, y, w, h);
        else {
          ctx.beginPath();
          ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
      } else if (activeTool === 'arrow' || activeTool === 'measurement') {
        ctx.strokeStyle = annotationColor;
        ctx.globalAlpha = annotationOpacity / 100;
        ctx.lineWidth = 2;
        drawArrowLine(ctx, drawStart.x, drawStart.y, drawCurrent.x, drawCurrent.y, activeTool === 'arrow');
        ctx.globalAlpha = 1;
      }
    }
  }, [
    annotations,
    currentFrame,
    isDrawing,
    drawStart,
    drawCurrent,
    drawingPath,
    activeTool,
    annotationColor,
    annotationOpacity,
  ]);

  useEffect(() => {
    drawAnnotationsOnOverlay();
  }, [drawAnnotationsOnOverlay]);

  const getOverlayCoords = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const overlay = overlayRef.current;
    if (!overlay) return { x: 0, y: 0 };
    const rect = overlay.getBoundingClientRect();
    const scaleX = overlay.width / rect.width;
    const scaleY = overlay.height / rect.height;
    return {
      x: Math.round((e.clientX - rect.left) * scaleX),
      y: Math.round((e.clientY - rect.top) * scaleY),
    };
  };

  const handleOverlayMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = getOverlayCoords(e);
    if (activeTool === 'eraser') {
      const contains = (a: AnnotationShape, px: number, py: number) => {
        if (a.frameIndex !== currentFrame || a.visible === false) return false;
        if (a.type === 'text' || a.type === 'note')
          return Math.abs(a.x - px) < Math.max(24, (a.text?.length ?? 0) * 6) && Math.abs(a.y - py) < 18;
        if (a.type === 'arrow' || a.type === 'measurement') {
          if (a.w == null || a.h == null) return false;
          return distPointToSegment(px, py, a.x, a.y, a.x + a.w, a.y + a.h) <= 12;
        }
        if (a.type === 'path' && a.points && a.points.length >= 2) {
          const threshold = 10;
          for (let i = 0; i < a.points.length - 1; i++) {
            const p1 = a.points[i];
            const p2 = a.points[i + 1];
            if (distPointToSegment(px, py, p1.x, p1.y, p2.x, p2.y) <= threshold) return true;
          }
          return false;
        }
        if (a.w == null || a.h == null) return false;
        if (a.type === 'rect') return px >= a.x && px <= a.x + a.w && py >= a.y && py <= a.y + a.h;
        const cx = a.x + a.w / 2;
        const cy = a.y + a.h / 2;
        const rx = Math.max(Math.abs(a.w) / 2, 1);
        const ry = Math.max(Math.abs(a.h) / 2, 1);
        return ((px - cx) / rx) ** 2 + ((py - cy) / ry) ** 2 <= 1;
      };
      for (let i = annotations.length - 1; i >= 0; i--) {
        if (contains(annotations[i], x, y)) {
          patchAnnotations((prev) => prev.filter((_, j) => j !== i));
          break;
        }
      }
      return;
    }
    if (activeTool === 'pen') {
      setIsDrawing(true);
      setDrawingPath([{ x, y }]);
      return;
    }
    if (activeTool === 'rect' || activeTool === 'circle' || activeTool === 'arrow' || activeTool === 'measurement') {
      setIsDrawing(true);
      setDrawStart({ x, y });
      setDrawCurrent({ x, y });
      return;
    }
    if (activeTool === 'text') {
      const t = window.prompt('Text:');
      if (t) {
        patchAnnotations((prev) => [
          ...prev,
          {
            id: String(Date.now()),
            type: 'text',
            color: annotationColor,
            opacity: annotationOpacity,
            x,
            y,
            text: t,
            frameIndex: currentFrame,
            visible: true,
          },
        ]);
      }
      return;
    }
    if (activeTool === 'note') {
      const t = window.prompt('Note', 'Finding: ');
      if (t) {
        patchAnnotations((prev) => [
          ...prev,
          {
            id: String(Date.now()),
            type: 'note',
            color: annotationColor,
            opacity: annotationOpacity,
            x,
            y,
            text: t,
            frameIndex: currentFrame,
            visible: true,
          },
        ]);
      }
    }
  };

  const handleOverlayMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const coords = getOverlayCoords(e);
    if (activeTool === 'pen' && drawingPath && drawingPath.length > 0) {
      setDrawingPath((prev) => (prev ? [...prev, coords] : [coords]));
      return;
    }
    if (!isDrawing || !drawStart) return;
    setDrawCurrent(coords);
  };

  const handleOverlayMouseUp = () => {
    if (activeTool === 'pen' && drawingPath && drawingPath.length >= 2) {
      patchAnnotations((prev) => [
        ...prev,
        {
          id: String(Date.now()),
          type: 'path',
          color: annotationColor,
          opacity: annotationOpacity,
          x: drawingPath[0].x,
          y: drawingPath[0].y,
          points: [...drawingPath],
          frameIndex: currentFrame,
          visible: true,
        },
      ]);
      setDrawingPath(null);
      setIsDrawing(false);
      return;
    }
    if (!isDrawing || !drawStart || !drawCurrent) return;
    const { x: x0, y: y0 } = drawStart;
    const { x: x1, y: y1 } = drawCurrent;
    if (activeTool === 'arrow' || activeTool === 'measurement') {
      const dx = x1 - x0;
      const dy = y1 - y0;
      if (Math.hypot(dx, dy) > 4) {
        const label =
          activeTool === 'measurement'
            ? measurementLabelMm(dx, dy, metadata)
            : undefined;
        patchAnnotations((prev) => [
          ...prev,
          {
            id: String(Date.now()),
            type: activeTool,
            color: annotationColor,
            opacity: annotationOpacity,
            x: x0,
            y: y0,
            w: dx,
            h: dy,
            text: label,
            frameIndex: currentFrame,
            visible: true,
          },
        ]);
      }
      setIsDrawing(false);
      setDrawStart(null);
      setDrawCurrent(null);
      return;
    }
    const x = Math.min(x0, x1);
    const y = Math.min(y0, y1);
    const w = Math.abs(x1 - x0);
    const h = Math.abs(y1 - y0);
    if (w > 2 && h > 2) {
      patchAnnotations((prev) => [
        ...prev,
        {
          id: String(Date.now()),
          type: activeTool === 'circle' ? 'circle' : 'rect',
          color: annotationColor,
          opacity: annotationOpacity,
          x,
          y,
          w,
          h,
          frameIndex: currentFrame,
          visible: true,
        },
      ]);
    }
    setIsDrawing(false);
    setDrawStart(null);
    setDrawCurrent(null);
  };

  const handleOverlayMouseLeave = () => {
    if (activeTool === 'pen' && drawingPath && drawingPath.length >= 2) {
      patchAnnotations((prev) => [
        ...prev,
        {
          id: String(Date.now()),
          type: 'path',
          color: annotationColor,
          opacity: annotationOpacity,
          x: drawingPath[0].x,
          y: drawingPath[0].y,
          points: [...drawingPath],
          frameIndex: currentFrame,
          visible: true,
        },
      ]);
      setDrawingPath(null);
    } else if (drawingPath) setDrawingPath(null);
    setIsDrawing(false);
    setDrawStart(null);
    setDrawCurrent(null);
  };

  const handleSaveAnnotatedImage = () => {
    const baseCanvas = canvasRef.current;
    const annotationsCanvas = overlayRef.current;
    if (!baseCanvas || !annotationsCanvas) return;

    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = baseCanvas.width;
    exportCanvas.height = baseCanvas.height;
    const ctx = exportCanvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(baseCanvas, 0, 0);
    ctx.drawImage(annotationsCanvas, 0, 0);

    const scanName = scans.find((s) => s.id === selectedId)?.originalName ?? 'dicom';
    const safeName = scanName.replace(/[^a-zA-Z0-9._-]/g, '_').replace(/\.[^.]+$/, '');
    const frameSuffix = parsedData && parsedData.numberOfFrames > 1 ? `_frame-${currentFrame + 1}` : '';
    const fileName = `${safeName}${frameSuffix}_annotated.png`;

    exportCanvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    }, 'image/png');
  };

  const cornerLabels = useMemo(() => orientationCornerLabels(metadata), [metadata]);
  const mmPerPx = useMemo(() => mmPerCanvasPixel(metadata), [metadata]);
  const rulerBarPx = mmPerPx && mmPerPx > 0 ? 50 / mmPerPx : 0;

  const annotationTypeLabel = (a: AnnotationShape, idx: number) => {
    switch (a.type) {
      case 'text':
        return `Text · ${(a.text ?? '').slice(0, 28)}`;
      case 'note':
        return `Note · ${(a.text ?? '').slice(0, 28)}`;
      case 'path':
        return `Freehand ${idx + 1}`;
      case 'arrow':
        return `Arrow ${idx + 1}`;
      case 'measurement':
        return `Measure · ${a.text ?? '—'}`;
      case 'circle':
        return `Circle ${idx + 1}`;
      case 'rect':
        return `Rectangle ${idx + 1}`;
      default:
        return `Layer ${idx + 1}`;
    }
  };

  return (
    <div className="analysis-page">
      <div className="analysis-layout">
        <motion.section
          className="card analysis-viewer"
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="analysis-viewer-toolbar">
            <label className="label">Select scan</label>
            <select
              className="input analysis-scan-select"
              value={selectedId ?? ''}
              onChange={(e) => setSelectedId(e.target.value || null)}
              disabled={loadingScans}
            >
              <option value="">— Select a DICOM scan —</option>
              {scans.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.originalName} ({(s.size / 1024).toFixed(1)} KB)
                </option>
              ))}
            </select>
          </div>
          {loadingScans ? (
            <div className="analysis-viewer-placeholder">
              <Loader2 size={48} className="spin" />
              <p>Loading scans…</p>
            </div>
          ) : scans.length === 0 ? (
            <div className="analysis-viewer-placeholder">
              <Layers size={48} />
              <p>No scans yet. Upload DICOM files from the Upload page.</p>
            </div>
          ) : !selectedId ? (
            <div className="analysis-viewer-placeholder">
              <FileImage size={48} />
              <p>Select a scan to review</p>
            </div>
          ) : (
            <>
              <div className="analysis-viewer-content-wrap">
                {loading && (
                  <div className="analysis-viewer-loading-overlay">
                    <Loader2 size={40} className="spin" />
                    <p>Loading DICOM…</p>
                  </div>
                )}
                {error ? (
                  <div className="analysis-viewer-placeholder">
                    <p className="analysis-error">{error}</p>
                  </div>
                ) : (
                  <div className="analysis-viewer-content">
                    <div className="analysis-dicom-wrap">
                      {parsedData && parsedData.numberOfFrames > 1 && (
                        <div className="analysis-frame-controls">
                          <label className="label">Frame</label>
                          <div className="analysis-frame-slider-wrap">
                            <button
                              type="button"
                              className="analysis-cine-btn"
                              onClick={() => setIsCinePlaying((v) => !v)}
                              title={isCinePlaying ? 'Pause cine' : 'Play cine'}
                              aria-label={isCinePlaying ? 'Pause cine' : 'Play cine'}
                            >
                              {isCinePlaying ? <Pause size={16} /> : <Play size={16} />}
                            </button>
                            <button
                              type="button"
                              className={`analysis-cine-btn ${cineLoop ? 'analysis-cine-btn--active' : ''}`}
                              onClick={() => setCineLoop((v) => !v)}
                              title={cineLoop ? 'Loop: on' : 'Loop: stop at last frame'}
                              aria-label="Toggle cine loop"
                              aria-pressed={cineLoop}
                            >
                              <Repeat size={16} />
                            </button>
                            <input
                              type="range"
                              min={0}
                              max={Math.max(0, parsedData.numberOfFrames - 1)}
                              value={currentFrame}
                              onChange={(e) => {
                                setCurrentFrame(Number(e.target.value));
                                if (isCinePlaying) setIsCinePlaying(false);
                              }}
                              className="analysis-slider"
                            />
                            <span className="analysis-frame-label">
                              {currentFrame + 1} / {parsedData.numberOfFrames}
                            </span>
                          </div>
                        </div>
                      )}
                      <div className="analysis-zoom-wrapper analysis-viewport-chrome">
                        <div className="analysis-viewport-hud" aria-hidden>
                          {parsedData && (
                            <>
                              {parsedData.numberOfFrames > 1 ? (
                                <span>Frame {currentFrame + 1}/{parsedData.numberOfFrames}</span>
                              ) : (
                                <span>Frame 1/1</span>
                              )}
                              <span className="analysis-viewport-hud-sep">·</span>
                              <span>{Math.round(viewportScale * 100)}%</span>
                            </>
                          )}
                        </div>
                        <TransformWrapper
                          initialScale={1}
                          minScale={0.25}
                          maxScale={20}
                          limitToBounds={true}
                          centerOnInit={true}
                          panning={{ disabled: true }}
                          doubleClick={{ mode: 'reset' }}
                          wheel={{ step: 0.15 }}
                          pinch={{ step: 5 }}
                          onTransformed={onViewportTransformed}
                        >
                          {({ zoomIn, zoomOut, resetTransform }) => (
                            <>
                              {parsedData && (
                                <div className="analysis-zoom-controls">
                                  <button type="button" className="analysis-zoom-btn" onClick={() => zoomIn()} title="Zoom in" aria-label="Zoom in">
                                    <ZoomIn size={20} />
                                  </button>
                                  <button type="button" className="analysis-zoom-btn" onClick={() => zoomOut()} title="Zoom out" aria-label="Zoom out">
                                    <ZoomOut size={20} />
                                  </button>
                                  <button type="button" className="analysis-zoom-btn" onClick={() => resetTransform()} title="Reset view" aria-label="Reset view">
                                    <RotateCcw size={20} />
                                  </button>
                                </div>
                              )}
                              <TransformComponent
                                wrapperStyle={{ width: '100%', height: '100%' }}
                                contentStyle={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}
                              >
                                <div className="analysis-canvas-container">
                                  <div className="analysis-orientation-markers" aria-hidden>
                                    <span className="analysis-ori analysis-ori--tl">{cornerLabels.tl}</span>
                                    <span className="analysis-ori analysis-ori--tr">{cornerLabels.tr}</span>
                                    <span className="analysis-ori analysis-ori--bl">{cornerLabels.bl}</span>
                                    <span className="analysis-ori analysis-ori--br">{cornerLabels.br}</span>
                                  </div>
                                  <canvas
                                    ref={canvasRef}
                                    className="analysis-dicom-canvas"
                                    style={{ borderRadius: 0 }}
                                  />
                                  <canvas
                                    ref={overlayRef}
                                    className="analysis-annotation-overlay"
                                    onMouseDown={handleOverlayMouseDown}
                                    onMouseMove={handleOverlayMouseMove}
                                    onMouseUp={handleOverlayMouseUp}
                                    onMouseLeave={handleOverlayMouseLeave}
                                    style={{ cursor: activeTool === 'eraser' ? 'cell' : 'crosshair' }}
                                  />
                                  {rulerBarPx > 0 && (
                                    <div className="analysis-mm-ruler" title="50 mm (from Pixel Spacing)">
                                      <div className="analysis-mm-ruler-bar" style={{ width: `${rulerBarPx}px` }} />
                                      <span className="analysis-mm-ruler-label">50 mm</span>
                                    </div>
                                  )}
                                </div>
                              </TransformComponent>
                            </>
                          )}
                        </TransformWrapper>
                      </div>
                    </div>
                    <div className="analysis-metadata analysis-metadata--tabs">
                      <div className="analysis-metadata-tab-panel">
                        <div className="analysis-metadata-header">
                          <Scan size={20} className="analysis-metadata-header-icon" />
                          <h4>Patient & Study</h4>
                        </div>
                        <div className="analysis-metadata-block analysis-metadata-quick">
                          <div className="analysis-metadata-grid">
                            {metadata['Acquisition Time'] != null && (
                              <div className="analysis-metadata-item">
                                <span className="analysis-metadata-label">Acquisition time</span>
                                <span className="analysis-metadata-value">{metadata['Acquisition Time']}</span>
                              </div>
                            )}
                            {metadata['Series Description'] != null && (
                              <div className="analysis-metadata-item">
                                <span className="analysis-metadata-label">Series description</span>
                                <span className="analysis-metadata-value">{metadata['Series Description']}</span>
                              </div>
                            )}
                            {metadata['Pixel Spacing'] != null && (
                              <div className="analysis-metadata-item">
                                <span className="analysis-metadata-label">Pixel spacing (mm)</span>
                                <span className="analysis-metadata-value">{metadata['Pixel Spacing']}</span>
                              </div>
                            )}
                            {(metadata['Institution Name'] || metadata['Manufacturer']) && (
                              <div className="analysis-metadata-item">
                                <span className="analysis-metadata-label">Institution / device</span>
                                <span className="analysis-metadata-value">
                                  {[metadata['Institution Name'], metadata['Manufacturer']].filter(Boolean).join(' · ') || '—'}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                        {metadata['Patient Name'] != null && metadata['Patient Name'] !== '—' && (
                          <div className="analysis-metadata-block analysis-metadata-patient">
                            <div className="analysis-metadata-row analysis-metadata-patient-name">
                              <User size={16} />
                              <span>{metadata['Patient Name']}</span>
                            </div>
                          </div>
                        )}
                        <div className="analysis-metadata-block">
                          <div className="analysis-metadata-block-title">
                            <Calendar size={14} />
                            <span>Study</span>
                          </div>
                          <div className="analysis-metadata-grid">
                            {metadata['Study Date'] != null && (
                              <div className="analysis-metadata-item">
                                <span className="analysis-metadata-label">Date</span>
                                <span className="analysis-metadata-value">
                                  {formatStudyDate(metadata['Study Date'])}
                                </span>
                              </div>
                            )}
                            {metadata['Modality'] != null && (
                              <div className="analysis-metadata-item">
                                <span className="analysis-metadata-label">Modality</span>
                                <span className="analysis-metadata-badge">{metadata['Modality']}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="analysis-metadata-block">
                          <div className="analysis-metadata-block-title">
                            <LayoutGrid size={14} />
                            <span>Image</span>
                          </div>
                          <div className="analysis-metadata-grid">
                            {metadata['Rows'] != null && metadata['Columns'] != null && (
                              <div className="analysis-metadata-item">
                                <span className="analysis-metadata-label">Dimensions</span>
                                <span className="analysis-metadata-value">
                                  {metadata['Rows']} × {metadata['Columns']}
                                </span>
                              </div>
                            )}
                            {metadata['Frames'] != null && (
                              <div className="analysis-metadata-item">
                                <span className="analysis-metadata-label">Frames</span>
                                <span className="analysis-metadata-value">{metadata['Frames']}</span>
                              </div>
                            )}
                            {metadata['Bits Allocated'] != null && (
                              <div className="analysis-metadata-item">
                                <span className="analysis-metadata-label">Bit depth</span>
                                <span className="analysis-metadata-value">{metadata['Bits Allocated']} bit</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </motion.section>

        <motion.aside
          className="analysis-sidebar card"
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
        >
          <h3>Analysis parameters</h3>
          <div className="analysis-param">
            <label className="label">Model</label>
            <select className="input">
              <option>CT — Lung nodule detection</option>
              <option>MRI — Brain segmentation</option>
              <option>X-Ray — Fracture detection</option>
            </select>
          </div>
          <div className="analysis-param">
            <label className="label">Sensitivity</label>
            <div className="analysis-slider-wrap">
              <Sliders size={18} />
              <input type="range" min="0" max="100" defaultValue="75" className="analysis-slider" />
            </div>
          </div>
          <button
            type="button"
            className="btn btn-primary analysis-run"
            onClick={() => setRunning(true)}
            disabled={running}
          >
            {running ? (
              <>
                <Loader2 size={18} className="spin" />
                Running analysis...
              </>
            ) : (
              <>
                <Play size={18} />
                Run analysis
              </>
            )}
          </button>

          {parsedData && (
            <div className="analysis-annotation-section">
              <div className="annotation-toolbar-header">
                <PenTool size={20} />
                <span>Annotation</span>
              </div>
              <div className="analysis-undo-row" data-history-bump={historyBump}>
                <button
                  type="button"
                  className="btn btn-ghost analysis-undo-btn"
                  onClick={undoAnnotations}
                  disabled={annPastRef.current.length === 0}
                  title="Undo"
                >
                  <Undo2 size={16} />
                  Undo
                </button>
                <button
                  type="button"
                  className="btn btn-ghost analysis-undo-btn"
                  onClick={redoAnnotations}
                  disabled={annFutureRef.current.length === 0}
                  title="Redo"
                >
                  <Redo2 size={16} />
                  Redo
                </button>
              </div>
              <div className="annotation-tools">
                {annotationTools.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    className={`annotation-tool ${activeTool === t.id ? 'annotation-tool-active' : ''}`}
                    onClick={() => setActiveTool(t.id)}
                    title={t.label}
                  >
                    <t.icon size={20} />
                  </button>
                ))}
              </div>
              <div className="annotation-templates-block">
                <span className="annotation-label">Templates</span>
                <div className="annotation-tools annotation-tools--templates">
                  {templateTools.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      className={`annotation-tool ${activeTool === t.id ? 'annotation-tool-active' : ''}`}
                      onClick={() => setActiveTool(t.id)}
                      title={t.label}
                    >
                      <t.icon size={20} />
                    </button>
                  ))}
                </div>
              </div>
              <div className="annotation-colors">
                <span className="annotation-label">Color</span>
                <div className="annotation-color-grid">
                  {annotationColors.map((c) => (
                    <button
                      key={c}
                      type="button"
                      className={`annotation-color-swatch ${annotationColor === c ? 'annotation-color-active' : ''}`}
                      style={{ background: c }}
                      onClick={() => setAnnotationColor(c)}
                      aria-label={`Color ${c}`}
                    />
                  ))}
                </div>
              </div>
              <div className="annotation-opacity">
                <label className="label">Opacity</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={annotationOpacity}
                  onChange={(e) => setAnnotationOpacity(Number(e.target.value))}
                  className="annotation-slider"
                />
              </div>
              <div className="analysis-annotations-list">
                <div className="analysis-annotations-list-header">
                  <h4>Layers</h4>
                  <div className="analysis-annotation-actions">
                    <button
                      type="button"
                      className="btn analysis-save-annotations"
                      onClick={handleSaveAnnotatedImage}
                      title="Save annotated image"
                    >
                      <Download size={16} />
                      Save
                    </button>
                    <button
                      type="button"
                      className="btn analysis-clear-annotations"
                      onClick={() => {
                        patchAnnotations(() => []);
                        setDrawingPath(null);
                        setIsDrawing(false);
                        setDrawStart(null);
                        setDrawCurrent(null);
                      }}
                      disabled={annotations.length === 0}
                      title="Clear all annotations"
                    >
                      <Trash2 size={16} />
                      Clear all
                    </button>
                  </div>
                </div>
                {annotations.length === 0 ? (
                  <p className="annotation-list-empty">No annotations yet. Draw on the scan.</p>
                ) : (
                  <ul className="annotation-layer-list">
                    {annotations.map((a, i) => (
                      <li key={a.id} className="annotation-layer-item">
                        <button
                          type="button"
                          className="annotation-layer-visibility"
                          onClick={() =>
                            patchAnnotations((prev) =>
                              prev.map((x) =>
                                x.id === a.id ? { ...x, visible: !(x.visible !== false) } : x
                              )
                            )
                          }
                          title={a.visible === false ? 'Show' : 'Hide'}
                        >
                          {a.visible === false ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                        <div className="annotation-layer-body">
                          <span className="annotation-layer-title">{annotationTypeLabel(a, i)}</span>
                          <span className="annotation-layer-meta">
                            Frame {a.frameIndex + 1}
                            {parsedData.numberOfFrames > 1 && a.frameIndex !== currentFrame && (
                              <button
                                type="button"
                                className="annotation-layer-jump"
                                onClick={() => {
                                  setCurrentFrame(a.frameIndex);
                                  setIsCinePlaying(false);
                                }}
                                title="Jump to annotated frame"
                              >
                                <MapPin size={12} />
                                Jump
                              </button>
                            )}
                          </span>
                        </div>
                        <div className="annotation-layer-actions">
                          {(a.type === 'text' || a.type === 'note') && (
                            <button
                              type="button"
                              className="annotation-layer-iconbtn"
                              title="Edit text"
                              onClick={() => {
                                const next = window.prompt('Edit', a.text ?? '');
                                if (next != null)
                                  patchAnnotations((prev) =>
                                    prev.map((x) => (x.id === a.id ? { ...x, text: next } : x))
                                  );
                              }}
                            >
                              <Pencil size={14} />
                            </button>
                          )}
                          <button
                            type="button"
                            className="annotation-layer-iconbtn annotation-layer-iconbtn--danger"
                            title="Delete"
                            onClick={() => patchAnnotations((prev) => prev.filter((x) => x.id !== a.id))}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}

          <div className="analysis-results-preview">
            <h4>Results</h4>
            <p className="analysis-results-placeholder">No results yet.</p>
          </div>
        </motion.aside>
      </div>
    </div>
  );
}
