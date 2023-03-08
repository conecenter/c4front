const KeyBinder = (() => {
  const bindings = []
  const keyUps = []
  let keysPressed = []
  const isKeyPressed = (key) => keysPressed.includes(key)
  const keyDown = (key) => {
    keysPressed.push(key)
    // console.log("key press: " + key + ", array: [" + keysPressed + "]")
  }
  const keyUp = (key) => {
    keysPressed = keysPressed.filter(k => k != key)
    // console.log("key up: " + key + ", array: [" + keysPressed + "]")
  }
  const bind = (e, key, callback, prioritized) => {
    const w = e && e.ownerDocument.defaultView
    const fcall = (event) => {
      if (key !== null && typeof (event.key) !== "undefined" && event.key.toUpperCase() == key.toUpperCase() && !isKeyPressed(event.key.toUpperCase())) {
        keyDown(event.key.toUpperCase())
        const pressedKey = event.key.toUpperCase()
        // console.log("PRESSED KEY: " + pressedKey);
        const otherPrioritized = bindings.filter(binding =>
          binding.key !== null &&
          typeof (binding.key) !== "undefined" &&
          binding.key.toUpperCase() === pressedKey &&
          binding.prioritized &&
          binding.callback != callback
        )
        const evaluate = () => {
          event.stopPropagation();
          event.preventDefault()
          callback(event)
          return false;
        }

        if (otherPrioritized.length > 0) {
          if (prioritized) evaluate()
        } else evaluate()
      }
    }

    const upKeyCall = (event) => {
      // if (key !== null && typeof (event.key) !== "undefined" && event.key.toUpperCase() == key.toUpperCase() && isKeyPressed(event.key.toUpperCase())) {
      event.stopPropagation();
      event.preventDefault()
      if (typeof (event.key) !== "undefined") keyUp(event.key.toUpperCase())
      // }
    }
    //log(e)("keyBinder", key)
    w.addEventListener("keydown", fcall, true)
    w.addEventListener("keyup", upKeyCall, true)
    bindings.push({ w, callback, fcall, key, prioritized })
    keyUps.push({ w, callback, upKeyCall, key, prioritized })
  }

  const unbind = (callback) => {
    const index = bindings.findIndex(_ => _.callback == callback)
    if (index >= 0) {
      bindings.splice(index, 1).forEach(i => i.w.removeEventListener("keydown", i.fcall, true))
    }
    const index2 = keyUps.findIndex(_ => _.callback == callback)
    if (index2 >= 0) {
      keyUps.splice(index2, 1).forEach(i => i.w.removeEventListener("keyup", i.upKeyCall, true))
    }
  }
  return { bind, unbind }
})()

export { KeyBinder }