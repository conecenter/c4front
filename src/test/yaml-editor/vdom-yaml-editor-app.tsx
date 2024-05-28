import ReactDOM from "react-dom";
import {createElement as $} from "react";
import {createSyncProviders} from "../../main/vdom-hooks";
import YamlEditor from "../../extra/yaml-editor/yaml-editor";
import packageJsonSchema from "./package.schema.json";
import { JSONSchema7 } from "json-schema";

const yamlString = "color1: blue\ncolor2: red\nchoices:\n  - 1\n  - 2\ncolors:\n  - red\n  - blue\n";

function App() {
  const children = $(YamlEditor, {
    identity: { key: 'test' },
    value: yamlString,
    jsonSchema: packageJsonSchema as JSONSchema7
  });

  const sender = {
    enqueue: (identity: object, patch: object) => console.log(patch),
    ctxToPath: () => '/test'
  }
  const ack: boolean | null = null;
  const branchKey = 'abc';
  const isRoot = true;

  return createSyncProviders({sender, ack, branchKey, isRoot, children});
}

const containerElement = document.createElement("div");
document.body.appendChild(containerElement);

ReactDOM.render($(App), containerElement);