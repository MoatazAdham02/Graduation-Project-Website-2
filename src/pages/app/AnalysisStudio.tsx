import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { Play, Loader2, Layers, Sliders, FileImage } from 'lucide-react';
import dicomParser from 'dicom-parser';
import './AnalysisStudio.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

type ScanItem = { id: string; originalName: string; size: number; createdAt: string };

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

  const maxDim = 600;
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
                          minScale={0.5}
                          maxScale={8}
                          limitToBounds={true}
                          centerOnInit={false}
                        >
                          <TransformComponent
                            wrapperStyle={{ width: '100%', height: '100%' }}
                            contentStyle={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-start' }}
                          >
                            <canvas ref={canvasRef} className="analysis-dicom-canvas" />
                          </TransformComponent>
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
          <div className="analysis-results-preview">
            <h4>Results</h4>
            <p className="analysis-results-placeholder">No results yet.</p>
          </div>
        </motion.aside>
      </div>
    </div>
  );
}
