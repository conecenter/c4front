import React, { Suspense, lazy } from 'react';
import type { YamlEditorProps } from './yaml-editor';
import { LoadingIndicator } from '../loading-indicator';

const YamlEditor = lazy(() => import(/* webpackChunkName: "yaml-editor" */ './yaml-editor'));

function LazyYamlEditor(props: YamlEditorProps) {
    return (
        <Suspense fallback={<LoadingIndicator />}>
            <YamlEditor {...props} />
        </Suspense>
    );
}

export { LazyYamlEditor as YamlEditor }