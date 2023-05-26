import React, {useState} from "react";
import Lightbox, { SlideImage } from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";

interface ImageViewer {
    key: string,
    identity: Object,
    open: boolean,
    slides?: SlideImage[]  // should be stable reference
}

function ImageViewer({}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        Open Lightbox
      </button>

      <Lightbox
        open={open}
        close={() => setOpen(false)}
        slides={[
          { src: "./left.jpg" }
        ]}
      />
    </>
  );
}

export {ImageViewer}