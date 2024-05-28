import React, { Suspense, lazy } from 'react';
import type { YamlEditorProps } from './yaml-editor';

const YamlEditor = lazy(() => import(/* webpackChunkName: "yaml-editor" */ './yaml-editor'));

function LazyYamlEditor(props: YamlEditorProps) {
    return (
        <Suspense fallback={'Loading...'}>
            <YamlEditor {...props} />
        </Suspense>
    );
}

export { LazyYamlEditor as YamlEditor }