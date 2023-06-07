
const spreadAll = (...args) => Object.assign({},...args)

export const deleted = ks => st => spreadAll(...Object.keys(st).filter(ck=>!ks[ck]).map(ck=>({[ck]:st[ck]})))

export const weakCache = f => {
    const map = new WeakMap
    return arg => {
        if(map.has(arg)) return map.get(arg)
        const res = f(arg)
        map.set(arg,res)
        return res
    }
}

export const identityAt = key => weakCache(parent => ({ parent, key }))

export const receiverOf = identityAt('receiver')

export const never = o => { console.log(o); throw new Error }

export const sortedWith = f => l => l && [...l].sort(f)

export const findFirstParent = get => el => el && get(el) || el && findFirstParent(get)(el.parentElement)

export const em = v => `${v}em`

export const sum = l => l.reduce((a,b)=>a+b,0)

export const range = sz => [...Array(sz).keys()]

export function findLastIndex(arr, callback, thisArg) {
    //console.log(arr, callback)
    for (let index = arr.length-1; index >= 0; index--) {
        const value = arr[index];
        if (callback.call(thisArg, value, index, arr)) {
            return index;
        }
    }
    return -1;
}