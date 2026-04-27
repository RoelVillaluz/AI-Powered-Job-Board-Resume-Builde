import { spawn } from "child_process";
import logger from "../../utils/logger.js";
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Execute a Python AI command and parse JSON output.
 *
 * This utility:
 * - Spawns a Python process
 * - Passes command + arguments
 * - Captures stdout / stderr
 * - Parses JSON output
 *
 * @param   {string} command - Python command name (e.g. "score_resume")
 * @param   {string[]} args - Arguments passed to Python script
 *
 * @returns {Promise<Object>} Parsed JSON response from Python
 *
 * @throws {Error} If process exits non-zero or JSON parsing fails
 */
export const runPython = (command, args = [], emit = () => {}) => {
    logger.debug(`🐍 [Python] Command: ${command}`);
    logger.debug(`🐍 [Python] Args: ${JSON.stringify(args)}`);

    return new Promise((resolve, reject) => {
        const pythonArgs = [
            "src/python_scripts/main.py",
            command,
            ...args
        ];

        logger.debug(`🐍 [Python] Full invocation: python ${pythonArgs.join(" ")}`);

        // Use venv Python if available, fall back to system python
        const pythonExecutable = process.env.PYTHON_EXECUTABLE ?? 'python';

        const pythonProcess = spawn(pythonExecutable, pythonArgs, {
            shell: true,
            env: {
                ...process.env,
                PYTHONPATH: process.cwd(),
            }
        });

        let resultBuffer = "";
        let errorBuffer = "";

        pythonProcess.stdout.on("data", (data) => {
            const lines = data.toString().split("\n");

            for (const line of lines) {
                const trimmed = line.trim();
                if (!trimmed) continue;

                try {
                    const parsed = JSON.parse(trimmed);

                    if (parsed.type === "progress") {
                        logger.debug(
                            `🐍 [Python] Progress: [${parsed.event}] ${parsed.progress}% — ${parsed.message}`
                        );

                        emit(parsed.event, {
                            progress: parsed.progress,
                            message: parsed.message
                        });
                    } else {
                        resultBuffer += trimmed;
                    }
                } catch {
                    resultBuffer += trimmed;
                }
            }
        });

        pythonProcess.stderr.on("data", (data) => {
            const msg = data.toString().trim();
            if (!msg) return;

            // 🚫 Ignore httpx logs
            if (msg.includes("httpx")) return;

            if (msg.includes(' - ERROR - ') || msg.includes(' - CRITICAL - ')) {
                logger.error(`🐍 [Python]: ${msg}`);
            } else if (msg.includes(' - WARNING - ')) {
                logger.warn(`🐍 [Python]: ${msg}`);
            } else {
                logger.debug(`🐍 [Python]: ${msg}`);
            }
        });

        pythonProcess.on("close", (code) => {
            logger.debug(`🐍 [Python] Process exited with code: ${code}`);

            if (code !== 0) {
                return reject(
                    new Error(errorBuffer || `Python process failed with code ${code}`)
                );
            }

            if (!resultBuffer) {
                return reject(new Error("Python produced no output"));
            }

            try {
                const result = JSON.parse(resultBuffer);
                resolve(result);
            } catch (e) {
                reject(
                    new Error(
                        `Failed to parse Python JSON: ${e.message}. Raw: ${resultBuffer.slice(0, 300)}`
                    )
                );
            }
        });

        pythonProcess.on("error", (err) => {
            logger.error(`🐍 [Python] Spawn error: ${err.message}`);
            reject(new Error(`Failed to spawn Python: ${err.message}`));
        });
    });
};