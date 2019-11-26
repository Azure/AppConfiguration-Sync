import * as flat from 'flat';
import * as fs from 'fs';
import * as lodash from 'lodash';
import * as jsyaml from "js-yaml";
import * as util from 'util';

const dotproperties = require('dot-properties');
const glob = util.promisify(require('glob'));

/**
 * Supported formats for a config file
 */
export enum ConfigFormat {
    JSON,
    YAML,
    Properties
}

/**
 * Load the given config files into an object. The contents of multiple config files are
 * merged into a single object. Nesting within config will be flattened, with the level
 * based on the depth param.
 * 
 * @param root Root directory to search for config files.
 * @param pattern Pattern (glob) to use when searching for config files.
 * @param format Expected file format of the config file.
 * @param separator Separator used when flattening the config to key-value pairs
 * @param depth Max depth when flattening the config object
 */
export async function loadConfigFiles(root: string, pattern: string, format: ConfigFormat, separator: string, depth?: number): Promise<any> {
    const files = await glob(pattern, { cwd: root, root: root, absolute: true });
    if (files.length === 0) {
        throw new Error(`No config files found`);
    }

    const configs = [];
    
    for (const file of files) {
        console.log(`Parsing ${ConfigFormat[format]}: ${file}`);
        configs.push(await parseConfigFile(file, format));
    }

    // First deep merge all of the config objects into a single object
    // Then flatten the merged object
    const mergedConfig = lodash.merge({}, ...configs);
    return flat.flatten(mergedConfig, { delimiter: separator, maxDepth: depth });
}

async function parseConfigFile(file: string, format: ConfigFormat): Promise<any> {
    const data = (await fs.promises.readFile(file)).toString();

    switch (format) {
        case ConfigFormat.JSON:
            return JSON.parse(data);
        case ConfigFormat.YAML:
            return jsyaml.safeLoad(data, { schema: jsyaml.FAILSAFE_SCHEMA });
        case ConfigFormat.Properties:
            return dotproperties.parse(data);
        default:
            throw new Error(`Invalid config format specified: ${format}`)
    }
}
