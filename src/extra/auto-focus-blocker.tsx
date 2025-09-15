import React from 'react';
import { FOCUS_BLOCKER_CLASS } from './css-selectors';

export function AutoFocusBlocker() {
    return <div style={{ display: 'none' }} className={FOCUS_BLOCKER_CLASS} />
}