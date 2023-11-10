import * as core from '@actions/core';

import { ConfigFormat } from './configfile';
import { ArgumentError } from './errors';

/**
 * Represents the inputs to the GitHub action
 */
export interface Input {
    workspace: string;
    configFile: string;
    format: ConfigFormat;
    connectionInfo: ConnectionString | Identity | ServicePrincipal;
    separator: string;
    strict: boolean;
    prefix?: string;
    label?: string;
    depth?: number;
    tags?: Tags;
    contentType?: string;
}

export interface ConnectionString {
    type: 'connection-string';
    connectionString: string;
}

export interface Identity {
    type: 'identity';
    endpoint: string;
    clientId: string;
    tenantId: string;
    audience: string;
}

export interface ServicePrincipal {
    type: 'service-principal';
    endpoint: string;
    clientId: string;
    clientSecret: string;
    tenantId: string;
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
    let connectionInfo;
    switch (getRequiredInputString('auth-type')) {
        case 'CONNECTION_STRING':
            connectionInfo = getConnectionStringConnectionInfo();
            break;
        case 'FEDERATED_IDENTITY':
            connectionInfo = getWorkloadIdentityConnectionInfo();
            break;
        case 'SERVICE_PRINCIPAL':
            connectionInfo = getServicePrincipalConnectionInfo();
            break;
        default:
            throw new ArgumentError(`Invalid 'auth-type', expected one of { CONNECTION_STRING, FEDERATED_IDENTITY, SERVICE_PRINCIPAL }`);
    }

    return {
        workspace:          getWorkspace(),
        configFile:         getRequiredInputString('configurationFile'),
        connectionInfo:     connectionInfo,
        format:             getFormat(),
        separator:          getSeparator(),
        strict:             getStrict(),
        prefix:             getNonRequiredInputString('prefix'),
        label:              getNonRequiredInputString('label'),
        depth:              getDepth(),
        tags:               getTags(),
        contentType:        getNonRequiredInputString('contentType')
    }
}

function getRequiredInputString(name: string): string {
    const input = getNonRequiredInputString(name);
    if (!input) {
        throw new ArgumentError(`Required input is missing: ${name}`);
    }

    return input;
}

function getNonRequiredInputString(name: string): string | undefined {
    return core.getInput(name, { required: false });
}

function getWorkspace(): string {
    const workspace = process.env.GITHUB_WORKSPACE;
    if (!workspace) {
        throw new ArgumentError('Run environment is missing GITHUB_WORKSPACE variable');
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
            throw new ArgumentError(`Format '${format}' is invalid. Allowed values are: json, yaml, properties`);
    }
}

function getConnectionStringConnectionInfo(): ConnectionString {
    let connectionString = getRequiredInputString('connectionString');

    const segments = connectionString.split(";");
    let valid = false;

    if (segments.length === 3) {
        let hasEndpoint = false;
        let hasId = false;
        let hasSecret = false;

        for (const segment of segments) {
            if (segment.startsWith('Endpoint=')) {
                hasEndpoint = true;
            } else if (segment.startsWith('Id=')) {
                hasId = true;
            } else if (segment.startsWith('Secret=')) {
                hasSecret = true;
            }
        }
        
        valid = hasEndpoint && hasId && hasSecret;
    }

    if (!valid) {
        throw new ArgumentError(`Connection string is invalid: need Endpoint, Id and Secret segments.`);
    }

    return { type: 'connection-string', connectionString };
}

function getSeparator(): string {
    const separator = getRequiredInputString('separator');
    const validSeparators = ['.', ',', ';', '-', '_', '__', '/', ':'];

    if (!validSeparators.includes(separator)) {
        throw new ArgumentError(`Separator '${separator}' is invalid. Allowed values are: ${validSeparators.map(s => `'${s}'`).join(", ")}`);
    }

    return separator;
}

function getStrict(): boolean {
    const strict = getNonRequiredInputString('strict');
    if (!strict) {
        return false;
    }
    
    if (strict === "true") {
        return true;
    } else if (strict === "false") {
        return false;
    } else {
        throw new ArgumentError(`Strict '${strict}' is invalid. Allowed values are: true, false`);
    }   
}

function getDepth(): number | undefined {
    const depth = getNonRequiredInputString('depth');
    if (!depth) {
        return undefined;
    }
    
    const parsedDepth = parseInt(depth);
    if (isNaN(parsedDepth) || parsedDepth < 1) {
        throw new ArgumentError(`Depth '${depth}' is invalid. Depth should be a positive number.`);
    }

    return parsedDepth;
}

function getTags(): Tags | undefined {
    const tags = getNonRequiredInputString('tags');
    if (!tags) {
        return undefined;
    }

    let error = false;
    
    let parsedTags: any;

    try {
        parsedTags = JSON.parse(tags);
    } catch (error) {
        throw new ArgumentError('Failed to parse tags as JSON.');
    }
    
    // Verify the structure of the parsed tags (string properties only)
    for (const key of Object.keys(parsedTags)) {
        const value = parsedTags[key];

        if (typeof value !== "string") {
            core.error(`Tag property value '${key}' should be a string.`);
            error = true;
        }
    }

    if (error) {
        throw new ArgumentError(`Tags are invalid. Tags should only contain string properties: ${tags}`)
    }

    return parsedTags;
}

function getWorkloadIdentityConnectionInfo(): Identity {
  const endpoint = getNonRequiredInputString("endpoint");
  const clientId = getNonRequiredInputString("client-id");
  const tenantId = getNonRequiredInputString("tenant-id");
  const audience = getRequiredInputString("audience");
  if (!endpoint || !clientId || !tenantId)
      throw new ArgumentError(`Need all of { endpoint, client-id, tenant-id } for auth-type FEDERATED_IDENTITY`)

  return { type: 'identity', endpoint, clientId, tenantId, audience };
}

function getServicePrincipalConnectionInfo(): ServicePrincipal {
  const endpoint = getNonRequiredInputString("endpoint");
  const clientId = getNonRequiredInputString("client-id");
  const clientSecret = getNonRequiredInputString("client-secret");
  const tenantId = getNonRequiredInputString("tenant-id");
  if (!endpoint || !clientId || !clientSecret || !tenantId)
      throw new ArgumentError(`Need all of { endpoint, client-id, client-secret, tenant-id } for auth-type SERVICE_PRINCIPAL`)

  return { type: 'service-principal', endpoint, clientId, clientSecret, tenantId };
}
