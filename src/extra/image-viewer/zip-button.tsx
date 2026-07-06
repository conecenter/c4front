import React from "react";
import JSZip from "jszip";
import ZipIcon from "./zip.svg";
import { SVGElement } from "../../main/image";
import { Slide } from "../../sapi/ee/cone/c4ui/c4gen.ImageViewerApi";

interface ZipButton {
    slides: Slide[]
}

function ZipButton({ slides }: ZipButton) {
    async function downloadZip() {
        if (slides.length === 0) return;
        try {
            const imageBlobs = await fetchImageBlobs(slides);
            const reserveFilenames = slides.map(slide => slide.src.split("/").pop() || slide.src);
            const zipData = await generateZipFile(imageBlobs, reserveFilenames);
            downloadFile(window.URL.createObjectURL(zipData));
        }
        catch(err) { console.log(err) }
    }
    return (
        <button type='button' style={{ order: -1 }} className="yarl__button" onClick={downloadZip}>
            <SVGElement url={ZipIcon} className="yarl__icon" alt="Zip button" />
        </button>
    );
}

interface ImageBlobData {
    blob: Blob;
    filename?: string;
}

async function fetchImageBlobs(images: Slide[]): Promise<ImageBlobData[]> {
    const fetchExtractBlob = (image: Slide) => fetch(image.src)
        .then(response => {
            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
            const contentDispositionHeader = response.headers.get('Content-Disposition');
            const filename = contentDispositionHeader?.match(/filename="(.+)"/)?.[1];
            return response.blob().then(blob => ({ blob, filename }));
        });
    return Promise.all(images.map(fetchExtractBlob));
}

async function generateZipFile(imageBlobs: ImageBlobData[], reserveFilenames: string[]) {
    const zip = new JSZip();
    const usedFilenames = new Map<string, number>();
    imageBlobs.forEach(({filename, blob}, i) => {
        const originalFilename = filename || reserveFilenames[i];
        zip.file(uniqueFilename(originalFilename, usedFilenames), blob);
    });
    return zip.generateAsync({
        type: "blob",
        streamFiles: true
    });
}

function uniqueFilename(filename: string, usedFilenames: Map<string, number>) {
    const key = filename.toLowerCase(); // Windows may treat filenames as case-insensitive
    const usedCount = usedFilenames.get(key) || 0;
    usedFilenames.set(key, usedCount + 1);
    if (usedCount === 0) return filename;

    const lastDotIndex = filename.lastIndexOf(".");
    if (lastDotIndex <= 0) return `${filename} (${usedCount + 1})`;

    return `${filename.slice(0, lastDotIndex)} (${usedCount + 1})${filename.slice(lastDotIndex)}`;
}

function downloadFile(url: string) {
    const link = document.createElement("a");
    link.href = url;
    link.download = "cone_images.zip";
    link.click();
    link.remove();
}

export { ZipButton }
