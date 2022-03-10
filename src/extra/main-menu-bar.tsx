import React, { ReactNode } from "react";
import { ExpanderArea } from '../main/expander-area';

interface MainMenuBarProps {
    key: string,
	identity: Object,
    leftChildren: MainMenuFolderItem[],
    centralChildren: ReactNode[],
    rightChildren: ReactNode[],
    className: string,
    logoImg?: string
}

interface MainMenuFolderItem {
    key: string,
	identity: Object,  // ???
    name: string,
    popupLrMode: boolean,  // or menuItemLevel
    isSelected: boolean,  // = popupOpen
    children: Array<MainMenuFolderItem | MainMenuExecutableItem | MainMenuItemsGroup>,
    className?: string
}

interface MainMenuExecutableItem {
    key: string,
	identity: Object,
    name: string,
    picture: string,
    isSelected: boolean 
}

interface MainMenuItemsGroup {
    key: string,
		identity: Object,
    children: Array<MainMenuExecutableItem | MainMenuFolderItem>
}

export function MainMenuBar() {
    const mainMenuElements = (
			<>
				<div key='left-menu' area="lt" className='leftMenuBox' >Hello world!</div>
				<div key='right-menu' area="rt">Hello world</div>
			</>
    );
    return (
			<div key='top-bar' className='mainMenuBar top-row hide-on-scroll'>
					<ExpanderArea expandTo={[mainMenuElements]} maxLineCount={1} />
			</div>            
    );
}

/*
$("div", {
    key: "top-bar",
    tabIndex: "1"
}, [
    $("div", {
        key: "left",
    }, state.isBurger ? menuBurger : left),
    $("div", { key: "right", style: { alignSelf: "center" } }, right)
])
*/

// "data-path": props.path - where used?