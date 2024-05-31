import { createElement as $, useState, useEffect, createContext, useContext, useCallback, ReactNode } from 'react';
import { BusyMotionElement } from './busy-motion';

interface Overlay {
	id: string,
	priority: number,
	message: string
}

type ToggleOverlay = (on: boolean, newOverlay: Overlay) => void;


const OverlayContext = createContext<ToggleOverlay>(() => undefined);
OverlayContext.displayName = 'OverlayContext';


function OverlayManager({ children }: { children: ReactNode }) {
	const [overlays, setOverlays] = useState<Overlay[]>([]);

	const toggleOverlay = useCallback<ToggleOverlay>((on, newOverlay) => {
		setOverlays(prevState => [
			...prevState.filter(overlay => overlay.id !== newOverlay.id),
			...on ? [newOverlay] : []
		].sort((a, b) => a.priority - b.priority));
	}, []);

	return (
		$(OverlayContext.Provider, { value: toggleOverlay },
			children,
			overlays.length > 0 && $(GlobalOverlay, { textmsg: overlays[0].message }))
	);
}


function OverlayMessage({ id, priority, message }: Overlay) {
	const toggleOverlay = useContext(OverlayContext);
	useEffect(() => {
		const overlay = { id, priority, message };
		toggleOverlay(true, overlay);
		return () => toggleOverlay(false, overlay);
	}, [toggleOverlay]);
	return null;
}


const GlobalOverlay = ({ textmsg }: { textmsg: string }) => {
	const [elem,setElem] = useState<HTMLDivElement | null>(null)
	// @ts-ignore
	const mountNode = window.mountNode	// used in tkkiosk to apply overlay only for Cone UI part
	const bRect = mountNode?mountNode.getBoundingClientRect():null
	const sRect = bRect?{
		top:(bRect.top+mountNode.ownerDocument.defaultView.pageYOffset)+"px",
		left:bRect.left+"px",
		width:bRect.width+"px",
		height:bRect.height?bRect.height+"px":`calc(100vh - ${bRect.top}px)`
		}:null
	const style={
		display:mountNode&&window.getComputedStyle(mountNode).display=="none"?"none":"",
		position:"fixed",
		top:sRect?sRect.top:"0",
		left:sRect?sRect.left:"0",
		width:sRect?sRect.width:"100vw",
		height:sRect?sRect.height:"100vh",
		zIndex:"100011",
		color:"wheat",
		textAlign:"center",
		backgroundColor:"rgba(0,0,0,0.4)"
	}
	const wrapperEl = $('div',{style:{position:"relative",top:"calc(50% - 1em)"}},
		$(BusyMotionElement,{fill:'white', stop:false, mountNode, getEls: elem&&(()=>elem)}),
		textmsg?.length > 0 && $('pre', null, textmsg)
	)
	return $('div',{ref:setElem, style, className: "overlayMain"}, wrapperEl)
}

export { OverlayManager, OverlayMessage }