import React from 'react'

const busySvg = (fill) =>
	`<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" id="Capa_1" x="0px" y="0px" viewBox="0 0 500 500" style="enable-background:new 0 0 500 500;margin-right:0.5em;vertical-align:-0.2em;height:1em;width:1em;" xml:space="preserve">
		<path style="fill: transparent" data-selected="true" d="M250,0c14,0,24,10,24,24v94c0,14-10,25-24,25s-25-11-25-25V24C225,10,236,0,250,0z"></path>
		<path style="fill: ${fill}" d="M137,53l55,76c12,16,0,39-20,39c-8,0-14-3-19-10L98,82c-8-11-6-26,5-34S129,42,137,53z"></path>
		<path style="fill: ${fill}" d="M28,204c-13-4-20-18-16-31s18-20,31-16l89,29c13,4,20,18,16,31c-3,10-14,17-24,17c-3,0-4-1-7-2   L28,204z"></path>
		<path style="fill: ${fill}" d="M148,283c4,13-3,27-16,31l-89,29c-3,1-5,1-8,1c-10,0-20-7-23-17c-4-13,3-27,16-31l89-29   C130,263,144,270,148,283z"></path>
		<path style="fill: ${fill}" d="M187,337c11,8,13,23,5,34l-55,76c-5,7-12,10-20,10c-20,0-31-23-19-39l55-76C161,331,176,329,187,337   z"></path>
		<path style="fill: ${fill}" d="M250,357c14,0,24,11,24,25v93c0,14-10,25-24,25s-25-11-25-25v-93C225,368,236,357,250,357z"></path>
		<path style="fill: ${fill}" d="M347,342l55,76c12,16,0,39-20,39c-8,0-14-3-19-10l-55-76c-8-11-6-26,5-34S339,331,347,342z"></path>
		<path style="fill: ${fill}" d="M472,296c13,4,20,18,16,31c-3,10-14,17-24,17c-3,0-4,0-7-1l-89-29c-13-4-20-18-16-31s18-20,31-16   L472,296z"></path>
		<path style="fill: ${fill}" d="M352,217c-4-13,3-27,16-31l89-29c13-4,27,3,31,16s-3,27-16,31l-89,28c-3,1-5,2-8,2   C365,234,355,227,352,217z"></path>
		<path style="fill: ${fill}" d="M327,168c-20,0-31-23-19-39l55-76c8-11,23-13,34-5s13,23,5,34l-55,76C342,165,335,168,327,168z"></path>
	</svg>`

const startCircularMotion = (props) => () =>{	 		
    const els = props.getEls?.()
    Array.isArray(els) && els.forEach(el=>{
        const mountNode = props.mountNode
        el.style.display = mountNode&&props.getComputedStyle(mountNode).display=="none"?"none":""
        if(mountNode) el.style.width = mountNode.getBoundingClientRect().width + "px"		
    })
    const markedInnerPath = props.elem.querySelector('path[data-selected="true"]')
    const nextMarkedInnerPath = markedInnerPath.previousElementSibling?markedInnerPath.previousElementSibling:markedInnerPath.parentNode.lastElementChild			
    markedInnerPath.style.fill = props.fill
    if(markedInnerPath.dataset){
        markedInnerPath.dataset.selected = false
        nextMarkedInnerPath.style.fill = 'transparent'
        nextMarkedInnerPath.dataset.selected = true			
    }
}	

const BusyMotionElement = (props) =>{
	const elem = React.createRef(null)
	React.useEffect(()=>{
		elem.current.innerHTML = busySvg(props.fill)		
	},[])
	React.useEffect(()=>{
		let timeout
		if(!props.stop){
			const params = {
				...props,
				elem:elem.current,
				getComputedStyle: ()=>elem.current.ownerDocument.defaultView.getComputedStyle
			}
			timeout = elem.current.ownerDocument.defaultView.setInterval(startCircularMotion(params), 100)
		}		
		const clearInterval = elem.current.ownerDocument.defaultView.clearInterval
		return () =>{
			clearInterval(timeout)
		}
	}, [props.stop])
	return (React.createElement('div', { ref: elem}))
}

export {BusyMotionElement}