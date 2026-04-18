import { spawn } from "child_process";
import logger from "../../utils/logger.js";

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
            "backend/python_scripts/main.py",
            command,
            ...args
        ];

        logger.debug(`🐍 [Python] Full invocation: py ${pythonArgs.join(" ")}`);

        const pythonProcess = spawn("py", pythonArgs, {
            shell: true,
            env: {
                ...process.env,
                // Allow Python to resolve internal service/util packages
                PYTHONPATH: process.cwd()
            }
        });

        // Accumulates non-progress stdout lines — should parse to the final result
        let resultBuffer = "";
        let errorBuffer = "";

        pythonProcess.stdout.on("data", (data) => {
            const lines = data.toString().split("\n");

            for (const line of lines) {
                const trimmed = line.trim();
                if (!trimmed) continue;

                let parsed;
                try {
                    parsed = JSON.parse(trimmed);
                } catch {
                    // Non-JSON stdout (e.g. accidental print statements) — accumulate
                    // as-is so the close handler can surface a meaningful parse error
                    // logger.debug(`🐍 [Python] Non-JSON stdout: ${trimmed}`);
                    resultBuffer += trimmed;
                    continue;
                }

                if (parsed.type === "progress") {
                    // Mid-stream progress event — forward to socket immediately
                    logger.debug(`🐍 [Python] Progress: [${parsed.event}] ${parsed.progress}% — ${parsed.message}`);
                    emit(parsed.event, { progress: parsed.progress, message: parsed.message });
                } else {
                    // Final result payload — accumulate for return
                    resultBuffer += trimmed;
                }
            }
        });

        pythonProcess.stderr.on("data", (data) => {
            const msg = data.toString();
            logger.error(`🐍 [Python STDERR]: ${msg}`);
            errorBuffer += msg;
        });

        pythonProcess.on("close", (code) => {
            logger.debug(`🐍 [Python] Process exited with code: ${code}`);

            if (code !== 0) {
                return reject(new Error(errorBuffer || `Python process exited with code ${code}`));
            }

            if (!resultBuffer) {
                return reject(new Error("Python produced no result output"));
            }

            try {
                const result = JSON.parse(resultBuffer);
                logger.debug(`🐍 [Python] Result parsed successfully`);
                resolve(result);
            } catch (e) {
                reject(new Error(
                    `Failed to parse Python result as JSON: ${e.message}. ` +
                    `Raw output: ${resultBuffer.slice(0, 500)}`
                ));
            }
        });

        pythonProcess.on("error", (err) => {
            logger.error(`🐍 [Python] Failed to spawn process: ${err.message}`);
            reject(new Error(`Failed to spawn Python process: ${err.message}`));
        });
    });
};
