import * as pdfjs from "pdfjs-dist";
pdfjs.GlobalWorkerOptions.workerSrc = new URL("./node_modules/pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).href;
async function pdfToCbz(file) {
    const pdf = await pdfjs.getDocument(await file.arrayBuffer()).promise;
    const zip = new window.JSZip();
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const magnitude = Math.floor(Math.log10(pdf.numPages)) + 1;
    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 1.5 });
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const renderContext = {
            canvasContext: ctx,
            canvas: canvas,
            viewport: viewport,
        };
        await page.render(renderContext).promise;
        const blob = await new Promise((r) => canvas.toBlob((b) => r(b), "image/jpeg", 0.7));
        zip.file(`${i.toString().padStart(magnitude, "0")}.jpg`, blob);
        page.cleanup();
    }
    canvas.width = 0;
    canvas.height = 0;
    const result = await zip.generateAsync({ type: "blob", mimeType: "application/vnd.comicbook+zip" });
    await pdf.destroy();
    return result;
}
let resultBlob = null;
let originalFileName = "comic.cbz";
const input = document.getElementById("picker");
const btn = document.getElementById("btn");
input.addEventListener("change", async () => {
    const file = input.files?.[0];
    if (!file)
        return;
    originalFileName = file.name.replace(/\.[^/.]+$/, "") + ".cbz";
    btn.textContent = "Converting...";
    btn.disabled = true;
    try {
        resultBlob = await pdfToCbz(file);
        btn.textContent = `Download ${originalFileName}`;
        btn.disabled = false;
    }
    catch (e) {
        btn.textContent = "Error Converting";
        console.error(e);
    }
});
btn.addEventListener("click", async () => {
    if (!resultBlob)
        return;
    const sw = await navigator.serviceWorker.ready;
    sw.active.postMessage({ filename: originalFileName, blob: resultBlob });
    window.location.href = "/pdf-cbz/download/" + originalFileName;
});
//# sourceMappingURL=script.js.map