import { NumberToken, TimeToken, Token, tokenizeString } from "../datepicker/date-utils";
import { InputState, TimestampState } from "./timepicker";

// Timepicker state helpers
const isInputState = (state: TimestampState | InputState): state is InputState => state.tp === 'input-state';

const createInputChange = (inputValue: string, tempTimestamp?: number): InputState => ({
    tp: 'input-state',
	inputValue,
    tempTimestamp
});

const createTimestampChange = (timestamp: number): TimestampState => ({
    tp: 'timestamp-state',
    timestamp: timestamp % (24 * 60 * 60 * 1000)
});


// Formatting timestamp -> time string
const FORMAT_FROM_TOKEN: { [index: string]: (ms: number) => string } = {
    H: ms => padTo2Digits(Math.floor(ms / TOKEN_TO_MS.H) % 24),
    m: ms => ':' + padTo2Digits(Math.floor(ms / TOKEN_TO_MS.m) % 60),
    s: ms => ':' + padTo2Digits(Math.floor(ms / TOKEN_TO_MS.s) % 60),
    S: ms => '.' + (ms % TOKEN_TO_MS.S).toString().padStart(3, '0'),
    '00': ms => ':00'
}

const padTo2Digits = (num: number) =>  num.toString().padStart(2, '0');

function formatTimestamp(milliseconds: number, pattern: string) {
    const formattedParts = Object.keys(FORMAT_FROM_TOKEN).reduce((acc: string[], token) => pattern.includes(token) 
            ? [...acc, FORMAT_FROM_TOKEN[token](milliseconds)] 
            : acc, []);
    return formattedParts.join('');
}


// Time parsing functionality
const TIME_TOKENS: (keyof TimeToken)[] = ['H', 'm', 's', 'S'];
const TOKEN_TO_MS: { [index: string]: number } = {
    H: 60 * 60 * 1000,
    m: 60 * 1000,
    s: 1000,
    S: 1
}

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

function timeTokenToMs(usedTokens: (keyof TimeToken)[], timeToken: TimeToken, numberTokens?: NumberToken[]) {
    return usedTokens.reduce((acc: number, token) => {
        const tokenValue = (timeToken[token] as number | undefined) ?? numberTokens?.shift()?.value ?? 0;
        return acc + tokenValue * TOKEN_TO_MS[token];
    }, 0);
}

/*
interface NumberToken {
    type: 'number'
    value: number
    length: number
}

const number: RegExpExtractor = {
    regex: /^([0-9]+)/,
    extractor: match => ({type: 'number', value: parseInt(match[0]) || 0, length: match[0].length})
}

const Hm: RegExpExtractor = {
    regex: /^(\d{1,2}):(\d{1,2})/,
    extractor: match => ({
        type: 'time',
        H: parseInt(match[1]) || 0,
        m: parseInt(match[2]) || 0,
        length: match[0].length
    })
}

const Hms: RegExpExtractor = {
    regex: /^(\d{1,2}):(\d{1,2}):(\d{1,2})/,
    extractor: match => ({
        type: 'time',
        H: parseInt(match[1]) || 0,
        m: parseInt(match[2]) || 0,
        s: parseInt(match[3]) || 0,
        length: match[0].length
    })
}

const HmsS: RegExpExtractor = {
    regex: /^(\d{1,2}):(\d{1,2}):(\d{1,2})\.(\d{1,3})/,
    extractor: match => ({
        type: 'time',
        H: parseInt(match[1]) || 0,
        m: parseInt(match[2]) || 0,
        s: parseInt(match[3]) || 0,
        S: parseInt(match[4]) || 0,
        length: match[0].length
    })
}
/*
const timeExtractors = [HmsS, Hms, Hm, number];

function tokenizeString(value: string) {
    let currentValue = value;
    const tokens: Token[] = [];

    while (currentValue.length > 0) {
        const tokenOpt = tryRegexes(currentValue);
        if (tokenOpt) {
            tokens.push(tokenOpt);
            currentValue = currentValue.slice(tokenOpt.length);
        } else {
            currentValue = currentValue.slice(1);
        }
    }
    return tokens;
}

function tryRegexes(value: string) {
    let i = 0
    while (i < timeExtractors.length) {
        const result = tryRegex(value, timeExtractors[i]);
        if (result) return result;
        i++;
    }
}

function tryRegex(value: string, regexExtractor: RegExpExtractor) {
    const matchResult = value.match(regexExtractor.regex);
    return matchResult && regexExtractor.extractor(matchResult);
}*/

export { formatTimestamp, parseStringToTime, createInputChange, createTimestampChange, isInputState, TOKEN_TO_MS }