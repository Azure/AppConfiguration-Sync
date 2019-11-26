import * as core from '@actions/core';

import { loadConfigFiles } from './configfile';
import { syncConfig } from './configstore';
import { getInput } from './input';
import { logError, getErrorMessage } from './util';

async function main(): Promise<void> {
    try {
        const input = getInput();
        const config = await loadConfigFiles(input.workspace, input.configFile, input.format, input.separator, input.depth);

        await syncConfig(config, input.connectionString, input.strict, input.label, input.prefix, input.tags);
    } catch (error) {
        const errorMessage = getErrorMessage(error);
        console.log(errorMessage);
        logError(error);
        
        core.setFailed(errorMessage);
    }
}

main();
