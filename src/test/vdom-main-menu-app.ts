import ReactDOM from "react-dom";
import { createElement as $ } from "react";
import { createSyncProviders } from "../main/vdom-hooks";
import { MainMenuBar, MenuFolderItem } from '../extra/main-menu-bar';

function App() {
    const child = $(MainMenuBar, {
        key: "TEST",
        identity: {parent: "test"},
        leftChildren: [
            $(MenuFolderItem, {
                key: 'menuFolderItem-1',
                identity: {parent: 'mainMenuBar'},
                name: 'Warehouse/Terminal',
                opened: false,
                current: false,
                icon: '',
                children: [
                    $(MenuFolderItem, {
                        key: 'menuFolderItem-11',
                        identity: {parent: 'menuFolderItem-1'},
                        name: 'Placement/Locations',
                        opened: false,
                        current: false,
                        icon: ''
                    }),
                    $(MenuFolderItem, {
                        key: 'menuFolderItem-12',
                        identity: {parent: 'menuFolderItem-1'},
                        name: 'Cargo',
                        opened: false,
                        current: false,
                        icon: ''
                    }),
                    $(MenuFolderItem, {
                        key: 'menuFolderItem-13',
                        identity: {parent: 'menuFolderItem-1'},
                        name: 'Service',
                        opened: false,
                        current: false,
                        icon: ''
                    }),
                    $(MenuFolderItem, {
                        key: 'menuFolderItem-14',
                        identity: {parent: 'menuFolderItem-1'},
                        name: 'Document Flow',
                        opened: false,
                        current: false,
                        icon: ''
                    })
                ]
            }),
            $(MenuFolderItem, {
                key: 'menuFolderItem-2',
                identity: {parent: 'mainMenuBar'},
                name: 'Registers',
                opened: false,
                current: false,
                icon: ''
            }),
            $(MenuFolderItem, {
                key: 'menuFolderItem-3',
                identity: {parent: 'mainMenuBar'},
                name: 'Reports',
                opened: false,
                current: false,
                icon: ''
            }),
            $(MenuFolderItem, {
                key: 'menuFolderItem-4',
                identity: {parent: 'mainMenuBar'},
                name: 'Configuration',
                opened: false,
                current: false,
                icon: ''
            }),
            $(MenuFolderItem, {
                key: 'menuFolderItem-5',
                identity: {parent: 'mainMenuBar'},
                name: 'Administrator',
                opened: false,
                current: false,
                icon: ''
            }),
            $(MenuFolderItem, {
                key: 'menuFolderItem-6',
                identity: {parent: 'mainMenuBar'},
                name: 'Developer',
                opened: false,
                current: false,
                icon: ''
            })
        ],
        // state: {
        //     inputValue: '45 LEGB [45 9 6]',
        //     mode: 'content',
        //     popupOpen: false,
        // },
        // content: [
        //     { text: 'LEGB', bgColor: '#43A047', textColor: '#000000' },
        //     { text: 'OPS HAMBURG' },
        //     { text: 'OPS ST.PETERSBURG' },
        //     { text: '45HC', bgColor: '#4db6ac', textColor: '#000000' }
        // ],
        // popupChildren: [
        //     $('p', { key: 'popupChild1' }, 'Hello World'),
        //     $('p', { key: 'popupChild2' }, 'Overlanded'),
        //     $('input', { key: 'popupChild3' })
        // ],
        // ro: false,
        // popupClassname: 'popupClassname'
    });
    const sender = {
        enqueue: (identity: any, patch: any) => console.log(patch)
    };
    const ack: boolean | null = null;

    return createSyncProviders({sender, ack, children: child});
}

const containerElement = document.createElement("div");
document.body.appendChild(containerElement);
ReactDOM.render($(App), containerElement);