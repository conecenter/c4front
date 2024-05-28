import React, { Suspense, lazy } from 'react';
import type { YamlEditorProps } from './yaml-editor';

const YamlEditor = lazy(() => import(/* webpackChunkName: "yaml-editor" */ './yaml-editor'));

function LazyYamlEditor(props: YamlEditorProps) {
    // TODO: <OverlayWrapper textmsg='Loading, please wait...' />
    return (
        <Suspense fallback={'Loading, please wait...'}>
            <YamlEditor {...props} />
        </Suspense>
    );
}

export { LazyYamlEditor as YamlEditor }