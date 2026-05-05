import { describe, expect, it, vi } from "vitest";
import { InteractiveMode } from "../src/modes/interactive/interactive-mode.js";

type SubmitHandler = (text: string) => Promise<void>;

type ExitCommandContext = {
	defaultEditor: { onSubmit?: SubmitHandler };
	editor: { setText: (text: string) => void };
	shutdown: () => Promise<void>;
};

type InteractiveModePrototype = {
	setupEditorSubmitHandler(this: ExitCommandContext): void;
};

const interactiveModePrototype = InteractiveMode.prototype as unknown as InteractiveModePrototype;

describe("InteractiveMode exit commands", () => {
	it.each(["/quit", "/exit"] as const)("clears the editor and shuts down for %s", async (command) => {
		const defaultEditor: ExitCommandContext["defaultEditor"] = {};
		const setText = vi.fn();
		const shutdown = vi.fn(async () => {});

		const context: ExitCommandContext = {
			defaultEditor,
			editor: { setText },
			shutdown,
		};

		interactiveModePrototype.setupEditorSubmitHandler.call(context);

		expect(defaultEditor.onSubmit).toBeDefined();
		await defaultEditor.onSubmit?.(command);

		expect(setText).toHaveBeenCalledWith("");
		expect(shutdown).toHaveBeenCalledTimes(1);
	});
});
