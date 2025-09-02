
/**
 * Logs messages with a custom prefix for easier troubleshooting.
 *
 * @param {string|object} message - The message to log.
 * @param {object} [obj] - Optional additional object to log.
 */
export function log(message, obj) {
    if (typeof message == 'string') {
        console.log("Athena-Chrome-Extension: " + message);
    } else {
        console.dir(message);
    }

    if (obj) {
        console.dir(obj);
    }
}