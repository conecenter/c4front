import React, { createElement as $, useState, useEffect, createContext, useContext, useCallback } from 'react';
import { BusyMotionElement } from './busy-motion';

const OverlayContext = createContext();
OverlayContext.displayName = 'OverlayContext';

function OverlayManager({ children }) {
	const [overlays, setOverlays] = useState([]);

	const toggleOverlay = useCallback((on, newOverlay) => {
		setOverlays(prevState => [
			...prevState.filter(overlay => overlay.id !== newOverlay.id),
			...on ? [newOverlay] : []
		].sort((a, b) => a.priority - b.priority));
	}, []);

	return (
		$(OverlayContext.Provider, { value: toggleOverlay },
			children,
			overlays.length > 0 && $(OverlayWrapper, { textmsg: overlays[0].message }))
	);
}

function OverlayMessage({ id, priority, message }) {
	const toggleOverlay = useContext(OverlayContext);
	useEffect(() => {
		const overlay = { id, priority, message };
		toggleOverlay(true, overlay);
		return () => toggleOverlay(false, overlay);
	}, [toggleOverlay]);
	return null;
}

const OverlayWrapper = (props) => {
	const elem = React.createRef(null)
	const [state,setState] = React.useState({elem:null})
	const mountNode = window.mountNode
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
		backgroundColor:"rgba(0,0,0,0.4)",
	}
	React.useEffect(()=>{
		setState({elem:elem.current})
		return ()=>{}
	},[])
	const wrapperEl = $('div',{style:{position:"relative",top:"calc(50% - 1em)"}},
		$(BusyMotionElement,{fill:'white', stop:false, mountNode, getEls: state.elem&&(()=>state.elem)}),
		props.textmsg?.length > 0 && $('pre', null, props.textmsg)
	)
	return $('div',{ref:elem, style, className: "overlayMain"}, wrapperEl)
}

export { OverlayManager, OverlayMessage }