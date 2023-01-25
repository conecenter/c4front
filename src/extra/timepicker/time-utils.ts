import { NumberToken, TimeToken, Token, tokenizeString } from "../datepicker/date-utils";
import { InputState, TimestampState } from "./timepicker";
import { milliseconds } from "date-fns";

// Time calculations helpers
const MAX_TIMESTAMP = milliseconds({hours: 24});

const TIME_TOKENS = ['H', 'm', 's', 'S'];

const getHours = (ms: number) => Math.floor(ms / TOKEN_DATA.H.ms) % 24;
const getMinutes = (ms: number) => Math.floor(ms / TOKEN_DATA.m.ms) % 60;
const getSeconds = (ms: number) => Math.floor(ms / TOKEN_DATA.s.ms) % 60;
const getMilliseconds = (ms: number) => ms % TOKEN_DATA.s.ms; 

interface TokenInfo {
    [index: string]: { ms: number, max: number, get: (ms: number) => number }
}

const TOKEN_DATA: TokenInfo = {
    H: {
        ms: milliseconds({hours: 1}), 
        max: 24,
        get: getHours
    },
    m: {
        ms: milliseconds({minutes: 1}),
        max: 60,
        get: getMinutes
    },
    s: {
        ms: 1000,
        max: 60,
        get: getSeconds
    },
    S: {
        ms: 1,
        max: 1000,
        get: getMilliseconds
    }
}


// Timepicker state helpers
const isInputState = (state: TimestampState | InputState): state is InputState => state.tp === 'input-state';

const createInputChange = (inputValue: string, tempTimestamp?: number): InputState => ({
    tp: 'input-state',
	inputValue,
    tempTimestamp
});

const createTimestampChange = (timestamp: number): TimestampState => ({
    tp: 'timestamp-state',
    timestamp
});


// Formatting timestamp -> time string
const FORMAT_TO_TOKEN: { [index: string]: (ms: number) => string } = {
    H: ms => padTo2Digits(Math.floor(ms / TOKEN_DATA.H.ms) % 24),
    m: ms => ':' + padTo2Digits(getMinutes(ms)),
    s: ms => ':' + padTo2Digits(getSeconds(ms)),
    S: ms => '.' + getMilliseconds(ms).toString().padStart(3, '0')
}

const padTo2Digits = (num: number) =>  num.toString().padStart(2, '0');

function formatTimestamp(milliseconds: number, pattern: string, offset = 0) {
    const offsetTimestamp = milliseconds + offset;
    const formattedParts = TIME_TOKENS.reduce((acc: string[], token) => pattern.includes(token) 
            ? [...acc, FORMAT_TO_TOKEN[token](offsetTimestamp)] : acc, []);
    return formattedParts.join('');
}


// Time parsing functionality
function parseStringToTime(value: string, pattern: string): number | undefined {
    const tokens = tokenizeString(value, true);
    if (tokens.length > 0) {
        const timeToken = <TimeToken | undefined>tokens.find((value: Token) => value.type === 'time');
        const numberTokens = tokens.filter((value): value is NumberToken => value.type !== 'time');
        const usedTokens = TIME_TOKENS.filter(token => pattern.includes(token));
        if (timeToken) return timeTokenToMs(usedTokens, timeToken, numberTokens);
        else {
            const [H, m, s, S] = numberTokens;
            const customTimeToken: TimeToken = {
                type: 'time',
                H: H?.value,
                m: m?.value,
                s: s?.value,
                S: S?.value,
                length: tokens.length
            };
            return timeTokenToMs(usedTokens, customTimeToken);
        }
    }
}

function timeTokenToMs(usedTokens: string[], timeToken: TimeToken, numberTokens?: NumberToken[]) {
    return usedTokens.reduce((acc: number, token) => {
        const tokenValue = (timeToken[token as keyof TimeToken] as number) ?? numberTokens?.shift()?.value ?? 0;
        return acc + tokenValue * TOKEN_DATA[token].ms;
    }, 0);
}


// Arrows control logic
function getAdjustedTime(timestamp: number, currentFMTChar: string, cycleThroughout: boolean, increment: number) {
    const getCycleAdjustment = () => {
        const { ms, max, get } = TOKEN_DATA[currentFMTChar];
        const currValue = get(timestamp);
        return ms * ((currValue + increment + max) % max - currValue);
    }
    const adjustment = cycleThroughout
        ? getCycleAdjustment()
        : increment * TOKEN_DATA[currentFMTChar].ms;
    const adjustedTime = timestamp + adjustment;
    return (MAX_TIMESTAMP + adjustedTime) % MAX_TIMESTAMP;
}

function getCurrentFMTChar(pattern: string, cursorPosition: number) {
    for (const pos of [cursorPosition, cursorPosition - 1]) {
        if (TIME_TOKENS.includes(pattern[pos])) return pattern[pos];
    }            
}

export {
    formatTimestamp,
    parseStringToTime,
    createInputChange,
    createTimestampChange,
    isInputState,
    getCurrentFMTChar,
    getAdjustedTime,
    MAX_TIMESTAMP
}