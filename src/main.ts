import * as core from '@actions/core';

import { loadConfigFiles } from './configfile';
import { syncConfig } from './configstore';
import { getErrorMessage } from './errors';
import { getInput } from './input';

async function main(): Promise<void> {
    try {
        const input = getInput();
        const config = await loadConfigFiles(input.workspace, input.configFile, input.format, input.separator, input.depth);

        await syncConfig(config, input.connectionString, input.strict, input.label, input.prefix, input.tags, input.contentType);
    } catch (error) {
        core.setFailed(getErrorMessage(error));
    }
}

main();
