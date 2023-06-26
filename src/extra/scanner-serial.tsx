import React, { ReactNode, useEffect, useRef, useState } from "react";
import { useSync } from "../main/vdom-hooks";
import { identityAt } from "../main/vdom-util";
import { useLatest } from "./custom-hooks";

/*
 * Reference for scanner interface - OPTICON Universal menu book
 * Scanner reads bar codes of type Interleaved 2of5
*/

const initialSetupCodes = ['8C','TT','TZ','WA','WD','BAK','A0A','A0U','S1','S7','B0','R8','P'];
const BAUDRATE = 9600;

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

function ScannerSerialElement({ identity, barcodeReader, children=null }: ScannerSerialElement) {
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
        initializePort({auto: true});
    }, []);

    async function initializePort(options?: {auto: boolean}) {
        if (!isSerialSupported()) return;
        if (port) await closePort();
        const openedPort = await openSerialPort(options);
        if (openedPort) {
            await initPortSettings(openedPort);
            setupDataReading(openedPort);
            setPort(openedPort);
        }
    }

    // Barcode reading functionality
    async function setupDataReading(port: SerialPort) {
        const textDecoder = new TextDecoderStream();
        const reader = textDecoder.readable.getReader();
        try {
            const readableStreamClosed = port.readable.pipeTo(textDecoder.writable);
            readingParamsRef.current = { reader, readableStreamClosed };
            console.log('Setup data reading');
            // Listen to data coming from the serial device
            while (true) {
                const { value, done } = await reader.read();
                if (done) {
                    // Allow the serial port to be closed later
                    reader.releaseLock();
                    break;
                }
                sendBarcode(value);
            }
        } catch (err) {
            reader.cancel()
                .catch(err => console.log('Reader closing error:', err));
            readingParamsRef.current?.readableStreamClosed.catch(() => { /* Ignore the error */ });
            console.log('Serial port reading error:', err);
        }
    }

    // Close serial port
    async function closePort() {
        if (!port) return;
        await disableScanner(port);
        try {
            if (readingParamsRef.current) {
                const { reader, readableStreamClosed } = readingParamsRef.current;
                reader.cancel();
                await readableStreamClosed.catch(() => { /* Ignore the error */ });
            }
            await port.close();
            console.log('port is closed');
        } catch (err) {
            console.log('Serial port closing error:', err);
        }
    }
    const closePortLatest = useLatest(closePort);

    useEffect(() => {
        return () => { closePortLatest.current() }
    }, []);

    // Enable/disable scanner's laser
    useEffect(() => {
        if (!port) return;
        barcodeReader ? enableScanner(port) : disableScanner(port);
    }, [port, barcodeReader]);
    
    return (
        <>
            <button 
                title='Connect to device'
                className='btnConnectScanner'
                style={{ opacity: port ? 0 : 0.2 }}
                onClick={() => initializePort()}
            >
                <img src='/src/test/serial-scanner/connection.svg' />   {/*'/mod/main/ee/cone/core/ui/c4view/connection.svg'*/}
            </button>
            {children}
        </>
    );
}

function isSerialSupported() {
    return "serial" in navigator;
}

// Get all serial ports the user has previously granted the website access to.
const getPermittedPort = async () => {
    const ports = await navigator.serial.getPorts();
    console.log('ports:', ports);
    if (ports.length === 1) return ports[0];
}

async function openSerialPort(options?: {auto: boolean}) {
    try {
        const port = await (options?.auto ? getPermittedPort() : navigator.serial.requestPort());
        await port?.open({ baudRate: BAUDRATE });
        port && console.log('opened port', port);
        return port;
    }
    catch (err) {
        console.log('Serial port opening error:', err);
    }
}

async function initPortSettings(port: SerialPort) {
    await executeCommands(port, initialSetupCodes);
}

async function enableScanner(port: SerialPort) {
    await executeCommands(port, ['Q']);
}

async function disableScanner(port: SerialPort) {
    await executeCommands(port, ['P']);
}

async function executeCommands(port: SerialPort, commands: string[]) {
    const toCommand = (str: string) => '\x1b' + str + '\r';
    const textEncoder = new TextEncoderStream();
    const writer = textEncoder.writable.getWriter();
    try {
        textEncoder.readable.pipeTo(port.writable);
        for (const str of commands) {
            let command = toCommand(str);
            await writer.write(command);
            console.log('command:' + str);
        }
    } catch (err) { 
        console.log('Serial port writing error:', err);
    }
    finally {
        await writer.close()
            .catch(err => console.log('Writer closing error:', err));
    }
}

export { ScannerSerialElement }