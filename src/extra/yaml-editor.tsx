import React from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { yaml } from '@codemirror/lang-yaml'
import { yamlSchema } from "codemirror-json-schema/yaml";
import { Patch, usePatchSync } from './exchange/patch-sync';
import { JSONSchema7 } from "json-schema";

const yamlSupport = yaml();

const changeToPatch = (ch: string): Patch => ({ value: ch });
const patchToChange = (patch: Patch): string => patch.value;


interface YamlEditor {
    identity: object,
    value: string,
    jsonSchema?: JSONSchema7
}

function YamlEditor({ identity, value, jsonSchema }: YamlEditor) {
    const { currentState, sendTempChange, sendFinalChange, wasChanged } =
        usePatchSync(identity, 'receiver', value, false, s => s, changeToPatch, patchToChange, (prev, ch) => ch);

    console.log('rerender YamlEditor', {value, currentState});

    const schemaExtension = jsonSchema ? yamlSchema(jsonSchema) : [];

    return <CodeMirror
        value={currentState}
        extensions={[yamlSupport, schemaExtension]}
        onBlur={() => wasChanged && sendFinalChange(currentState)}
        onChange={(value) => sendTempChange(value)} />
}

export { YamlEditor }