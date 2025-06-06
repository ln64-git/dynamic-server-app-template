import { useEffect, useState } from "react";
import { Box, Text, useApp } from "ink";
import TextInput from "ink-text-input";
import type { DynamicServerApp } from "./app";

export interface AppProps {
  app: DynamicServerApp<any>;
}

export function AppCli({ app }: AppProps) {
  const { exit } = useApp();
  const [state, setState] = useState<Record<string, any>>({});
  const [inputValue, setInputValue] = useState("");
  const [logMessage, setLogMessage] = useState<string | null>(null);

  useEffect(() => {
    void refresh();
  }, []);

  async function refresh() {
    const isRunning = await app.probe();
    const data = isRunning
      ? await fetch(`http://localhost:${app.port}/state`).then((r) => r.json())
      : app.getState();
    setState(data as Record<string, any>);
  }

  const functionNames = Object.getOwnPropertyNames(Object.getPrototypeOf(app))
    .filter((k) => typeof (app as any)[k] === "function" && k !== "constructor");

  async function handleCommand(command: string) {
    const [cmd, ...args] = command.trim().split(" ");

    if (cmd === "exit") return exit();

    if (cmd === "get") {
      const key = args[0];
      if (!key) return setLogMessage("Please specify a key.");
      if (key === "port") return setLogMessage(`Access to 'port' is restricted.`);
      setLogMessage(`${key}: ${state[key as keyof typeof state]}`);
      return;
    }

    if (cmd === "set") {
      const key = String(args[0]);
      if (key === "port") return setLogMessage(`'port' cannot be modified.`);
      const value = args.slice(1).join(" ");
      await app.set({ [key]: value });
      await refresh();
      setLogMessage(`Set ${key} = ${value}`);
      return;
    }

    if (cmd?.endsWith("()")) {
      const fn = cmd.slice(0, -2);
      try {
        const isRunning = await app.probe();
        const result = isRunning
          ? await fetch(`http://localhost:${app.port}/${fn}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify([]),
          }).then((r) => r.json())
          : await (app as any)[fn]();
        const output = isRunning ? result.result : result;
        await refresh();
        setLogMessage(`${JSON.stringify(output)}`);
      } catch (e: any) {
        setLogMessage(`Error: ${e.message}`);
      }
      return;
    }

    setLogMessage(`Unknown command: ${command}`);
  }

  const className = app.constructor.name;

  function renderTypedInput() {
    const [first, ...rest] = inputValue.trim().split(" ");
    const restText = rest.join(" ");
    const isFn = inputValue.trim().endsWith("()");
    const isGetSet = first === "get" || first === "set";

    if (isGetSet) {
      return (
        <Text>
          <Text color="magenta">{first}</Text>
          <Text> </Text>
          <Text color="cyan">{restText}</Text>
        </Text>
      );
    }

    if (isFn) {
      return <Text color="blue">{inputValue}</Text>;
    }

    return <Text color="cyan">{inputValue}</Text>;
  }

  return (
    <Box flexDirection="column" paddingLeft={2}>
      {/* Header */}
      <Text>
        <Text color="cyan" bold>{className}</Text>
        <Text color="gray"> (port {app.port})</Text>
      </Text>

      {/* Variables */}
      <Text bold>Variables:</Text>
      <Box flexDirection="column" paddingLeft={2}>
        {Object.entries(state)
          .filter(([key]) => key !== "port")
          .map(([key, val]) => (
            <Text key={key}>
              <Text color="gray">{key.padEnd(12)}</Text>
              <Text color="white">{String(val)}</Text>
            </Text>
          ))}
      </Box>

      {/* Functions */}
      <Text bold>Functions:</Text>
      <Box flexDirection="column" paddingLeft={2}>
        {functionNames.map((fn) => (
          <Text key={fn}>
            <Text color="blue">{fn}()</Text>
          </Text>
        ))}
      </Box>

      {/* Log output */}
      {logMessage && (
        <Box paddingTop={1}>
          <Text color="cyan">{logMessage}</Text>
        </Box>
      )}

      {/* Input prompt */}
      <Box paddingTop={1}>
        <Text color="cyan">› </Text>
        {renderTypedInput()}
      </Box>

      {/* Hidden input */}
      <Box height={0}>
        <TextInput
          value={inputValue}
          onChange={setInputValue}
          onSubmit={handleCommand}
        />
      </Box>
    </Box>
  );
}
