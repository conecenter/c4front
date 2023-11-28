import React, { useMemo, useEffect, useState } from 'react'
import { useCached } from '../../../client/src/extra/components/cache-provider';

const initViewBox = "0 0 0 0"

const adaptiveTag = "#adaptive"

const clear = (url) => url.replace(/#.*$/, "")

const SVGElement = ({ url, ...props }) => {
    const toDecode = url.startsWith("data:")
    const fetched = useCached(toDecode ? "" : url)
    const decodedContent = fetched || toDecode && atob(url.replace(/data:.+?,/, ""))
    const viewBox = decodedContent && getViewBox(decodedContent) || initViewBox
    const content = decodedContent && replaceSvgTag(decodedContent) || ""
    const color = !props.color || props.color == "adaptive" ? "currentColor" : props.color

    const htmlObject = useMemo(() => ({ __html: content }), [content])
    return <svg
        dangerouslySetInnerHTML={htmlObject}
        viewBox={viewBox}
        fill={color}
        className={props.className}
        style={props.style}
        {...!toDecode && { imagesource: url }}
    />
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

function replaceSvgTag(str) {
    return str.replace(/<\/svg>|<svg>|<svg\s[^>]*>/g, "")
}

const ImageElement = (props) => {
    const { src, forceSrcWithoutPrefix, title, className, rotate, color, draggable } = props
    const _className = (className || "") + (rotate ? " transitions" : "")
    const style = { ...rotate && { transform: `rotate(${rotate})` } }
    const urlPrefix = window.feedbackUrlPrefix || ''
    const _src = !forceSrcWithoutPrefix ? (urlPrefix || "") + src : src
    if (src === "")
        return (<svg className={_className} style={style} color={color}></svg>)
    else if (color || src.startsWith("data:image/svg")) {
        const __src = clear(_src)
        return (<SVGElement url={__src} className={_className} style={style} color={color} />)
    }
    else {
        return (<img src={_src} imagesource={src} title={title} className={_className} style={style} draggable={draggable} />)
    }
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

export { ImageElement, SVGElement, MJPEGStreamElement, adaptiveTag }