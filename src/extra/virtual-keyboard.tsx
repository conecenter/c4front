import React from 'react';


interface VirtualKeyboard {
    key: string,
    identity: Object,
    keyboardTypes: {
        // text: KeyboardLayout,
        number: KeyboardLayout,
        // location: KeyboardLayout
    },
    // position: 'left' | 'right' | 'bottom' | 'static',
    // scale: number
}

interface KeyboardLayout {
    base: VKButtonData[],
    [name: string]: VKButtonData[]
}

interface VKButtonData {
    key: string,
    position: { 
        row: number,
        col: number, 
        width: number, 
        height: number
    },
    name?: string,
    className?: string
}

 function VirtualKeyboard({}: VirtualKeyboard) {
    
    return (
        <div style={{position: 'fixed', height: '4.4em', maxWidth: '25em', border: '1px solid', bottom: '0', right: '0', left: '0', margin: 'auto'}}>
            <div style={{position: 'absolute', left: '0', top: '0', width: '20%', height: '2.2em', border: '1px solid'}}>
                A
            </div>
            <div style={{position: 'absolute', left: '20%', top: '0', width: '20%', height: '2.2em', border: '1px solid'}}>
                B
            </div>
            <div style={{position: 'absolute', left: '40%', top: '0', width: '20%', height: '2.2em', border: '1px solid'}}>
                C
            </div>
            <div style={{position: 'absolute', left: '60%', top: '0', width: '20%', height: '2.2em', border: '1px solid'}}>
                Enter
            </div>
            <div style={{position: 'absolute', left: '80%', top: '0', width: '20%', height: '2.2em', border: '1px solid'}}>
                C
            </div>
        </div>
    );
 }

 export { VirtualKeyboard };
