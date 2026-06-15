import { createElement as $, useState } from 'react'
import clsx from 'clsx'
import { useFocusControl } from './focus-control'
import { DELETE_EVENT, ENTER_EVENT, useExternalKeyboardControls } from './external-keyboard-controls'
import { Tooltip } from './tooltip'
import {identityAt} from "../main/vdom-util";
import { PatchSyncTransformers, usePatchSync } from './exchange/patch-sync'
import { usePath } from 'c4f/main/vdom-hooks'
import { CheckboxElementProps, RadioButtonElementProps } from 'c4f/sapi/ee/cone/c4ui/c4gen.FrontContextTagsApi'

const receiverIdOf = identityAt('receiver');

const patchSyncTransformers: PatchSyncTransformers<string, string, string> = {
    serverToState: s => s,
    changeToPatch: (ch) => ({ headers: {"x-r-action": "change"}, value: ch }),
    patchToChange: (p) => p.value,
    applyChange: (_prev, ch) => ch
};

const CheckboxElement = ({
    identity, value, receiver, children, tooltip, classNames, label, isRadioButton
}: CheckboxElementProps & { isRadioButton: boolean }) => {
    const readOnly = !receiver;

    const { currentState, sendFinalChange, changing } =
        usePatchSync(receiverIdOf(identity), value, false, patchSyncTransformers);

    const sendChange = () => !readOnly && sendFinalChange(currentState ? "" : "checked");

    const onClick = (e: React.MouseEvent) => {
        sendChange();
        e.stopPropagation();
    }

    const onKeyboardAction = (e: CustomEvent) => {
        if (e.detail) {
            sendChange();
            e.stopPropagation();
        }
    }
    const keyboardEventHandlers = {
		[ENTER_EVENT]: onKeyboardAction,
		[DELETE_EVENT]: onKeyboardAction
	};

    const [checkboxElem, setCheckboxElem] = useState(null)
    useExternalKeyboardControls(checkboxElem, keyboardEventHandlers)

    const stateClass = currentState === 'unknown' ? 'isUnknown'
        : currentState ? 'isChecked' : '';

    const path = usePath(identity)
    const {focusClass, focusHtml} = useFocusControl(path);

    return $("div", {ref: setCheckboxElem, className: clsx("checkBox", focusClass), ...focusHtml},
        $(Tooltip, {
            content: tooltip,
            children:
                $("div", {
                    ...changing && { style: { opacity: "0.4" }},
                    className: clsx(isRadioButton ? 'radioButton' : 'imageBox', stateClass, classNames),
                    "data-title": tooltip,
                    onClick, readOnly
                })
            }
        ),
        children,
        label && $("label", {onClick}, label)
    );
}

const RadioButtonElement = (props: RadioButtonElementProps) => $(CheckboxElement, { ...props, isRadioButton: true });

export {CheckboxElement, RadioButtonElement}