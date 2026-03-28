import * as pdfjs from "pdfjs-dist";
import type { PDFDocumentProxy, PDFPageProxy } from "pdfjs-dist";
import type JSZipType from "jszip";

type PageViewport = ReturnType<PDFPageProxy["getViewport"]>;
interface RenderParameters {
    canvasContext: CanvasRenderingContext2D;
    viewport: PageViewport;
    canvas: HTMLCanvasElement;
}

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    "./node_modules/pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url
).href;

async function pdfToCbz(file: File): Promise<Blob> {
    const pdf: PDFDocumentProxy = await pdfjs.getDocument(await file.arrayBuffer()).promise;

    const zip: JSZipType = new (window as any).JSZip();

    const canvas: HTMLCanvasElement = document.createElement("canvas");
    const ctx: CanvasRenderingContext2D = canvas.getContext("2d")!;
    const magnitude: number = Math.floor(Math.log10(pdf.numPages)) + 1;

    for (let i: number = 1; i <= pdf.numPages; i++) {
        const page: PDFPageProxy = await pdf.getPage(i);
        const viewport: PageViewport = page.getViewport({ scale: 1.5 });

        canvas.width = viewport.width;
        canvas.height = viewport.height;

        const renderContext: RenderParameters = {
            canvasContext: ctx,
            canvas: canvas,
            viewport: viewport,
        };

        await page.render(renderContext).promise;

        const blob: Blob = await new Promise<Blob>((r) =>
            canvas.toBlob((b) => r(b!), "image/jpeg", 0.7),
        );
        zip.file(`${i.toString().padStart(magnitude, "0")}.jpg`, blob);

        page.cleanup();
    }

    canvas.width = 0;
    canvas.height = 0;

    const result: Blob = await zip.generateAsync({ type: "blob", mimeType: "application/vnd.comicbook+zip" });
    await pdf.destroy();
    return result;
}

let resultBlob: Blob | null = null;
let originalFileName: string = "comic.cbz";

const input = document.getElementById("picker") as HTMLInputElement;
const btn = document.getElementById("btn") as HTMLButtonElement;

input.addEventListener("change", async () => {
    const file = input.files?.[0];
    if (!file) return;

    originalFileName = file.name.replace(/\.[^/.]+$/, "") + ".cbz";

    btn.textContent = "Converting...";
    btn.disabled = true;

    try {
        resultBlob = await pdfToCbz(file);
        btn.textContent = `Download ${originalFileName}`;
        btn.disabled = false;
    } catch (e) {
        btn.textContent = "Error Converting";
        console.error(e);
    }
});

btn.addEventListener("click", async () => {
    if (!resultBlob) return;

    const sw = await navigator.serviceWorker.ready;
    sw.active!.postMessage({ filename: originalFileName, blob: resultBlob });

    window.location.href = "/pdf-cbz/download/" + originalFileName;
});
