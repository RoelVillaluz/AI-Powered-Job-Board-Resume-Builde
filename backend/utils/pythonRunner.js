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
export const runPython = (command, args=[]) => {
    return new Promise((resolve, reject) => {
        const process = spawn("python", [
            "backend/python_scripts/main.py",
            command,
            ...args
        ])

        let result = "";
        let error = "";

        process.stdout.on("data", d => result += d);
        process.stderr.on("data", d => error += d);

        process.on("close", code => {

        if (code !== 0) return reject(new Error(error));

        try {
            resolve(JSON.parse(result));
        } catch (e) {
            reject(e);
        }
        });
    })
}