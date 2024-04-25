import * as core from '@actions/core';
import { AppConfigurationClient, ConfigurationSettingId, SetConfigurationSettingParam } from '@azure/app-configuration';

import { ArgumentError, getErrorMessage } from './errors';
import { Tags } from './input';
import { DefaultAzureCredential } from '@azure/identity';

const userAgentPrefix = "GitHub-AppConfiguration-Sync/1.0.0";

/**
 * Sync from a config object to a config store
 * 
 * @param config Config object to sync.
 * @param connectionString Connection string for the config store that the sync targets.
 * @param strict Whether to make the config store exactly match the config object (for a prefix/label).
 * @param label Label assigned to the modified settings.
 * @param prefix Prefix appended to the front of the setting key.
 * @param tags Tags applied to the modified settings.
 * @param contentType Content type applied to the settings.
 */
export async function syncConfig(config: any, strict: boolean, authType: string, endpoint?: string, connectionString?: string, label?: string, prefix?: string, tags?: Tags, contentType?: string): Promise<void> {
    const appConfigurationOptions = {
        userAgentOptions: {
            userAgentPrefix: userAgentPrefix
        }
    };

    let client: AppConfigurationClient;
    if (authType === "ServicePrincipal" && endpoint) {
        const credential = new DefaultAzureCredential()
        client = new AppConfigurationClient(endpoint, credential)
    } else  {
        if (connectionString) {
        client = new AppConfigurationClient(connectionString, appConfigurationOptions);
        } else {
            throw new ArgumentError("Provide auth method");
        }
    }

    core.info('Determining which keys to sync');
    const settingsToAdd = getSettingsToAdd(config, label, prefix, tags, contentType);
    const settingsToDelete = strict ? await getSettingsToDelete(client, settingsToAdd, label, prefix) : [];

    const failedDeletes = await deleteSettings(client, settingsToDelete);
    const failedAdds = await addSettings(client, settingsToAdd);

    // If there was a failure, output a summary of what failed
    if (failedDeletes.length > 0 || failedAdds.length > 0) {

        const errorMessage = (failedDeletes.length === settingsToDelete.length && failedAdds.length === settingsToAdd.length) ?
            "Configuration sync failed." :
            "Configuration sync partially succeeded.";

        // Using setFailed to fail the entire action
        core.setFailed(errorMessage);

        for (const message of failedDeletes) {
            core.error(message);
        }

        for (const message of failedAdds) {
            core.error(message);
        }
    }   
}

function getSettingsToAdd(config: any, label?: string, prefix?: string, tags?: Tags, contentType?: string): SetConfigurationSettingParam[] {
    const settings: SetConfigurationSettingParam[] = [];

    for (const key in config) {      
        settings.push({
            key: prefix ? prefix + key : key,
            value: getSettingValue(config[key]),
            label: label ? label : undefined,
            tags: tags ? tags : undefined,
            contentType: contentType ? contentType : undefined
        });
    }

    return settings;
}

function getSettingValue(value: any): string | undefined {
    if (value === null || value === undefined) {
        return "";
    } else if (typeof value === "object") {
        return JSON.stringify(value);
    } else {
        return String(value);
    }
}

async function getSettingsToDelete(client: AppConfigurationClient, settingsToAdd: SetConfigurationSettingParam[], label?: string, prefix?: string): Promise<ConfigurationSettingId[]> {
    const settings: ConfigurationSettingId[] = [];
    const keysToIgnore = new Set(settingsToAdd.map(e => e.key));
    
    const filterOptions = {
        keyFilter: prefix ? prefix + "*" : undefined,
        labelFilter: label ? label : "\0",
    };

    for await (const setting of client.listConfigurationSettings(filterOptions)) {
        if (!keysToIgnore.has(setting.key)) {
            settings.push(setting);
        }
    }

    return settings;
}

async function addSettings(client: AppConfigurationClient, settings: SetConfigurationSettingParam[]): Promise<string[]> {
    const errorMessages: string[] = [];

    for (const setting of settings) {
        try {
            core.info(`Adding key '${setting.key}' with label '${getLabel(setting)}'.`);
            await client.setConfigurationSetting(setting);
        } catch (error) {
             errorMessages.push(getErrorMessage(error, `Failed to add key '${setting.key}' with label '${getLabel(setting)}'.`));
        }
    }

    return errorMessages;
}

async function deleteSettings(client: AppConfigurationClient, settings: ConfigurationSettingId[]): Promise<string[]> {
    const errorMessages: string[] = [];

    for (const setting of settings) {
        try {
            core.info(`Deleting key '${setting.key}' with label '${getLabel(setting)}'.`);
            await client.deleteConfigurationSetting(setting);
        } catch (error) {          
            errorMessages.push(getErrorMessage(error, `Failed to delete key '${setting.key}' with label '${getLabel(setting)}'.`));
        }
    }

    return errorMessages;
}

function getLabel(setting: ConfigurationSettingId): string {
    return setting.label || "";
}
