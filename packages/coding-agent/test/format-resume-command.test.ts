import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import type { SessionManager } from "../src/core/session-manager.ts";
import { formatResumeCommand } from "../src/modes/interactive/interactive-mode.ts";

const tempDirs: string[] = [];
const originalStdoutIsTTY = Object.getOwnPropertyDescriptor(process.stdout, "isTTY");
const RAW_PI_SESSION_COMMAND = /(^|\s)pi\s+--session\b/;
const SESSION_DIR_ARG = /(^|\s)--session-dir(?:\s|=)/;

afterEach(() => {
	if (originalStdoutIsTTY) {
		Object.defineProperty(process.stdout, "isTTY", originalStdoutIsTTY);
	} else {
		Reflect.deleteProperty(process.stdout, "isTTY");
	}

	for (const dir of tempDirs.splice(0)) {
		rmSync(dir, { recursive: true, force: true });
	}
});

function setStdoutIsTTY(value: boolean): void {
	Object.defineProperty(process.stdout, "isTTY", { configurable: true, value });
}

function createTempFile(): string {
	const dir = mkdtempSync(join(tmpdir(), "pi-format-resume-command-"));
	tempDirs.push(dir);
	const file = join(dir, "session.jsonl");
	writeFileSync(file, "\n");
	return file;
}

function createSessionManager(options: {
	persisted?: boolean;
	sessionFile?: string;
	sessionId?: string;
	sessionDir?: string;
	usesDefaultSessionDir?: boolean;
}): SessionManager {
	return {
		isPersisted: () => options.persisted ?? true,
		getSessionFile: () => options.sessionFile,
		getSessionId: () => options.sessionId ?? "0197f6e4-4cf9-7f44-a2d8-f8f7f49ee9d3",
		getSessionDir: () => options.sessionDir ?? "/tmp/pi-sessions",
		usesDefaultSessionDir: () => options.usesDefaultSessionDir ?? true,
	} as unknown as SessionManager;
}

function expectStronkPiResumeCommand(command: string | undefined): void {
	expect(command).toBe("stronkpi --session test-session");
	expect(command).not.toMatch(RAW_PI_SESSION_COMMAND);
	expect(command).not.toMatch(SESSION_DIR_ARG);
}

describe("formatResumeCommand", () => {
	it("returns a session resume command for default session dirs", () => {
		setStdoutIsTTY(true);
		const sessionFile = createTempFile();
		const sessionManager = createSessionManager({ sessionFile, sessionId: "test-session" });

		expectStronkPiResumeCommand(formatResumeCommand(sessionManager));
	});

	it("does not expose unquoted safe session dirs for non-default session dirs", () => {
		setStdoutIsTTY(true);
		const sessionFile = createTempFile();
		const sessionManager = createSessionManager({
			sessionFile,
			sessionId: "test-session",
			sessionDir: "/tmp/custom-pi-sessions",
			usesDefaultSessionDir: false,
		});

		expectStronkPiResumeCommand(formatResumeCommand(sessionManager));
	});

	it("does not expose session dirs containing spaces", () => {
		setStdoutIsTTY(true);
		const sessionFile = createTempFile();
		const sessionManager = createSessionManager({
			sessionFile,
			sessionId: "test-session",
			sessionDir: "/tmp/custom pi sessions",
			usesDefaultSessionDir: false,
		});

		expectStronkPiResumeCommand(formatResumeCommand(sessionManager));
	});

	it("does not expose session dirs containing single quotes", () => {
		setStdoutIsTTY(true);
		const sessionFile = createTempFile();
		const sessionManager = createSessionManager({
			sessionFile,
			sessionId: "test-session",
			sessionDir: "/tmp/custom pi's sessions",
			usesDefaultSessionDir: false,
		});

		expectStronkPiResumeCommand(formatResumeCommand(sessionManager));
	});

	it("returns undefined when stdout is not a TTY", () => {
		setStdoutIsTTY(false);
		const sessionFile = createTempFile();
		const sessionManager = createSessionManager({ sessionFile });

		expect(formatResumeCommand(sessionManager)).toBeUndefined();
	});

	it("returns undefined for in-memory sessions", () => {
		setStdoutIsTTY(true);
		const sessionFile = createTempFile();
		const sessionManager = createSessionManager({ persisted: false, sessionFile });

		expect(formatResumeCommand(sessionManager)).toBeUndefined();
	});

	it("returns undefined when the session file is missing", () => {
		setStdoutIsTTY(true);
		const sessionManager = createSessionManager({ sessionFile: "/tmp/pi-missing-session.jsonl" });

		expect(formatResumeCommand(sessionManager)).toBeUndefined();
	});

	it("returns undefined when the session file is not set", () => {
		setStdoutIsTTY(true);
		const sessionManager = createSessionManager({ sessionFile: undefined });

		expect(formatResumeCommand(sessionManager)).toBeUndefined();
	});
});
