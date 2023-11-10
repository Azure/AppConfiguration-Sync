import * as core from '@actions/core';
import { AppConfigurationClient } from '@azure/app-configuration';

import { loadConfigFiles } from './configfile';
import { syncConfig, clientFromConnectionString, clientFromIdentityFederation, clientFromServicePrincipal } from './configstore';
import { getErrorMessage } from './errors';
import { getInput } from './input';

async function main(): Promise<void> {
    try {
        const input = getInput();
        const config = await loadConfigFiles(input.workspace, input.configFile, input.format, input.separator, input.depth);

        let client;
        switch (input.connectionInfo.type) {
            case 'connection-string':
                client = clientFromConnectionString(input.connectionInfo);
                break;
            case 'identity':
                client = await clientFromIdentityFederation(input.connectionInfo);
                break;
            case 'service-principal':
                client = clientFromServicePrincipal(input.connectionInfo);
                break;
        }
        await syncConfig(config, client, input.strict, input.label, input.prefix, input.tags, input.contentType);
    } catch (error) {
        core.setFailed(getErrorMessage(error));
    }
}

main();
