import { describe, expect, it } from "vitest";
import { BUILTIN_SLASH_COMMANDS } from "../src/core/slash-commands.js";

describe("BUILTIN_SLASH_COMMANDS", () => {
	it("includes quit and exit as separate built-in commands", () => {
		const commandsByName = new Map(BUILTIN_SLASH_COMMANDS.map((command) => [command.name, command]));

		expect(commandsByName.has("quit")).toBe(true);
		expect(commandsByName.has("exit")).toBe(true);
		expect(commandsByName.get("exit")?.description).toMatch(/alias for \/quit/i);
	});

	it("does not define duplicate command names", () => {
		const names = BUILTIN_SLASH_COMMANDS.map((command) => command.name);

		expect(new Set(names).size).toBe(names.length);
	});
});
