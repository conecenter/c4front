async function copyToClipboard(value: string) {
    try {
        await navigator.clipboard.writeText(value);
        return true;
    } catch(err) {
        console.log(err);
        return false;
    }
}

function inRange(num: number, range: number[], inclusive = false) {
    return inclusive 
        ? num >= range[0] && num <= range[1] 
        : num > range[0] && num < range[1];
}

function clamp(num: number, min: number, max: number) {
    return Math.min(Math.max(num, min), max);
}

/* eslint-disable */
function throttleWithTrailing(callback: Function, limit: number) {
    let waiting = false;
    let latest_call_this: any = null;
    let latest_call_args: Array<any> | null = null;
    const throttled_function = function(this: any, ...args: Array<any>) {
        if (waiting) {
            // save latest call infos
            latest_call_this = this;
            latest_call_args = args;
        } else {
            callback.apply(this, arguments);
            waiting = true;
            setTimeout(function() {
                waiting = false;
                // check for latest call infos
                if (latest_call_this !== null) {
                    throttled_function.apply(latest_call_this, latest_call_args || []);
                    latest_call_this = null;
                    latest_call_this = null;
                }
            }, limit);
        }
    }
    return throttled_function
}
/* eslint-enable */

// https://stackoverflow.com/questions/3561493/is-there-a-regexp-escape-function-in-javascript/3561711#3561711
function escapeRegex(string: string) {
    return string.replace(/[/\-\\^$*+?.()|[\]{}]/g, '\\$&');
}

export type Identity = string

export { copyToClipboard, inRange, clamp, throttleWithTrailing, escapeRegex }