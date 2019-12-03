import { RestError } from "@azure/core-http";

const status = require('statuses');

/**
 * Custom error type used during input validation
 */
export class ArgumentError extends Error {
}

/**
 * Custom error type used during configuration file parsing
 */
export class ParseError extends Error {
}

/**
 * Obtains an error message to output to the log
 * 
 * @param error Error object
 * @param description Optional description to include in the error message
 */
export function getErrorMessage(error: any, description?: string): string {
    const parts = [description];

    // Include the error message from our custom Error types
    if (error instanceof ArgumentError || error instanceof ParseError) {
        parts.push(error.message);
    } else if (error instanceof RestError) {
        // Include status code if present 
        const statusCode = error.statusCode || error.code;
        if (statusCode) {
            parts.push(`Status code: ${statusCode}`);
            parts.push(status[statusCode]);
        }
    }

    // Remove null/undefined/empty values
    const filteredParts = parts.filter(e => e);

    return filteredParts.length === 0 ?
        "An unknown error occurred." :
        filteredParts.join(" ");
}
