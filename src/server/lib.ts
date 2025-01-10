import { CompletionItemKind, CompletionItem } from 'vscode-languageserver/node';

interface Config {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value: any;
  detail: string;
  documentation: string;
}

export function createCompletionItems(
  config: { value: Config },
  level = 0,
  parent = ''
): CompletionItem[] {
  let res: CompletionItem[] = [];
  if (!config) {
    console.warn('Config is missing in createCompletionItems', config);
    return res;
  }
  Object.keys(config).forEach((label) => {
    const item = config[label as keyof typeof config];
    if (!item) {
      return;
    }
    const { value, detail, documentation } = item;
    res.push({
      label,
      kind:
        typeof value === 'string'
          ? CompletionItemKind.Text
          : typeof value === 'number'
            ? CompletionItemKind.Constant
            : Array.isArray(value)
              ? CompletionItemKind.Enum
              : typeof value === 'boolean'
                ? CompletionItemKind.Variable
                : typeof value === 'object'
                  ? CompletionItemKind.Struct
                  : CompletionItemKind.Text,
      detail,
      documentation,
      data: {
        level,
        parent,
      },
    });
    if (typeof item.value === 'object') {
      res = res.concat(
        createCompletionItems(
          item.value,
          level +
            (label === 'services' ||
            label === 'ports' ||
            label === 'static' ||
            Array.isArray(item.value)
              ? 2
              : 1),
          label
        )
      );
    }
  });

  return res;
}

export function getParentProperty({
  text,
  currentLevel,
  currentLineIndex,
}: {
  text: string;
  currentLevel: number;
  currentLineIndex: number;
}) {
  const lines = text.split('\n');

  for (let i = currentLineIndex - 1; i >= 0; i--) {
    const line = lines[i];
    const parentLevel = getCurrentLevel(line);

    if (parentLevel < currentLevel) {
      const match = line.match(/^\s*-?\s*(\w+):\s*(.*)/);
      if (match) {
        const parentKey = match[1].trim();
        const parentValue = match[2].trim();
        return { key: parentKey, value: parentValue };
      }
    }
  }

  return null;
}

export function getCurrentLevel(currentLine: string) {
  const leadingSpacesM = currentLine.match(/^\s*-?\s*|\s*/);
  if (!leadingSpacesM) {
    return 1;
  }
  const leadingSpaces = leadingSpacesM[0].length;

  const level = leadingSpaces / 2;

  return level;
}
