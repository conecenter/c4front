import ReactDOM from "react-dom";
import { createElement as $ } from "react";
import { createSyncProviders } from "../../main/vdom-hooks";
import { mainMenuComponents } from '../../extra/main-menu/main-menu-bar';

const { 
    MainMenuBar,
    MenuFolderItem, 
    MenuExecutableItem, 
    MenuItemsGroup, 
    MenuCustomItem, 
    MenuUserItem, 
    MainMenuClock 
} = mainMenuComponents;

function App() {
    const child = $(MainMenuBar, {
        key: "TEST",
        identity: {parent: "test"},
        state: { opened: false },
        icon: '../main-menu/HHLA_PLT_Italy.svg',
        leftChildren: [
            $(MenuFolderItem, {
                key: 'menuFolderItem-1',
                identity: {parent: 'mainMenuBar'},
                name: 'Warehouse/Terminal',
                current: false,
                state: { opened: false },
                icon: '../main-menu/main_console.svg',
                path: 'menuFolderItem-1',
                children: [
                    $(MenuExecutableItem, {
                        key: 'menuExecutableItem-1',
                        identity: {parent: 'menuFolderItem-1'},
                        name: 'Main Console',
                        current: false,
                        icon: '../main-menu/main_console.svg'
                    }),
                    $(MenuExecutableItem, {
                        key: 'menuExecutableItem-2',
                        identity: {parent: 'menuFolderItem-1'},
                        name: 'Temperature Control',
                        current: false,
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
                                icon: '../main-menu/dashboard.svg'
                            }),
                            $(MenuExecutableItem, {
                                key: 'menuExecutableItem-4',
                                identity: {parent: 'menuFolderItem-1'},
                                name: 'Railway Processing',
                                current: false,
                                icon: '../main-menu/train.svg'
                            }),
                            $(MenuExecutableItem, {
                                key: 'menuExecutableItem-5',
                                identity: {parent: 'menuFolderItem-1'},
                                name: 'Units on Hold',
                                current: false,
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
                        path: 'menuFolderItem-18',
                        icon: '',
                        children: [
                            $(MenuExecutableItem, {
                                key: 'menuExecutableItem-18',
                                identity: {parent: 'menuFolderItem-18'},
                                name: 'Main Console',
                                current: false,
                                icon: '../main-menu/main_console.svg'
                            }),
                            $(MenuExecutableItem, {
                                key: 'menuExecutableItem-28',
                                identity: {parent: 'menuFolderItem-18'},
                                name: 'Topologies',
                                current: false,
                                icon: '../main-menu/area.svg'
                            }),
                            $(MenuExecutableItem, {
                                key: 'menuExecutableItem-38',
                                identity: {parent: 'menuFolderItem-18'},
                                name: 'Units on Hold',
                                current: false,
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
                path: 'menuFolderItem-2',
                icon: '../main-menu/thermometer.svg'
            }),
            $(MenuFolderItem, {
                key: 'menuFolderItem-3',
                identity: {parent: 'mainMenuBar'},
                name: 'Reports',
                current: false,
                state: { opened: false },
                path: 'menuFolderItem-3',
                icon: ''
            }),
            $(MenuFolderItem, {
                key: 'menuFolderItem-4',
                identity: {parent: 'mainMenuBar'},
                name: 'Configuration',
                current: false,
                state: { opened: false },
                icon: '../main-menu/train.svg',
                path: 'menuFolderItem-4',
                children: [
                    $(MenuFolderItem, {
                        key: 'menuFolderItem-11',
                        identity: {parent: 'menuFolderItem-1'},
                        name: 'Placement / Locations',
                        current: false,
                        state: { opened: false },
                        icon: '',
                        path: 'menuFolderItem-11',
                        children: [
                            $(MenuExecutableItem, {
                                key: 'menuExecutableItem-1',
                                identity: {parent: 'menuFolderItem-11'},
                                name: 'Locations',
                                current: false,
                                icon: ''
                            }),
                            $(MenuExecutableItem, {
                                key: 'menuExecutableItem-2',
                                identity: {parent: 'menuFolderItem-11'},
                                name: 'Topologies',
                                current: false,
                                icon: '../main-menu/area.svg'
                            }),
                            $(MenuExecutableItem, {
                                key: 'menuExecutableItem-3',
                                identity: {parent: 'menuFolderItem-11'},
                                name: 'Storage Spaces',
                                current: false,
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
                        path: 'menuFolderItem-12',
                        icon: ''
                    }),
                    $(MenuFolderItem, {
                        key: 'menuFolderItem-13',
                        identity: {parent: 'menuFolderItem-1'},
                        name: 'Service',
                        current: false,
                        state: { opened: false },
                        path: 'menuFolderItem-13',
                        icon: ''
                    }),
                    $(MenuFolderItem, {
                        key: 'menuFolderItem-14',
                        identity: {parent: 'menuFolderItem-1'},
                        name: 'Document Flow',
                        current: false,
                        state: { opened: false },
                        path: 'menuFolderItem-14',
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
                path: 'menuFolderItem-5',
                children: [
                    $(MenuFolderItem, {
                        key: 'menuFolderItem-11',
                        identity: {parent: 'menuFolderItem-1'},
                        name: 'Placement / Locations',
                        current: false,
                        state: { opened: false },
                        icon: '',
                        path: 'menuFolderItem-111',
                        children: [
                            $(MenuExecutableItem, {
                                key: 'menuExecutableItem-1',
                                identity: {parent: 'menuFolderItem-11'},
                                name: 'Locations',
                                current: false,
                                icon: ''
                            }),
                            $(MenuExecutableItem, {
                                key: 'menuExecutableItem-2',
                                identity: {parent: 'menuFolderItem-11'},
                                name: 'Topologies',
                                current: false,
                                icon: '../main-menu/area.svg'
                            }),
                            $(MenuExecutableItem, {
                                key: 'menuExecutableItem-3',
                                identity: {parent: 'menuFolderItem-11'},
                                name: 'Storage Spaces',
                                current: false,
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
                        path: 'menuFolderItem-12',
                        icon: ''
                    }),
                    $(MenuFolderItem, {
                        key: 'menuFolderItem-13',
                        identity: {parent: 'menuFolderItem-1'},
                        name: 'Service',
                        current: false,
                        state: { opened: false },
                        path: 'menuFolderItem-13',
                        icon: ''
                    }),
                    $(MenuFolderItem, {
                        key: 'menuFolderItem-14',
                        identity: {parent: 'menuFolderItem-1'},
                        name: 'Document Flow',
                        current: false,
                        state: { opened: false },
                        path: 'menuFolderItem-14',
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
                path: 'menuFolderItem-6',
                children: [
                    $(MenuExecutableItem, {
                        key: 'menuExecutableItem-1',
                        identity: {parent: 'menuFolderItem-1'},
                        name: 'Main Console',
                        current: false,
                        icon: '../main-menu/main_console.svg'
                    }),
                    $(MenuExecutableItem, {
                        key: 'menuExecutableItem-2',
                        identity: {parent: 'menuFolderItem-1'},
                        name: 'Temperature Control',
                        current: true,
                        icon: '../main-menu/thermometer.svg'
                    }),
                    $(MenuExecutableItem, {
                        key: 'menuExecutableItem-3',
                        identity: {parent: 'menuFolderItem-1'},
                        name: 'Activity Dashboard',
                        current: false,
                        icon: '../main-menu/dashboard.svg'
                    }),
                    $(MenuExecutableItem, {
                        key: 'menuExecutableItem-4',
                        identity: {parent: 'menuFolderItem-1'},
                        name: 'Railway Processing',
                        current: false,
                        icon: '../main-menu/train.svg'
                    }),
                    $(MenuExecutableItem, {
                        key: 'menuExecutableItem-5',
                        identity: {parent: 'menuFolderItem-1'},
                        name: 'Units on Hold',
                        current: false,
                        icon: ''
                    }),
                    $(MenuFolderItem, {
                        key: 'menuFolderItem-1',
                        identity: {parent: 'menuFolderItem-1'},
                        name: 'Reports about finances',
                        current: false,
                        state: { opened: false },
                        path: 'menuFolderItem-17',
                        icon: ''
                    }),
                ]
            })
        ],
        rightChildren: [
            $(MenuCustomItem, {
                key: 'menuCustomItem-2',
                identity: {parent: 'mainMenuBar'},
                children: [
                    $('button', {key: 2}, [
                        $('img', {key: 3, src: '../main-menu/tooltip.svg', className: 'rowIconSize'})
                    ])
                ]
            }),
            $(MainMenuClock, {
                key: 'DateTimeClock',
                identity: {parent: 'menuCustomItem-1'},
                serverTime: '1648628097000',
                timestampFormatId: 1,
                path: 'mi-clock'
            }),
            $(MenuFolderItem, {
                key: 'menuFolderItem-21',
                identity: {parent: 'mainMenuBar'},
                name: 'EN',
                current: false,
                state: { opened: false },
                icon: '',
                path: 'menuFolderItem-21',
                children: [
                    $(MenuExecutableItem, {
                        key: 'menuExecutableItem-21',
                        identity: {parent: 'menuFolderItem-21'},
                        name: 'GER',
                        current: false
                    }),
                    $(MenuExecutableItem, {
                        key: 'menuExecutableItem-22',
                        identity: {parent: 'menuFolderItem-21'},
                        name: 'DK',
                        current: false
                    }),
                    $(MenuExecutableItem, {
                        key: 'menuExecutableItem-23',
                        identity: {parent: 'menuFolderItem-21'},
                        name: 'HUN',
                        current: false
                    }),
                    $(MenuExecutableItem, {
                        key: 'menuExecutableItem-24',
                        identity: {parent: 'menuFolderItem-21'},
                        name: 'EN',
                        current: false
                    }),
                    $(MenuExecutableItem, {
                        key: 'menuExecutableItem-25',
                        identity: {parent: 'menuFolderItem-21'},
                        name: 'SVK',
                        current: false
                    })
                ]
            }),
            $(MenuUserItem, {
                key: 'menuUserItem-22',
                identity: {parent: 'mainMenuBar'},
                shortName: 'DEV',
                longName: 'developer',
                current: false,
                state: { opened: false },
                path: 'menuFolderItem-22',
                icon: '',
                children: [
                    $(MenuFolderItem, {
                        key: 'menuFolderItem-221',
                        identity: {parent: 'menuFolderItem-22'},
                        name: 'Role, Switch to',
                        current: false,
                        state: { opened: false },
                        path: 'menuFolderItem-221',
                        icon: ''
                    }),
                    $(MenuFolderItem, {
                        key: 'menuFolderItem-222',
                        identity: {parent: 'menuFolderItem-22'},
                        name: 'Active Role',
                        current: false,
                        state: { opened: false },
                        path: 'menuFolderItem-222',
                        icon: '../main-menu/roles.svg'
                    }),
                    $(MenuExecutableItem, {
                        key: 'menuExecutableItem-221',
                        identity: {parent: 'menuFolderItem-22'},
                        name: 'Profile Settings',
                        current: false,
                        icon: '../main-menu/profile.svg'
                    }),
                    $(MenuExecutableItem, {
                        key: 'menuExecutableItem-222',
                        identity: {parent: 'menuFolderItem-22'},
                        name: 'Tooltips',
                        current: false
                    }),
                    $(MenuExecutableItem, {
                        key: 'menuExecutableItem-223',
                        identity: {parent: 'menuFolderItem-22'},
                        name: 'Log out',
                        current: false
                    })
                ]
            })
        ]
    });
    const sender = {
        enqueue: (identity: any, patch: any) => console.log(patch, identity)
    };
    const ack: boolean | null = null;
    const isRoot = true;

    return createSyncProviders({sender, ack, isRoot, children: child});
}

const containerElement = document.createElement("div");
document.body.appendChild(containerElement);
ReactDOM.render($(App), containerElement);
