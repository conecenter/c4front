import React from "react";
import { Expander, ExpanderArea } from '../main/expander-area';

interface MainMenuBar {
    key: string,
	identity: Object,
    leftChildren: MenuItem[],
    centralChildren: MenuItem[],
    rightChildren: MenuItem[],
    icon: string
}

type MenuItem = MenuFolderItem | MenuExecutableItem | MenuCustomItem;

interface MenuFolderItem {
    key: string,
	identity: Object,
    name: string,
    opened: Boolean,
    current: boolean,
    icon: string,
    children: Array<MenuItem | MenuItemsGroup>,
}

interface MenuExecutableItem {
    key: string,
	identity: Object,
    name: string,
    opened: Boolean,
    current: boolean,
    icon: string,
    isSelected: boolean 
}

interface MenuItemsGroup {
    key: string,
	identity: Object,
    current: boolean,
    children: MenuItem[]
}

type MenuCustomItem = any;

export function MainMenuBar() {
    const element1 = (
        <div key='left-menu' area="lt" className='leftMenuBox' expandOrder={1}>Hello world!</div>
    );
    const element2 = (
        <div key='right-menu' area="rt" expandOrder={0}>Hello world</div>
    );
    
    return (
			<div key='top-bar' className='mainMenuBar top-row hide-on-scroll'>
					<ExpanderArea maxLineCount={1} expandTo={[
                        <Expander key='left-menu' area="lt" expandOrder={0}>
                            <button key='left-menu' area="lt" className='btnBurger' expandTo={[
                                {leftChildren.forEach(child => <Expander key={child.key} area='lt'></Expander>)}
                            ]} />
                        </Expander>,
                        <Expander key='right-menu' area="rt" expandOrder={1}>
                            <div>Helloworld!Helloworld! Hello world! Hello world!</div>
                        </Expander>
                    ]} />
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