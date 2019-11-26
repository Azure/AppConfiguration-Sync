import * as core from '@actions/core';
import { AppConfigurationClient, ConfigurationSettingId, SetConfigurationSettingParam } from '@azure/app-configuration';

import { Tags } from './input';
import { logError, getErrorMessage } from './util';

/**
 * Sync from a config object to a config store
 * 
 * @param config Config object to sync.
 * @param connectionString Connection string for the config store that the sync targets.
 * @param strict Whether to make the config store exactly match the config object (for a prefix/label).
 * @param label Label assigned to the modified settings.
 * @param prefix Prefix appended to the front of the setting key.
 * @param tags Tags applied to the modified settings.
 */
export async function syncConfig(config: any, connectionString: string, strict: boolean, label?: string, prefix?: string, tags?: Tags): Promise<void> {
    const client = new AppConfigurationClient(connectionString);

    const settingsToAdd = getSettingsToAdd(config, label, prefix, tags);
    const settingsToDelete = strict ? await getSettingsToDelete(client, settingsToAdd, label, prefix) : [];

    const failedDeletes = await deleteSettings(client, settingsToDelete);
    const failedAdds = await addSettings(client, settingsToAdd);

    // If there was a failure, output a summary of what failed
    if (failedDeletes.length > 0 || failedAdds.length > 0) {

        const errorMessage = (failedDeletes.length === settingsToDelete.length && failedAdds.length === settingsToAdd.length) ?
            "Sync config failed." :
            "Sync config partially succeeded.";

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

function getSettingsToAdd(config: any, label?: string, prefix?: string, tags?: Tags): SetConfigurationSettingParam[] {
    const settings: SetConfigurationSettingParam[] = [];

    for (const key in config) {      
        settings.push({
            key: prefix ? prefix + key : key,
            value: config[key],
            label: label ? label : undefined,
            tags: tags ? tags : undefined,
        });
    }

    return settings;
}

async function getSettingsToDelete(client: AppConfigurationClient, settingsToAdd: SetConfigurationSettingParam[], label?: string, prefix?: string): Promise<ConfigurationSettingId[]> {
    const settings: ConfigurationSettingId[] = [];
    const keysToIgnore = new Set(settingsToAdd.map(e => e.key));
    
    const filterOptions = {
        keys: prefix ? [prefix + "*"] : undefined,
        labels: label ? [label] : undefined,
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
            console.log(`Adding key '${setting.key}' with label '${getLabel(setting)}'.`);
            await client.setConfigurationSetting(setting);
        } catch (error) {
             errorMessages.push(processError(error, `Failed to add key '${setting.key}' with label '${getLabel(setting)}'.`));
        }
    }

    return errorMessages;
}

async function deleteSettings(client: AppConfigurationClient, settings: ConfigurationSettingId[]): Promise<string[]> {
    const errorMessages: string[] = [];

    for (const setting of settings) {
        try {
            console.log(`Deleting key '${setting.key}' with label '${getLabel(setting)}'.`);
            await client.deleteConfigurationSetting(setting);
        } catch (error) {          
            errorMessages.push(processError(error, `Failed to delete key '${setting.key}' with label '${getLabel(setting)}'.`));
        }
    }

    return errorMessages;
}

function processError(error: any, description: string): string {
    const errorMessage = getErrorMessage(error, description);
    console.log(errorMessage);
    logError(error);

    return errorMessage;
}

function getLabel(setting: ConfigurationSettingId): string {
    return setting.label || "(No label)";
}
