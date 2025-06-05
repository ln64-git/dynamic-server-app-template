import React, { useEffect, useState } from "react";
import { Box, Text, useInput, useApp } from "ink";
import TextInput from "ink-text-input";
import type { DynamicServerApp } from "../app";

export interface AppProps<T extends Record<string, any>> {
  app: DynamicServerApp<T>;
}

export default function App<T extends Record<string, any>>({ app }: AppProps<T>) {
  const { exit } = useApp();
  const [editingKey, setEditingKey] = useState<keyof T | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [state, setState] = useState<Partial<T>>({});

  async function refresh() {
    if (await app.probe()) {
      const res = await fetch(`http://localhost:${app.port}/state`);
      setState(await res.json());
    } else {
      setState(app.getState());
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  const keys = Object.keys(state) as (keyof T)[];

  useInput(async (input, key) => {
    if (key.escape) {
      exit();
      return;
    }
    if (!editingKey && /[1-9]/.test(input)) {
      const idx = Number(input) - 1;
      const target = keys[idx];
      if (target) {
        setEditingKey(target);
        setInputValue(String((state as any)[target] ?? ""));
      }
    }
    if (key.return && editingKey) {
      await app.set({ [editingKey]: inputValue } as Partial<T>);
      await refresh();
      setEditingKey(null);
      setInputValue("");
    }
  });

  return (
    <Box flexDirection="column">
      <Text>Dynamic Server State (port {app.port})</Text>
      {keys.map((key) => (
        <Text key={String(key)}>
          {String(key)}: {(state as any)[key]?.toString() ?? ""}
        </Text>
      ))}
      {editingKey ? (
        <Box>
          <Text>Set {String(editingKey)}: </Text>
          <TextInput value={inputValue} onChange={setInputValue} />
        </Box>
      ) : (
        <Box flexDirection="column" marginTop={1}>
          <Text>Press number to edit field</Text>
          {keys.map((key, idx) => (
            <Text key={String(key)}>
              {idx + 1}. {String(key)}
            </Text>
          ))}
          <Text>Esc to exit</Text>
        </Box>
      )}
    </Box>
  );
}
