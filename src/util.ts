import { RestError } from '@azure/core-http';
import * as util from 'util';

const status = require('statuses');

/**
 * Obtains an error message to output to the log
 * 
 * @param error Error object
 * @param description Optional description to use instead of the error message
 */
export function getErrorMessage(error: any, description?: string): string {
    const parts = [description || error.message];

    // Add information from the rest error if applicable
    if (error instanceof RestError) {
        const statusCode = error.statusCode || error.code;
        if (statusCode) {
            parts.push(`Status code: ${statusCode}`);
            parts.push(status[statusCode]);
        }
    }

    return parts.filter(e => e).join(" ");
}

/**
 * Logs an error, including all nested properties
 * 
 * @param error Error to log
  */
export function logError(error: any): void {
    // Ensure that all nested properties of the error are logged.
    console.log(util.inspect(error, { depth: null }));
}
