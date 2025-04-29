import { NumberToken, TimeToken, Token, tokenizeString } from "../datepicker/date-utils";
import { InputState, TimePickerState, TimestampState } from "./timepicker";

// Time calculations helpers
const MAX_TIMESTAMP = 24 * 60 * 60 * 1000;

const TIME_TOKENS = ['H', 'm', 's', 'S'];

const getHours = (ms: number) => Math.floor(ms / TOKEN_DATA.H.ms) % 24;
const getMinutes = (ms: number) => Math.floor(ms / TOKEN_DATA.m.ms) % 60;
const getSeconds = (ms: number) => Math.floor(ms / TOKEN_DATA.s.ms) % 60;
const getMilliseconds = (ms: number) => ms % TOKEN_DATA.s.ms;

const padToDigits = (num: number, padTo: number) =>  num.toString().padStart(padTo, '0');

interface TokenInfo {
    [index: string]: { 
        ms: number,
        max: number,
        joiner: string,
        get: (ms: number) => number,
        formatTo: (num: number) => string
    }
}

const TOKEN_DATA: TokenInfo = {
    H: {
        ms: 60 * 60 * 1000, 
        max: 24,
        joiner: '',
        get: getHours,
        formatTo: h => padToDigits(h, 2)
    },
    m: {
        ms: 60 * 1000, 
        max: 60,
        joiner: ':',
        get: getMinutes,
        formatTo: m => padToDigits(m, 2)
    },
    s: {
        ms: 1000,
        max: 60,
        joiner: ':',
        get: getSeconds,
        formatTo: s => padToDigits(s, 2)
    },
    S: {
        ms: 1,
        max: 1000,
        joiner: '.',
        get: getMilliseconds,
        formatTo: ms => padToDigits(ms, 3)
    }
}

const getCurrentTokenValue = (state: TimePickerState, token: string) => TOKEN_DATA[token].get(
    (state as TimestampState).timestamp ?? (state as InputState).tempTimestamp ?? 0
);


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
function formatTimestamp(milliseconds: number, usedTokens: string[], offset = 0) {
    const offsetTimestamp = milliseconds + offset;
    const formattedParts = usedTokens.map(token => {
        const { get, formatTo, joiner } = TOKEN_DATA[token];
        return joiner + formatTo(get(offsetTimestamp));
    });
    return formattedParts.join('');
}


// Time parsing functionality
function parseStringToTime(value: string, usedTokens: string[]): number | undefined {
    const tokens = tokenizeString(value, true);
    if (tokens.length > 0) {
        const timeToken = <TimeToken | undefined>tokens.find((value: Token) => value.type === 'time');
        const numberTokens = tokens.filter((value): value is NumberToken => value.type !== 'time');
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

function isNumber(value: unknown): value is number {
    return typeof value === 'number';
}

export {
    formatTimestamp,
    parseStringToTime,
    createInputChange,
    createTimestampChange,
    isInputState,
    getCurrentFMTChar,
    getAdjustedTime,
    getCurrentTokenValue,
    isNumber,
    MAX_TIMESTAMP,
    TIME_TOKENS,
    TOKEN_DATA
}