import React from "react";
import JSZip from "jszip";
import ZipIcon from "./zip.svg";
import { Slide } from "./image-viewer";

interface ZipButton {
    slides: Slide[]
}

function ZipButton({ slides }: ZipButton) {
    async function downloadZip() {
        if (slides.length === 0) return;
        try {
            const imageBlobs = await fetchImageBlobs(slides);
            const fileNames = slides.map(slide => slide.src.split("/").pop() || slide.src);
            const zipData = await generateZipFile(imageBlobs, fileNames);
            downloadFile(window.URL.createObjectURL(zipData));
        }
        catch(err) { console.log(err) }
    }
    return (
        <button key='ACTION_ZIP' type='button' style={{ order: -1 }} className="yarl__button" onClick={downloadZip}>
            <img src={ZipIcon} className="yarl__icon" />
        </button>
    );
}

async function fetchImageBlobs(images: Slide[]) {
    const fetchExtractBlob = (image: Slide) => fetch(image.src)
        .then(response => {
            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
            return response.blob();
        });
    return Promise.all(images.map(fetchExtractBlob));
}

async function generateZipFile(blobs: Blob[], fileNames: string[]) {
    const zip = new JSZip();
    blobs.forEach((blob, i) => zip.file(fileNames[i], blob));
    return zip.generateAsync({
        type: "blob",
        streamFiles: true
    });
}

function downloadFile(url: string) {
    const link = document.createElement("a");
    link.href = url;
    link.download = "cone_images.zip";
    link.click();
    link.remove();
}

export { ZipButton }