function firstChild(elem: Element, predicate: (node: Element) => boolean, stopPredicate: (node: Element) => boolean, init: boolean): Element | undefined {
    if (elem === undefined) return undefined
    else if (predicate(elem)) return elem
    else if (stopPredicate(elem) && !init) return undefined
    else {
      const tt = [...elem.children].find(node => firstChild(node, predicate, stopPredicate, false) !== undefined)
      return tt !== undefined ? firstChild(tt, predicate, stopPredicate, false) : undefined
    }
}

export { firstChild }
