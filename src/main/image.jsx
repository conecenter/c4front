import React, { useEffect, useState } from 'react'
import clsx from 'clsx';
import useSWR from 'swr';

const ADAPTIVE_COLOR = "adaptive";

const clear = (url) => url.replace(/#.*$/, "")
const isDataUrl = (src) => src.startsWith("data:image/svg");
const replaceSvgTag = (str) => str.replace(/<\/svg>|<svg>|<svg\s[^>]*>/g, "")

const fetcher = async (url) => {
    const res = await fetch(url);
    if (!res.ok) throw new Error('Network response was not OK');
    return res.text();
}

const SVGElement = ({ url, color = ADAPTIVE_COLOR, ...props }) => {
    const toDecode = isDataUrl(url)
    const { data: fetched, error } = useSWR(toDecode ? null : url, fetcher)
    if (error) {
        console.warn(`SVG load failed: ${url}`, error);
        return <svg className={props.className} style={props.style} />;
    }
    const decodedContent = fetched || toDecode && decodeBase64String(url.replace(/data:.+?,/, ""));
    if (!decodedContent) return null;
    const viewBox = getViewBox(decodedContent)
    const content = replaceSvgTag(decodedContent)
    const fillColor = color == ADAPTIVE_COLOR ? "currentColor" : color
    return (
        <svg
            dangerouslySetInnerHTML={{ __html: content }}
            viewBox={viewBox}
            fill={fillColor}
            className={props.className}
            style={props.style}
            onClick={props.onClick}
            alt={props.alt} // used for testing & ensure unified API with ImageElement
        />
    );
}

function decodeBase64String(base64) {
    const binString = atob(base64);
    const bytes = Uint8Array.from(binString, (m) => m.codePointAt(0));
    try {
        return new TextDecoder().decode(bytes);
    } catch(e) {
        console.log(e);
        return '';
    }
}

function getViewBox(str) {
    const reg = /\bviewBox=(?:"([^"]+)"|'([^']+)')/
    const res = str.match(reg)
    if (res) return res[1] || res[2];
    const { width = 0, height = 0 } = extractSizes(str);
    return `0 0 ${width} ${height}`;
}

function extractSizes(str) {
    const getSizeReg = (size) => RegExp(`<svg[^>]*${size}=["'](\\d+)`);
    return {
        width: str.match(getSizeReg('width'))?.[1],
        height: str.match(getSizeReg('height'))?.[1]
    }
}

const ImageElement = (props) => {
    const { src, forceSrcWithoutPrefix, title, className, rotate, color, draggable, description } = props
    const _className = clsx(className, rotate && "transitions")
    const style = { ...rotate && { transform: `rotate(${rotate})` } }
    const isDataUrlSvg = isDataUrl(src);
    const alt = description || title || (!isDataUrlSvg && src) || undefined;
    const _src = !forceSrcWithoutPrefix ? (window.feedbackUrlPrefix || "") + src : src
    if (src === "")
        return <svg className={_className} style={style} color={color}></svg>
    else if (color || isDataUrlSvg)
        return <SVGElement url={clear(_src)} className={_className} style={style} color={color} alt={alt} />
    else
        return <img src={_src} title={title} className={_className} style={style} draggable={draggable} alt={alt} />
}

const MJPEGStreamElement = (props) => {
    const { mjpegSrc, h, streamW, streamH, evSource, title } = props
    const style = { height: `${h}px`, display: `inline-block` }

    const cofY = h / streamH
    const w = streamW / (streamH / h)
    const cofX = w / streamW

    const [rects, setRects] = useState([]);

    function myClear(data) {
        let rects = []
        if ('result' in data) {
            if ('plates' in data['result']) {
                data['result']['plates'].forEach(plate => {
                    if ('car' in plate) {
                        let car = plate['car']['warpedBox']
                        let luX = car[0] * cofX
                        let luY = car[1] * cofY

                        let drX = car[4] * cofX
                        let drY = car[5] * cofY
                        let rect = {
                            key: `${Date.now()}`,
                            width: '' + (drX - luX) + 'px',
                            height: '' + (drY - luY) + 'px',
                            x: "" + luX + "px",
                            y: "" + luY + "px"
                        }
                        rects.push(rect)
                    }
                })
            }
        }
        setRects(rects)
    }

    useEffect(() => {
        if (evSource) {
            const eventSource = new EventSource(evSource);
            eventSource.onmessage = (event) => {
                const parsedData = JSON.parse(event.data);
                myClear(parsedData)
            };
            return () => eventSource.close()
        }
    }, [evSource])
    const mstyle = { fill: "none", strokeWidth: 3, stroke: "greenyellow" }
    return (<div style={style} className={"mjpegDiv"}>
        <img src={mjpegSrc} title={title} style={style} />
        <svg className={"mjpegInner"} viewBox={`0 0 ${w} ${h}`}>
            {rects.map(item => (
                <rect key={item.key} width={item.width} height={item.height} x={item.x} y={item.y} style={mstyle} />
            ))}
        </svg>
    </div>)
}

export { ImageElement, SVGElement, MJPEGStreamElement }