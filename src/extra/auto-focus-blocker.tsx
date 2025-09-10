import React from 'react';
import { FOCUS_BLOCKER_CLASS } from './navigation-effector';

export function AutoFocusBlocker() {
    return <div style={{ display: 'none' }} className={FOCUS_BLOCKER_CLASS} />
}