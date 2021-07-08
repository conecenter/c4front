
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

export const never = o => { console.log(o); throw new Error }

export const sortedWith = f => l => l && [...l].sort(f)

export const findFirstParent = get => el => el && get(el) || el && findFirstParent(get)(el.parentElement)

export const em = v => `${v}em`