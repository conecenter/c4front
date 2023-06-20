import React, { ReactNode, useEffect, useRef, useState } from "react";
import { useSync } from "../main/vdom-hooks";
import { identityAt } from "../main/vdom-util";

/*
 * Reference for scanner interface - OPTICON Universal menu book
 * Scanner reads bar codes of type Interleaved 2of5
*/

const initialSetupCodes = ['8C','TT','TZ','WA','WD','BAK','A0A','A0U','S1','S7','B0','R8','P'];

const barcodeActionIdOf = identityAt('barcodeAction');

interface ScannerSerialElement {
    key: string,
    identity: Object,
    barcodeReader: boolean,
    children?: ReactNode
}

interface ReadingParams {
    reader: ReadableStreamDefaultReader<string>,
    readableStreamClosed: Promise<void>
}

function ScannerSerialElement({ identity, barcodeReader, children }: ScannerSerialElement) {
    const [port, setPort] = useState<SerialPort | null>(null);

    const readingParamsRef = useRef<ReadingParams | null>(null);

    // Server sync functionality
    const [_, enqueueBarcodePatch] = useSync(barcodeActionIdOf(identity));
    const sendBarcode = (data: string) => {
        let barcode = data.trim();
        enqueueBarcodePatch({ value: barcode, headers: { 'x-r-action': 'barcode' } });
        console.log(`barcode -> ${barcode}`);
    }

    // Open & initialize serial port
    useEffect(() => {
        initializePort();
        return () => { closePort() }
    }, []);
    
    async function initializePort() {
        if (!isSerialSupported()) return;
        const openedPort = await openSerialPort();
        if (openedPort) {
            await initPortSettings(openedPort);
            setupDataReading(openedPort);
            setPort(openedPort);
        }
    }

    // Barcode reading functionality
    async function setupDataReading(port: SerialPort) {
        const textDecoder = new TextDecoderStream();
        const readableStreamClosed = port.readable.pipeTo(textDecoder.writable);
        const reader = textDecoder.readable.getReader();

        readingParamsRef.current = { reader, readableStreamClosed };

        console.log('setupDataReading');
    
        // Listen to data coming from the serial device.
        while (true) {
            const { value, done } = await reader.read();
            if (done) {
                // Allow the serial port to be closed later.
                reader.releaseLock();
                break;
            }
            sendBarcode(value);
        }
    }

    async function closePort() {
        if (!port) return;
        if (readingParamsRef.current) {
            const { reader, readableStreamClosed } = readingParamsRef.current;
            reader.cancel();
            await readableStreamClosed.catch(() => { /* Ignore the error */ });
        }
        await port.close();
        console.log('port is closed');
    }

    useEffect(() => {
        console.log('enable port', port)
        if (!port) return;
        barcodeReader ? enableScanner(port) : disableScanner(port);
    }, [port, barcodeReader]);
    
    return (
        <>
            <h1>Serial API Test</h1>
            {children}
        </>
    );
}

function isSerialSupported() {
    return "serial" in navigator;
}

async function openSerialPort() {
    try {
        // Get all serial ports the user has previously granted the website access to.
        const ports = await navigator.serial.getPorts();
        console.log('ports:', ports);
        const port = ports.length !== 1 ? await navigator.serial.requestPort() : ports[0];
        await port.open({ baudRate: 9600 });
        console.log('opened port');
        return port;
    }
    catch (err) {
        console.log('Serial port opening error:', err);
    }
}

async function initPortSettings(port: SerialPort) {
    await executeCommands(port, initialSetupCodes);
}

function enableScanner(port: SerialPort) {
    executeCommands(port, ['Q']);
}

function disableScanner(port: SerialPort) {
    executeCommands(port, ['P']);
}

// TODO: error checking + check port.isOpen?
async function executeCommands(port: SerialPort, commands: string[]) {
    const toCommand = (str: string) => '\x1b' + str + '\r';

    const textEncoder = new TextEncoderStream();
    const writableStreamClosed = textEncoder.readable.pipeTo(port.writable);
    const writer = textEncoder.writable.getWriter();

    for (const str of commands) {
        let command = toCommand(str);
        await writer.write(command);
        console.log('command:' + str);
    }
    
    await writer.close();
    console.log('commands applied')
}

export { ScannerSerialElement }