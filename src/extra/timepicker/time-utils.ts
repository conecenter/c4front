import type { RegExpExtractor, TimeToken, Token } from "../datepicker/date-utils";
import { InputState, TimestampState } from "./timepicker";

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

interface NumberToken {
    type: 'number'
    value: number
    length: number
}

function parseStringToTime(value: string): number | undefined {
    const hmToMs = (hours: number, mins: number) => hours * 3600000 + mins * 60000;

    const tokens = tokenizeString(value) as (NumberToken | TimeToken)[];
    if (tokens.length > 0) {
        const timeToken = <TimeToken | undefined>tokens.find((value: Token) => value.type === 'time');
        if (timeToken) {
            return hmToMs(timeToken.H, timeToken.m);
        }
        else {
            const hours = (tokens[0] as NumberToken).value;
            const mins = (tokens[1] as NumberToken)?.value || 0;
            return hmToMs(hours, mins);
        }
    }
}

const timeExtractors = [Hm, number];

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
}

const createInputChange = (inputValue: string, tempTimestamp?: number): InputState => ({
    tp: 'input-state',
	inputValue,
    tempTimestamp
});

const createTimestampChange = (timestamp: number): TimestampState => ({
    tp: 'timestamp-state',
    timestamp
});

export { parseStringToTime, createInputChange, createTimestampChange }