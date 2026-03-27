import * as pdfjs from "pdfjs-dist";
import type { PDFDocumentProxy, PDFPageProxy } from "pdfjs-dist";
import * as _JSZip from "jszip";
// REMOVE: import * as _JSZip from "jszip";
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

// ... inside pdfToCbz ...

async function pdfToCbz(file: File): Promise<Blob> {
    const pdf: PDFDocumentProxy = await pdfjs.getDocument(await file.arrayBuffer()).promise;

    // Access JSZip from the window object to bypass ESM constructor issues
    const zip: JSZipType = new (window as any).JSZip();
    
    // ... rest of your loop ...
    const canvas: HTMLCanvasElement = document.createElement("canvas");
    const ctx: CanvasRenderingContext2D = canvas.getContext("2d")!;
    // ... rest of your code ...
    const magnitude: number = Math.floor(Math.log10(pdf.numPages)) + 1; // order of magnitude

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
    (canvas as any).width = 0; 
    (canvas as any).height = 0;

    const result: Blob = await zip.generateAsync({ type: "blob", mimeType: "application/vnd.comicbook+zip" });
    await pdf.destroy();
    return result;
}

function downloadCbz(blob: Blob, filename: string): void {
    const url: string = URL.createObjectURL(blob);
    const link: HTMLAnchorElement = document.createElement("a");
    link.href = url;
    link.download = filename.endsWith(".cbz") ? filename : `${filename}.cbz`;
    link.click();
    URL.revokeObjectURL(url);
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
        prompt("Copy error:", e as string);
    }
});

btn.addEventListener("click", () => {
    if (!resultBlob) return;

    const url: string = URL.createObjectURL(resultBlob);
    const a: HTMLAnchorElement = document.createElement("a");
    a.href = url;
    a.download = originalFileName;
    a.click();

    URL.revokeObjectURL(url);
});
