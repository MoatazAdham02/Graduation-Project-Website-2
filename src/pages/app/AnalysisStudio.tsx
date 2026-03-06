import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { Play, Loader2, Layers, Sliders, FileImage, PenTool, Square, Circle, Type, Eraser, ZoomIn, ZoomOut, RotateCcw, Trash2 } from 'lucide-react';
import dicomParser from 'dicom-parser';
import './AnalysisStudio.css';
import './Annotation.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

type ScanItem = { id: string; originalName: string; size: number; createdAt: string };

type AnnotationShape = {
  id: string;
  type: 'rect' | 'circle' | 'text' | 'path';
  color: string;
  opacity: number;
  x: number;
  y: number;
  w?: number;
  h?: number;
  text?: string;
  points?: { x: number; y: number }[];
};

const annotationTools = [
  { id: 'pen', icon: PenTool, label: 'Freehand' },
  { id: 'rect', icon: Square, label: 'Rectangle' },
  { id: 'circle', icon: Circle, label: 'Circle' },
  { id: 'text', icon: Type, label: 'Text' },
  { id: 'eraser', icon: Eraser, label: 'Eraser' },
];

const annotationColors = ['#dc2626', '#ea580c', '#ca8a04', '#16a34a', '#0d9488', '#0284c7', '#7c3aed'];

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
  const numPixels = numPixelsPerFrame * numberOfFrames;
  const pixelDataLength = numPixels * bytesPerPixel;
  const frameOffsetBytes = frameIndex * numPixelsPerFrame * bytesPerPixel;
  const frameEndBytes = frameOffsetBytes + numPixelsPerFrame * bytesPerPixel;
  const frameByteLength = numPixelsPerFrame * bytesPerPixel;

  let min = Infinity;
  let max = -Infinity;

  if (bitsAllocated === 16) {
    const view = new DataView(
      dataSet.byteArray.buffer,
      dataSet.byteArray.byteOffset + pixelDataElement.dataOffset + frameOffsetBytes,
      Math.min(frameByteLength, pixelDataElement.length - frameOffsetBytes)
    );
    const n = Math.floor(view.byteLength / 2);
    for (let i = 0; i < n; i++) {
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
    for (let i = 0; i < view.length; i++) {
      const v = view[i];
      if (v < min) min = v;
      if (v > max) max = v;
    }
  }

  const windowCenter = dataSet.int16('x00281050');
  const windowWidth = dataSet.int16('x00281051');
  let center = windowCenter ?? (min + max) / 2;
  let width = windowWidth ?? Math.max(max - min, 1);

  // Keep the initial render slightly smaller so the whole image fits in the viewer.
  const maxDim = 520;
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
      let v = getPixel(r, c);
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
  const [parsedData, setParsedData] = useState<{ arrayBuffer: ArrayBuffer; metadata: Record<string, string>; numberOfFrames: number } | null>(null);
  const [running, setRunning] = useState(false);
  const [currentFrame, setCurrentFrame] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);

  const [activeTool, setActiveTool] = useState<'rect' | 'circle' | 'text' | 'eraser' | 'pen'>('pen');
  const [annotationColor, setAnnotationColor] = useState(annotationColors[0]);
  const [annotationOpacity, setAnnotationOpacity] = useState(80);
  const [annotations, setAnnotations] = useState<AnnotationShape[]>([]);
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
      setAnnotations([]);
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

  const drawAnnotationsOnOverlay = useCallback(() => {
    const canvas = canvasRef.current;
    const overlay = overlayRef.current;
    if (!canvas || !overlay || !overlay.getContext('2d')) return;
    overlay.width = canvas.width;
    overlay.height = canvas.height;
    const ctx = overlay.getContext('2d')!;
    ctx.clearRect(0, 0, overlay.width, overlay.height);
    annotations.forEach((a) => {
      ctx.strokeStyle = a.color;
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
      } else if (a.type === 'text' && a.text) {
        ctx.font = '16px system-ui';
        ctx.fillStyle = a.color;
        ctx.fillText(a.text, a.x, a.y);
      } else if (a.type === 'path' && a.points && a.points.length >= 2) {
        ctx.beginPath();
        ctx.moveTo(a.points[0].x, a.points[0].y);
        for (let i = 1; i < a.points.length; i++) ctx.lineTo(a.points[i].x, a.points[i].y);
        ctx.stroke();
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
    if (isDrawing && drawStart && drawCurrent && (activeTool === 'rect' || activeTool === 'circle')) {
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
    }
  }, [annotations, isDrawing, drawStart, drawCurrent, drawingPath, activeTool, annotationColor, annotationOpacity]);

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
        if (a.type === 'text') return Math.abs(a.x - px) < 30 && Math.abs(a.y - py) < 15;
        if (a.type === 'path' && a.points && a.points.length >= 2) {
          const threshold = 10;
          for (let i = 0; i < a.points.length - 1; i++) {
            const p1 = a.points[i];
            const p2 = a.points[i + 1];
            const dx = p2.x - p1.x;
            const dy = p2.y - p1.y;
            const len = Math.hypot(dx, dy) || 1;
            const t = Math.max(0, Math.min(1, ((px - p1.x) * dx + (py - p1.y) * dy) / (len * len)));
            const projX = p1.x + t * dx;
            const projY = p1.y + t * dy;
            if (Math.hypot(px - projX, py - projY) <= threshold) return true;
          }
          return false;
        }
        if (a.w == null || a.h == null) return false;
        if (a.type === 'rect') return px >= a.x && px <= a.x + a.w && py >= a.y && py <= a.y + a.h;
        const cx = a.x + a.w / 2;
        const cy = a.y + a.h / 2;
        const rx = Math.max(a.w / 2, 1);
        const ry = Math.max(a.h / 2, 1);
        return ((px - cx) / rx) ** 2 + ((py - cy) / ry) ** 2 <= 1;
      };
      for (let i = annotations.length - 1; i >= 0; i--) {
        if (contains(annotations[i], x, y)) {
          setAnnotations((prev) => prev.filter((_, j) => j !== i));
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
    if (activeTool === 'rect' || activeTool === 'circle') {
      setIsDrawing(true);
      setDrawStart({ x, y });
      setDrawCurrent({ x, y });
    } else if (activeTool === 'text') {
      const t = window.prompt('Text:');
      if (t) {
        setAnnotations((prev) => [
          ...prev,
          { id: String(Date.now()), type: 'text', color: annotationColor, opacity: annotationOpacity, x, y, text: t },
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
      setAnnotations((prev) => [
        ...prev,
        {
          id: String(Date.now()),
          type: 'path',
          color: annotationColor,
          opacity: annotationOpacity,
          x: drawingPath[0].x,
          y: drawingPath[0].y,
          points: [...drawingPath],
        },
      ]);
      setDrawingPath(null);
      setIsDrawing(false);
      return;
    }
    if (!isDrawing || !drawStart || !drawCurrent) return;
    const { x: x0, y: y0 } = drawStart;
    const { x: x1, y: y1 } = drawCurrent;
    const x = Math.min(x0, x1);
    const y = Math.min(y0, y1);
    const w = Math.abs(x1 - x0);
    const h = Math.abs(y1 - y0);
    if (w > 2 && h > 2) {
      setAnnotations((prev) => [
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
        },
      ]);
    }
    setIsDrawing(false);
    setDrawStart(null);
    setDrawCurrent(null);
  };

  const handleOverlayMouseLeave = () => {
    if (activeTool === 'pen' && drawingPath && drawingPath.length >= 2) {
      setAnnotations((prev) => [
        ...prev,
        {
          id: String(Date.now()),
          type: 'path',
          color: annotationColor,
          opacity: annotationOpacity,
          x: drawingPath[0].x,
          y: drawingPath[0].y,
          points: [...drawingPath],
        },
      ]);
      setDrawingPath(null);
    } else if (drawingPath) setDrawingPath(null);
    setIsDrawing(false);
    setDrawStart(null);
    setDrawCurrent(null);
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
                            <input
                              type="range"
                              min={0}
                              max={Math.max(0, parsedData.numberOfFrames - 1)}
                              value={currentFrame}
                              onChange={(e) => setCurrentFrame(Number(e.target.value))}
                              className="analysis-slider"
                            />
                            <span className="analysis-frame-label">
                              {currentFrame + 1} / {parsedData.numberOfFrames}
                            </span>
                          </div>
                        </div>
                      )}
                      <div className="analysis-zoom-wrapper">
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
                                  <canvas ref={canvasRef} className="analysis-dicom-canvas" />
                                  <canvas
                                    ref={overlayRef}
                                    className="analysis-annotation-overlay"
                                    onMouseDown={handleOverlayMouseDown}
                                    onMouseMove={handleOverlayMouseMove}
                                    onMouseUp={handleOverlayMouseUp}
                                    onMouseLeave={handleOverlayMouseLeave}
                                    style={{ cursor: activeTool === 'eraser' ? 'cell' : 'crosshair' }}
                                  />
                                </div>
                              </TransformComponent>
                            </>
                          )}
                        </TransformWrapper>
                      </div>
                    </div>
                    <div className="analysis-metadata">
                      <h4>Patient Info.</h4>
                      <dl>
                        {Object.entries(metadata).map(([k, v]) => (
                          <div key={k}>
                            <dt>{k}</dt>
                            <dd>{v}</dd>
                          </div>
                        ))}
                      </dl>
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
              <div className="annotation-tools">
                {annotationTools.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    className={`annotation-tool ${activeTool === t.id ? 'annotation-tool-active' : ''}`}
                    onClick={() => setActiveTool(t.id as typeof activeTool)}
                    title={t.label}
                  >
                    <t.icon size={20} />
                  </button>
                ))}
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
                  <h4>Annotations</h4>
                  <button
                    type="button"
                    className="btn analysis-clear-annotations"
                    onClick={() => {
                      setAnnotations([]);
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
                {annotations.length === 0 ? (
                  <p className="annotation-list-empty">No annotations yet. Draw on the scan.</p>
                ) : (
                  <ul className="annotation-list-ul">
                    {annotations.map((a, i) => (
                      <li key={a.id} className="annotation-list-item">
                        {a.type === 'text' ? `Text: ${a.text}` : a.type === 'path' ? `Freehand ${i + 1}` : `${a.type === 'circle' ? 'Circle' : 'Rectangle'} ${i + 1}`}
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
