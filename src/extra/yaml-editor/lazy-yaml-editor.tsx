import React, { Suspense, lazy } from 'react';
import { LoadingIndicator } from '../loading-indicator';
import { YamlEditorProps } from 'c4f/sapi/ee/cone/c4ui/c4gen.FrontContextTagsApi';

const YamlEditor = lazy(() => import(/* webpackChunkName: "yaml-editor" */ './yaml-editor'));

function LazyYamlEditor(props: YamlEditorProps) {
    return (
        <Suspense fallback={<LoadingIndicator />}>
            <YamlEditor {...props} />
        </Suspense>
    );
}

export { LazyYamlEditor as YamlEditor }