import { useEffect, useRef, useState } from "react";
import * as pdfjsLib from "pdfjs-dist";
import styles from "./PDFViewer.module.css";

// Set worker from public folder
pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf/pdf.worker.min.js";

interface PDFViewerProps {
  onWordClick: (word: string) => void;
  selectedWord: string | null;
}

export function PDFViewer({ onWordClick, selectedWord }: PDFViewerProps) {
  const canvasRefs = useRef<(HTMLCanvasElement | null)[]>([]);
  const [pages, setPages] = useState(0);
  const [pdfDocument, setPdfDocument] =
    useState<pdfjsLib.PDFDocumentProxy | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const arrayBuffer = await file.arrayBuffer();
    try {
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      setPdfDocument(pdf);
      setPages(pdf.numPages);
      canvasRefs.current = new Array(pdf.numPages);
      renderPages(pdf);
    } catch (error) {
      console.error("Error loading PDF:", error);
    }
  };

  const renderPages = async (pdf: pdfjsLib.PDFDocumentProxy) => {
    for (let i = 1; i <= Math.min(pdf.numPages, 20); i++) {
      renderPage(pdf, i);
    }
  };

  const renderPage = async (
    pdf: pdfjsLib.PDFDocumentProxy,
    pageNum: number,
  ) => {
    try {
      const page = await pdf.getPage(pageNum);
      const viewport = page.getViewport({ scale: 1.5 });
      const canvas = canvasRefs.current[pageNum - 1];

      if (!canvas) return;

      canvas.width = viewport.width;
      canvas.height = viewport.height;

      const context = canvas.getContext("2d");
      if (!context) return;

      await page.render({
        canvasContext: context,
        viewport: viewport,
      } as any).promise;

      // Add text layer for selection
      const textContent = await page.getTextContent();
      renderTextLayer(canvas, textContent, viewport);
    } catch (error) {
      console.error(`Error rendering page ${pageNum}:`, error);
    }
  };

  const renderTextLayer = (
    canvas: HTMLCanvasElement,
    textContent: any,
    viewport: pdfjsLib.PageViewport,
  ) => {
    const container = canvas.parentElement as HTMLDivElement;
    if (!container) return;

    // Clear existing text layer
    const existingLayer = container.querySelector(".pdf-text-layer");
    if (existingLayer) existingLayer.remove();

    const textLayer = document.createElement("div");
    textLayer.className = `${styles.textLayer} pdf-text-layer`;
    textLayer.style.width = canvas.width + "px";
    textLayer.style.height = canvas.height + "px";

    // Scale factor from page coordinates to canvas coordinates
    const scale = viewport.scale;

    textContent.items.forEach((item: any) => {
      const text = item.str;
      const itemX = item.transform[4];
      const itemY = item.transform[5];
      const itemHeight = item.height;
      const itemWidth = item.width || text.length * itemHeight * 0.5;

      // Calculate average character width
      const avgCharWidth = itemWidth / (text.length || 1);

      // Split text into words but keep track of positions
      let currentX = 0;
      const textTokens = text.split(/(\s+)/); // Keep whitespace

      textTokens.forEach((token: string) => {
        if (!token.trim()) {
          // Skip whitespace, but advance position
          currentX += token.length * avgCharWidth;
          return;
        }

        const span = document.createElement("span");
        span.textContent = token;
        span.className = styles.textSpan;

        // Calculate position for this specific word
        const tokenWidth = token.length * avgCharWidth;
        const x = itemX + currentX;
        const y = itemY;

        // Position in canvas coordinates (scaled and inverted for canvas)
        // Remove this line:
        // span.style.width = (tokenWidth * scale) + 'px';

        // Keep everything else the same
        span.style.left = x * scale - 4 + "px";
        span.style.top = canvas.height - (y + itemHeight) * scale + 3 + "px";
        span.style.fontSize = itemHeight * scale + "px";
        span.style.height = itemHeight * scale + "px";
        span.style.fontFamily = "sans-serif";
        span.style.lineHeight = itemHeight * scale + "px";

        span.addEventListener("click", (e) => {
          e.stopPropagation();
          e.preventDefault();
          const cleanWord = token.replace(/[^a-zA-Z'-]/g, "");
          if (cleanWord.length >= 2) {
            onWordClick(cleanWord);
          }
        });

        if (
          selectedWord &&
          token.toLowerCase().includes(selectedWord.toLowerCase())
        ) {
          span.classList.add(styles.highlighted);
        }

        textLayer.appendChild(span);
        currentX += tokenWidth;
      });
    });

    container.appendChild(textLayer);
  };

  useEffect(() => {
    // Update highlights when selected word changes
    if (pdfDocument && selectedWord) {
      const textSpans = document.querySelectorAll(`.${styles.textSpan}`);
      textSpans.forEach((span) => {
        const text = span.textContent || "";
        if (text.toLowerCase() === selectedWord.toLowerCase()) {
          span.classList.add(styles.highlighted);
        } else {
          span.classList.remove(styles.highlighted);
        }
      });
    } else {
      // Remove all highlights if no word selected
      const textSpans = document.querySelectorAll(`.${styles.textSpan}`);
      textSpans.forEach((span) => {
        span.classList.remove(styles.highlighted);
      });
    }
  }, [selectedWord, pdfDocument]);

  return (
    <div className={styles.pdfContainer}>
      {pdfDocument && (
        <div className={styles.pagesContainer}>
          {Array.from({ length: pages }).map((_, i) => (
            <div key={i} className={styles.pageWrapper}>
              <canvas
                ref={(el) => {
                  if (el) canvasRefs.current[i] = el;
                }}
                className={styles.pdfCanvas}
              />
            </div>
          ))}
        </div>
      )}

      {!pdfDocument && (
        <div className={styles.emptyState}>
          <svg
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
            <polyline points="13 2 13 9 20 9" />
        
          </svg>

          <div className={styles.uploadSection}>
            <label htmlFor="pdf-input" className={styles.uploadLabel}>
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              <span>Upload PDF</span>
            </label>
            <input
              id="pdf-input"
              type="file"
              accept=".pdf"
              onChange={handleFileUpload}
              className={styles.fileInput}
            />
          </div>
          <p className={styles.hint}>Click any word in the PDF to look it up</p>
        </div>
      )}
    </div>
  );
}
