import * as pdfjs from "pdfjs-dist";
import * as _JSZip from "jszip";
pdfjs.GlobalWorkerOptions.workerSrc = "./pdf.worker.min.mjs";
// ... inside pdfToCbz ...
async function pdfToCbz(file) {
    const pdf = await pdfjs.getDocument(await file.arrayBuffer()).promise;
    // Access JSZip from the window object to bypass ESM constructor issues
    const zip = new window.JSZip();
    // ... rest of your loop ...
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    // ... rest of your code ...
    const magnitude = Math.floor(Math.log10(pdf.numPages)) + 1; // order of magnitude
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
    const result = await zip.generateAsync({ type: "blob" });
    await pdf.destroy();
    return result;
}
function downloadCbz(blob, filename) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename.endsWith(".cbz") ? filename : `${filename}.cbz`;
    link.click();
    URL.revokeObjectURL(url);
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
    btn.innerText = "Converting...";
    btn.disabled = true;
    try {
        resultBlob = await pdfToCbz(file);
        btn.innerText = `Download ${originalFileName}`;
        btn.disabled = false;
    }
    catch (e) {
        btn.innerText = "Error Converting, see console";
        console.error(e);
    }
});
btn.addEventListener("click", () => {
    if (!resultBlob)
        return;
    const url = URL.createObjectURL(resultBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = originalFileName;
    a.click();
    URL.revokeObjectURL(url);
});
//# sourceMappingURL=script.js.map