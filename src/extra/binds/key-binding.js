import React, { createElement as $, useMemo, useState, useContext, useEffect } from 'react'
import { BindingElement, AuxBindGroup, AUX_GROUP_ID } from './binds-elements'
import { BottomBarContent } from '../bottom-bar-manager'

 /** @type {Object} */
const KeyBindContext = React.createContext({})

const useBinds = () => {
  return useContext(KeyBindContext)
}

const useProvideBinds = (groupId) => {
  const { activeBindGroup, updateActiveGroup } = useBinds()
  const [provideBinds, setProvideBinds] = React.useState(false)
  useEffect(() => {
    const newValue = groupId === activeBindGroup
    setProvideBinds(newValue)
  }, [activeBindGroup])

  const updateBindProvider = () => {
    /*console.log("updateBindProvider(" + groupId + ")")*/
    updateActiveGroup(groupId)
  }
  return { provideBinds, updateBindProvider }
}

const OnPageBindContext = React.createContext(false)

const calculateNewHistoryArray = (prevs, group) => {
  const filtered = prevs.filter(p => p != group)
  const newArr = [group, ...filtered]
  return newArr.slice(0, 5)
}

const groupBy = function (xs, key) {
  return xs.reduce(function (rv, x) {
    (rv[x[key]] = rv[x[key]] || []).push(x);
    return rv;
  }, {});
};

const KeyBindingsManager = ({ links, children, bindSrcId, escapeBindSrcId, noTouch }) => {
  const [bindHistory, setBindHistory] = useState([]) //List of bind call history
  const [availableGroups, setAvailableGroups] = useState([]) //List of groups Ids
  const [activeBindGroup, setActiveBindGroup] = useState("") //Currently active group
  const isBindMode = links.length > 0
  const isNoTouchMode = Boolean(noTouch)

  const bindMap = useMemo(() => groupBy(links, "bind"), [links])

  const keyData = BindKeyData(bindMap, bindSrcId);
  const keyCode = (keyData !== null) ? keyData.keyCode : null;

  const addGroupToHistory = (group) => setBindHistory(prev => calculateNewHistoryArray(prev, group))

  const calculateUpdate = (prev, newGroup) => {
    addGroupToHistory(prev)
    return newGroup
  }
  const updateActiveGroup = (newGroup) => {
    if (isBindMode && activeBindGroup != newGroup) {
      // console.log("accepted change to :" + newGroup + ", prev was: " + activeBindGroup)
      setActiveBindGroup(prev => calculateUpdate(prev, newGroup))
    }
  }

  const addGroup = (group) => setAvailableGroups(prev => !prev.includes(group) ? [...prev, group] : prev)

  const removeGroup = (group) => {
    if (isBindMode) {
      // console.log("remove group: " + group)
      setAvailableGroups(prev => prev.filter(el => el != group))
    }
  }

  useEffect(() => {
    window.onhelp = () => false
  }, [isBindMode])

  const getLastBindFromHistory = () => { return (bindHistory.length === 0) ? null : bindHistory[0] }
  const haveBackOption = (group) => { return (group === activeBindGroup && getLastBindFromHistory() != null) }

  const goBackInHistory = (event) => {
    if (isBindMode) {
      const groupTo = getLastBindFromHistory()
      if (groupTo === null) return
      setActiveBindGroup(groupTo)
      const [head, ...tail] = bindHistory;
      setBindHistory(tail)
      return false
    }
  }

  const switchToNextGroup = (event) => {
    const currentIndex = availableGroups.indexOf(activeBindGroup)
    const nextIndex = (currentIndex + 1 > (availableGroups.length - 1)) ? 0 : (currentIndex + 1)
    const nextgroup = availableGroups[nextIndex]
    updateActiveGroup(nextgroup)
    event.stopPropagation?.()
    return false
  }

  const groupHandler = {
    availableGroups,
    addGroup,
    removeGroup,
    addGroupToHistory,
    haveBackOption,
    goBackInHistory,
    escapeBindSrcId
  }
  const contextValue = { bindMap, activeBindGroup, updateActiveGroup, isBindMode, ...groupHandler }

  const drawSwitchBtn = keyCode != null
  const btnProps = {
    bindSrcId,
    onChange: switchToNextGroup,
    children: ""
  }
  const switchBtn = isBindMode && drawSwitchBtn &&
    $(BottomBarContent, null, $(BindingElement, { ...btnProps }, "Switch"))

  const overlayCallBack = (event) => {
    event.stopPropagation()
  }
  const overlay = isNoTouchMode && $("div", { className: "noTouchOverlay", onClickCapture: overlayCallBack }, [])

  const auxBindGroup = isBindMode && $(AuxBindGroup, null)

  const onChangeAction = (event) => {
    if (!isBindMode) return;
    const element = event.target
    if (element !== null) {
      const parentGroupElement = element.closest('.withBindProvider')
      const parentGroupId = parentGroupElement?.getAttribute("groupId")
      const nextActiveGroup = parentGroupId || (availableGroups.includes(AUX_GROUP_ID) && AUX_GROUP_ID)
      // console.log("onChangeAction on: " + ", switch to: " + nextActiveGroup + ", activeGroup was: " + activeGroup)
      if (nextActiveGroup) updateActiveGroup(nextActiveGroup)
    }
  }

  return $("div", { onFocus: onChangeAction, onClickCapture: onChangeAction },
    $(KeyBindContext.Provider, { value: contextValue }, children, auxBindGroup, switchBtn, overlay)
  )
}

const BindKeyData = (keyMappingMap, bindSrcId) => {
  if (typeof (keyMappingMap) !== 'undefined' && typeof (keyMappingMap[bindSrcId]) !== 'undefined') {
    const bindData = keyMappingMap[bindSrcId];
    return (bindData.length != 1) ? null : bindData[0];
  } else {
    return null;
  }
}

export { KeyBindingsManager, useBinds, BindKeyData, OnPageBindContext, useProvideBinds }