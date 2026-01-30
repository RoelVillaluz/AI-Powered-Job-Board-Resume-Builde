import { spawn } from "child_process";
import logger from "./logger.js";

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
export const runPython = (command, args = []) => {
    logger.debug(`🐍 [DEBUG] Python command: ${command}`);
    logger.debug(`🐍 [DEBUG] Python args: ${args}`);

    return new Promise((resolve, reject) => {
        const pythonArgs = [
            "backend/python_scripts/main.py",
            command,
            ...args
        ];

        logger.debug(`🐍 [DEBUG] Full command: py ${pythonArgs.join(" ")}`);

        const pythonProcess = spawn("py", pythonArgs, {
            shell: true,
            env: {
                ...process.env,
                // Set PYTHONPATH so Python can find services and utils packages
                PYTHONPATH: process.cwd() 
            }
        });

        let result = "";
        let error = "";

        pythonProcess.stdout.on("data", (data) => {
            const output = data.toString();
            logger.debug(`🐍 [STDOUT]: ${output}`);
            result += output;
        });

        pythonProcess.stderr.on("data", (data) => {
            const errMsg = data.toString();
            logger.error(`🐍 [STDERR]: ${errMsg}`);
            error += errMsg;
        });

        pythonProcess.on("close", (code) => {
            logger.debug(`🐍 [DEBUG] Process exited with code: ${code}`);

            if (code !== 0) {
                return reject(new Error(error || `Python exited with code ${code}`));
            }

            try {
                logger.debug(`🐍 [DEBUG] Raw result: ${result}`);
                const parsed = JSON.parse(result);
                resolve(parsed);
            } catch (e) {
                reject(new Error(`JSON parse error: ${e.message}`));
            }
        });

        pythonProcess.on("error", (err) => {
            logger.error(`🐍 [ERROR] Failed to spawn: ${err.message}`);
            reject(new Error(`Failed to spawn Python: ${err.message}`));
        });
    });
};
