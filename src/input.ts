import * as core from '@actions/core';

import { ConfigFormat } from './configfile';

/**
 * Represents the inputs to the GitHub action
 */
export interface Input {
    workspace: string;
    configFile: string;
    format: ConfigFormat;
    connectionString: string;
    separator: string;
    strict: boolean;
    prefix?: string;
    label?: string;
    depth?: number;
    tags?: Tags;
}

/**
 * Represents the tags that apply to a setting
 */
export interface Tags {
    [propertyName: string]: string;    
}

/**
 * Obtain the action inputs from the GitHub environment
 */
export function getInput(): Input {
    return {
        workspace:          getWorkspace(),
        configFile:         getRequiredInputString('configurationFile'),
        format:             getFormat(),
        connectionString:   getConnectionString(),
        separator:          getSeparator(),
        strict:             getStrict(),
        prefix:             getNonRequiredInputString('prefix'),
        label:              getNonRequiredInputString('label'),
        depth:              getDepth(),
        tags:               getTags()
    }
}

function getRequiredInputString(name: string): string {
    return core.getInput(name, { required: true });
}

function getNonRequiredInputString(name: string): string | undefined {
    return core.getInput(name, { required: false });
}

function getWorkspace(): string {
    const workspace = process.env.GITHUB_WORKSPACE;
    if (!workspace) {
        throw new Error('Run environment is missing GITHUB_WORKSPACE variable');
    }

    return workspace;
}

function getFormat(): ConfigFormat {
    const format = getRequiredInputString('format');
    switch (format) {
        case "json":
            return ConfigFormat.JSON;
        case "yaml":
            return ConfigFormat.YAML;
        case "properties":
            return ConfigFormat.Properties;
        default:
            throw new Error(`Format '${format}' is invalid. Allowed values are: json, yaml, properties`);
    }
}

function getConnectionString(): string {
    const connectionString = getRequiredInputString('connectionString');

    if (!connectionString.match(/Endpoint=(.*);Id=(.*);Secret=(.*)/)) {
        throw new Error(`Connection string is invalid.`);
    }

    return connectionString;
}

function getSeparator(): string {
    const separator = getRequiredInputString('separator');
    const validSeparators = ['.', ',', ';', '-', '_', '__', '/', ':'];

    if (!validSeparators.includes(separator)) {
        throw new Error(`Separator '${separator}' is invalid. Allowed values are: '.', ',', ';', '-', '_', '__', '/', ':'`);
    }

    return separator;
}

function getStrict(): boolean {
    const strict = getRequiredInputString('strict');
    if (strict === "true") {
        return true;
    } else if (strict === "false") {
        return false;
    } else {
        throw new Error(`Strict '${strict}' is invalid. Allowed values are: true, false`);
    }   
}

function getDepth(): number | undefined {
    const depth = getNonRequiredInputString('depth');
    if (!depth) {
        return undefined;
    }
    
    const parsedDepth = parseInt(depth);
    if (isNaN(parsedDepth) || parsedDepth < 1) {
        throw new Error(`Depth '${depth}' is invalid. Depth should be a positive number.`);
    }

    return parsedDepth;
}

function getTags(): Tags | undefined {
    const tags = getNonRequiredInputString('tags');
    if (!tags) {
        return undefined;
    }

    let error = false;
    const parsedTags = JSON.parse(tags);

    // Verify the structure of the parsed tags (string properties only)
    for (const key of Object.keys(parsedTags)) {
        const value = parsedTags[key];

        if (typeof value !== "string") {
            core.error(`Tag property value '${key}' should be a string.`);
            error = true;
        }
    }

    if (error) {
        throw new Error(`Tags are invalid. Tags should only contain string properties: ${tags}`)
    }

    return parsedTags;
}
