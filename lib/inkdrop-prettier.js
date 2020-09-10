"use babel";

import { CompositeDisposable } from "event-kit";
import prettier from "prettier";

const pos2offset = (text, pos) => {
  const list = text.split("\n");

  let offset = pos.ch;
  for (let i = 0; i < pos.line; i++) {
    offset += list[i].length + 1;
  }

  return offset;
};

const offset2pos = (text, offset) => {
  const list = text.split("\n");

  let sum = 0;
  for (let i = 0; i < list.length; i++) {
    sum += list[i].length + 1;
    if (sum > offset) {
      return { line: i, ch: list[i].length + 1 - (sum - offset) };
    }
  }

  return { line: list.length, ch: list[list.length - 1].length };
};

const format = () => {
  if (!inkdrop.isEditorActive()) {
    return;
  }

  const indentUnit = inkdrop.config.get("editor.indentUnit");

  const { cm } = inkdrop.getActiveEditor();
  const beforeText = cm.getValue();
  const beforePos = cm.getCursor();
  const beforeCoords = cm.cursorCoords();
  const beforeOffset = pos2offset(beforeText, beforePos);

  const { formatted, cursorOffset } = prettier.formatWithCursor(beforeText, {
    cursorOffset: beforeOffset,
    parser: "markdown",
    tabWidth: indentUnit,
  });

  const pos = offset2pos(formatted, cursorOffset);

  cm.setValue(formatted);
  cm.setCursor(pos);

  const afterCoords = cm.cursorCoords();
  const afterScrollInfo = cm.getScrollInfo();
  const scroll = afterScrollInfo.top + afterCoords.top - beforeCoords.top;

  cm.scrollTo(0, scroll);
};

const subscriptions = new CompositeDisposable();
const CONFIG_NAME_SPACE = "prettier";
const CONFIG_KEY_ON_SAVE = "onSave";

export const config = {
  [CONFIG_KEY_ON_SAVE]: {
    title: "Format On Save",
    type: "boolean",
    default: true,
  },
};

export const activate = () => {
  subscriptions.add(
    inkdrop.commands.add(document.body, {
      "prettier:format": format,
    })
  );

  subscriptions.add(
    inkdrop.commands.add(document.body, {
      "core:save-note": () => {
        if (inkdrop.config.get(`${CONFIG_NAME_SPACE}.${CONFIG_KEY_ON_SAVE}`)) {
          format();
        }
      },
    })
  );
};

export const deactivate = () => {
  subscriptions.dispose();
};
