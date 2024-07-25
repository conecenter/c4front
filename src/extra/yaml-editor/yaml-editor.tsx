import React, { useMemo } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { yaml } from '@codemirror/lang-yaml';
import { yamlSchema } from "codemirror-json-schema/yaml";
import { usePatchSync, Patch } from '../exchange/patch-sync';
import { JSONSchema7 } from "json-schema";
import { linter, lintGutter, Diagnostic } from "@codemirror/lint";
import { load, YAMLException } from 'js-yaml';

const changeToPatch = (ch: string): Patch => ({ value: ch });
const patchToChange = (patch: Patch): string => patch.value;

interface YamlEditorProps {
    identity: object,
    value: string,
    jsonSchema?: string
}

function YamlEditor({ identity, value, jsonSchema }: YamlEditorProps) {
    const yamlSupport = useMemo(() => yaml(), []);

    const schemaExtension = jsonSchema ? yamlSchema(parseJsonSchema(jsonSchema)) : [];

    const { currentState, sendTempChange, sendFinalChange, wasChanged } =
        usePatchSync(identity, 'receiver', value, true, s => s, changeToPatch, patchToChange, (prev, ch) => ch);

    function lintErrors() {
        const diagnostics: Diagnostic[] = [];
        try { load(currentState) }
        catch (error) {
            const { mark, message } = error as YAMLException;
            const pos = mark.position > currentState.length
                ? currentState.length : mark.position;
            diagnostics.push({ from: pos, to: pos, message, severity: "error" });
        }
        return diagnostics;
    }

    return <CodeMirror
        value={currentState}
        extensions={[yamlSupport, schemaExtension, linter(lintErrors), lintGutter()]}
        onBlur={() => wasChanged && sendFinalChange(currentState)}
        onChange={(value) => sendTempChange(value)} />
}

function parseJsonSchema(jsonSchema: string) {
    try {
        return JSON.parse(jsonSchema) as JSONSchema7;
    } catch (err) {
        console.log('Parsing jsonSchema error: ', err);
    }
}

export type { YamlEditorProps }
export default YamlEditor