import ReactDOM from "react-dom";
import { createElement as $ } from "react";
import { createSyncProviders } from "../../main/vdom-hooks";
import { MainMenuBar, MenuFolderItem, MenuExecutableItem, MenuItemsGroup } from '../../extra/main-menu-bar';

function App() {
    const child = $(MainMenuBar, {
        key: "TEST",
        identity: {parent: "test"},
        state: { opened: false },
        leftChildren: [
            $(MenuFolderItem, {
                key: 'menuFolderItem-1',
                identity: {parent: 'mainMenuBar'},
                name: 'Warehouse/Terminal',
                current: false,
                state: { opened: false },
                children: [
                    $(MenuExecutableItem, {
                        key: 'menuExecutableItem-1',
                        identity: {parent: 'menuFolderItem-1'},
                        name: 'Main Console',
                        current: false,
                        state: { opened: false },
                        icon: '../main-menu/main_console.svg'
                    }),
                    $(MenuExecutableItem, {
                        key: 'menuExecutableItem-2',
                        identity: {parent: 'menuFolderItem-1'},
                        name: 'Temperature Control',
                        current: false,
                        state: { opened: false },
                        icon: '../main-menu/thermometer.svg'
                    }),
                    $(MenuItemsGroup, {
                        key: 'menuItemsGroup1',
                        identity: {parent: 'menuFolderItem-1'},
                        children: [
                            $(MenuExecutableItem, {
                                key: 'menuExecutableItem-3',
                                identity: {parent: 'menuFolderItem-1'},
                                name: 'Activity Dashboard',
                                current: false,
                                state: { opened: false },
                                icon: '../main-menu/dashboard.svg'
                            }),
                            $(MenuExecutableItem, {
                                key: 'menuExecutableItem-4',
                                identity: {parent: 'menuFolderItem-1'},
                                name: 'Railway Processing',
                                current: false,
                                state: { opened: false },
                                icon: '../main-menu/train.svg'
                            }),
                            $(MenuExecutableItem, {
                                key: 'menuExecutableItem-5',
                                identity: {parent: 'menuFolderItem-1'},
                                name: 'Units on Hold',
                                current: false,
                                state: { opened: false },
                                icon: ''
                            }),
                        ]
                    }),                    
                    $(MenuFolderItem, {
                        key: 'menuFolderItem-18',
                        identity: {parent: 'menuFolderItem-1'},
                        name: 'Reports about finances',
                        current: false,
                        state: { opened: false },
                        icon: '',
                        children: [
                            $(MenuExecutableItem, {
                                key: 'menuExecutableItem-18',
                                identity: {parent: 'menuFolderItem-18'},
                                name: 'Main Console',
                                current: false,
                                state: { opened: false },
                                icon: '../main-menu/main_console.svg'
                            }),
                            $(MenuExecutableItem, {
                                key: 'menuExecutableItem-28',
                                identity: {parent: 'menuFolderItem-18'},
                                name: 'Topologies',
                                current: false,
                                state: { opened: false },
                                icon: '../main-menu/area.svg'
                            }),
                            $(MenuExecutableItem, {
                                key: 'menuExecutableItem-38',
                                identity: {parent: 'menuFolderItem-18'},
                                name: 'Units on Hold',
                                current: false,
                                state: { opened: false },
                                icon: ''
                            })
                        ]
                    }),
                ]
            }),
            $(MenuFolderItem, {
                key: 'menuFolderItem-2',
                identity: {parent: 'mainMenuBar'},
                name: 'Registers',
                current: false,
                state: { opened: false },
                icon: ''
            }),
            $(MenuFolderItem, {
                key: 'menuFolderItem-3',
                identity: {parent: 'mainMenuBar'},
                name: 'Reports',
                current: false,
                state: { opened: false },
                icon: ''
            }),
            $(MenuFolderItem, {
                key: 'menuFolderItem-4',
                identity: {parent: 'mainMenuBar'},
                name: 'Configuration',
                current: false,
                state: { opened: false },
                icon: '',
                children: [
                    $(MenuFolderItem, {
                        key: 'menuFolderItem-11',
                        identity: {parent: 'menuFolderItem-1'},
                        name: 'Placement / Locations',
                        current: false,
                        state: { opened: false },
                        icon: '',
                        children: [
                            $(MenuExecutableItem, {
                                key: 'menuExecutableItem-1',
                                identity: {parent: 'menuFolderItem-11'},
                                name: 'Locations',
                                current: false,
                                state: { opened: false },
                                icon: ''
                            }),
                            $(MenuExecutableItem, {
                                key: 'menuExecutableItem-2',
                                identity: {parent: 'menuFolderItem-11'},
                                name: 'Topologies',
                                current: false,
                                state: { opened: false },
                                icon: '../main-menu/area.svg'
                            }),
                            $(MenuExecutableItem, {
                                key: 'menuExecutableItem-3',
                                identity: {parent: 'menuFolderItem-11'},
                                name: 'Storage Spaces',
                                current: false,
                                state: { opened: false },
                                icon: '../main-menu/storage_space.svg'
                            })
                        ]
                    }),
                    $(MenuFolderItem, {
                        key: 'menuFolderItem-12',
                        identity: {parent: 'menuFolderItem-1'},
                        name: 'Cargo',
                        current: false,
                        state: { opened: false },
                        icon: ''
                    }),
                    $(MenuFolderItem, {
                        key: 'menuFolderItem-13',
                        identity: {parent: 'menuFolderItem-1'},
                        name: 'Service',
                        current: false,
                        state: { opened: false },
                        icon: ''
                    }),
                    $(MenuFolderItem, {
                        key: 'menuFolderItem-14',
                        identity: {parent: 'menuFolderItem-1'},
                        name: 'Document Flow',
                        current: false,
                        state: { opened: false },
                        icon: ''
                    })
                ]
            }),
            $(MenuFolderItem, {
                key: 'menuFolderItem-5',
                identity: {parent: 'mainMenuBar'},
                name: 'Administrator',
                current: false,
                state: { opened: false },
                icon: '',
                children: [
                    $(MenuFolderItem, {
                        key: 'menuFolderItem-11',
                        identity: {parent: 'menuFolderItem-1'},
                        name: 'Placement / Locations',
                        current: false,
                        state: { opened: false },
                        icon: '',
                        children: [
                            $(MenuExecutableItem, {
                                key: 'menuExecutableItem-1',
                                identity: {parent: 'menuFolderItem-11'},
                                name: 'Locations',
                                current: false,
                                state: { opened: false },
                                icon: ''
                            }),
                            $(MenuExecutableItem, {
                                key: 'menuExecutableItem-2',
                                identity: {parent: 'menuFolderItem-11'},
                                name: 'Topologies',
                                current: false,
                                state: { opened: false },
                                icon: '../main-menu/area.svg'
                            }),
                            $(MenuExecutableItem, {
                                key: 'menuExecutableItem-3',
                                identity: {parent: 'menuFolderItem-11'},
                                name: 'Storage Spaces',
                                current: false,
                                state: { opened: false },
                                icon: '../main-menu/storage_space.svg'
                            })
                        ]
                    }),
                    $(MenuFolderItem, {
                        key: 'menuFolderItem-12',
                        identity: {parent: 'menuFolderItem-1'},
                        name: 'Cargo',
                        current: false,
                        state: { opened: false },
                        icon: ''
                    }),
                    $(MenuFolderItem, {
                        key: 'menuFolderItem-13',
                        identity: {parent: 'menuFolderItem-1'},
                        name: 'Service',
                        current: false,
                        state: { opened: false },
                        icon: ''
                    }),
                    $(MenuFolderItem, {
                        key: 'menuFolderItem-14',
                        identity: {parent: 'menuFolderItem-1'},
                        name: 'Document Flow',
                        current: false,
                        state: { opened: false },
                        icon: ''
                    })
                ]
            }),
            $(MenuFolderItem, {
                key: 'menuFolderItem-6',
                identity: {parent: 'mainMenuBar'},
                name: 'Developer',
                current: true,
                state: { opened: false },
                icon: '',
                children: [
                    $(MenuExecutableItem, {
                        key: 'menuExecutableItem-1',
                        identity: {parent: 'menuFolderItem-1'},
                        name: 'Main Console',
                        current: false,
                        state: { opened: false },
                        icon: '../main-menu/main_console.svg'
                    }),
                    $(MenuExecutableItem, {
                        key: 'menuExecutableItem-2',
                        identity: {parent: 'menuFolderItem-1'},
                        name: 'Temperature Control',
                        current: true,
                        state: { opened: false },
                        icon: '../main-menu/thermometer.svg'
                    }),
                    $(MenuExecutableItem, {
                        key: 'menuExecutableItem-3',
                        identity: {parent: 'menuFolderItem-1'},
                        name: 'Activity Dashboard',
                        current: false,
                        state: { opened: false },
                        icon: '../main-menu/dashboard.svg'
                    }),
                    $(MenuExecutableItem, {
                        key: 'menuExecutableItem-4',
                        identity: {parent: 'menuFolderItem-1'},
                        name: 'Railway Processing',
                        current: false,
                        state: { opened: false },
                        icon: '../main-menu/train.svg'
                    }),
                    $(MenuExecutableItem, {
                        key: 'menuExecutableItem-5',
                        identity: {parent: 'menuFolderItem-1'},
                        name: 'Units on Hold',
                        current: false,
                        state: { opened: false },
                        icon: ''
                    }),
                    $(MenuFolderItem, {
                        key: 'menuFolderItem-1',
                        identity: {parent: 'menuFolderItem-1'},
                        name: 'Reports about finances',
                        current: false,
                        state: { opened: false },
                        icon: ''
                    }),
                ]
            })
        ]
    });
    const sender = {
        enqueue: (identity: any, patch: any) => console.log(patch, identity)
    };
    const ack: boolean | null = null;

    return createSyncProviders({sender, ack, children: child});
}

const containerElement = document.createElement("div");
document.body.appendChild(containerElement);
ReactDOM.render($(App), containerElement);