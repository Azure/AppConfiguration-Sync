import * as core from '@actions/core';
import { AppConfigurationClient, ConfigurationSetting, ListConfigurationSettingsOptions } from '@azure/app-configuration';
import { PageSettings } from '@azure/core-paging';
import { RestError } from '@azure/core-http';

import * as configstore from '../src/configstore';
import { ConnectionString } from '../src/input';

jest.mock('@actions/core');
jest.mock('@azure/app-configuration');

const connString : ConnectionString = { type: 'connection-string', connectionString: 'a connection string' };

describe('syncConfig', () => {
   
    beforeEach(() => {
        AppConfigurationClient.prototype.listConfigurationSettings = jest.fn();
        AppConfigurationClient.prototype.setConfigurationSetting = jest.fn();
        AppConfigurationClient.prototype.deleteConfigurationSetting = jest.fn();
    })

    it('adds setting', async () => {
        const config = { "Key1": "Value1" };
        await configstore.syncConfig(config, configstore.clientFromConnectionString(connString), false);

        expect(AppConfigurationClient).toBeCalled();
        expect(AppConfigurationClient.prototype.listConfigurationSettings).not.toBeCalled();
        expect(AppConfigurationClient.prototype.deleteConfigurationSetting).not.toBeCalled();
        expect(AppConfigurationClient.prototype.setConfigurationSetting).toHaveBeenCalledTimes(1);
        expect(AppConfigurationClient.prototype.setConfigurationSetting).toHaveBeenCalledWith({ key: "Key1", value: "Value1" });
        expect(core.setFailed).not.toBeCalled();
        expect(core.error).not.toBeCalled();
    })

    it('adds multiple settings', async () => {
        const config = {
            "Key1": "Value1",
            "Key2": "Value2",
        };

        await configstore.syncConfig(config, configstore.clientFromConnectionString(connString), false);

        expect(AppConfigurationClient).toBeCalled();
        expect(AppConfigurationClient.prototype.listConfigurationSettings).not.toBeCalled();
        expect(AppConfigurationClient.prototype.deleteConfigurationSetting).not.toBeCalled();
        expect(AppConfigurationClient.prototype.setConfigurationSetting).toHaveBeenCalledTimes(2);
        expect(AppConfigurationClient.prototype.setConfigurationSetting).toHaveBeenNthCalledWith(1, { key: "Key1", value: "Value1" });
        expect(AppConfigurationClient.prototype.setConfigurationSetting).toHaveBeenNthCalledWith(2, { key: "Key2", value: "Value2" });
        expect(core.setFailed).not.toBeCalled();
        expect(core.error).not.toBeCalled();
    })

    it('adds setting while leaving existing setting alone', async () => {
        setListConfigurationSettingsMock({ key: "Key2", value: "Value2", isReadOnly: false });

        const config = { "Key1": "Value1" };
        await configstore.syncConfig(config, configstore.clientFromConnectionString(connString), false);

        expect(AppConfigurationClient).toBeCalled();
        expect(AppConfigurationClient.prototype.listConfigurationSettings).not.toBeCalled();
        expect(AppConfigurationClient.prototype.deleteConfigurationSetting).not.toBeCalled();
        expect(AppConfigurationClient.prototype.setConfigurationSetting).toHaveBeenCalledTimes(1);
        expect(AppConfigurationClient.prototype.setConfigurationSetting).toHaveBeenCalledWith({ key: "Key1", value: "Value1" });
        expect(core.setFailed).not.toBeCalled();
        expect(core.error).not.toBeCalled();
    })

    it('changes setting', async () => {
        const setting1 = { key: "Key1", value: "Value1", isReadOnly: false };
        const setting2 = { key: "Key2", value: "Value2", isReadOnly: false };
        setListConfigurationSettingsMock(setting1, setting2);

        const config = { "Key1": "New Value" };
        await configstore.syncConfig(config, configstore.clientFromConnectionString(connString), false);

        expect(AppConfigurationClient).toBeCalled();
        expect(AppConfigurationClient.prototype.listConfigurationSettings).not.toBeCalled();
        expect(AppConfigurationClient.prototype.deleteConfigurationSetting).not.toBeCalled();
        expect(AppConfigurationClient.prototype.setConfigurationSetting).toHaveBeenCalledTimes(1);
        expect(AppConfigurationClient.prototype.setConfigurationSetting).toHaveBeenCalledWith({ key: "Key1", value: "New Value" });
        expect(core.setFailed).not.toBeCalled();
        expect(core.error).not.toBeCalled();
    })

    it('adds setting in strict mode', async () => {
        const setting = { key: "DeletedKey", value: "DeletedValue", isReadOnly: false };
        setListConfigurationSettingsMock(setting);

        const config = { "Key1": "Value1" };
        await configstore.syncConfig(config, configstore.clientFromConnectionString(connString), true);

        expect(AppConfigurationClient).toBeCalled();
        expect(AppConfigurationClient.prototype.listConfigurationSettings).toHaveBeenCalledTimes(1);
        expect(AppConfigurationClient.prototype.listConfigurationSettings).toHaveBeenCalledWith({ labelFilter: "\0" });
        expect(AppConfigurationClient.prototype.deleteConfigurationSetting).toHaveBeenCalledTimes(1);
        expect(AppConfigurationClient.prototype.deleteConfigurationSetting).toHaveBeenCalledWith(setting);
        expect(AppConfigurationClient.prototype.setConfigurationSetting).toHaveBeenCalledTimes(1);
        expect(AppConfigurationClient.prototype.setConfigurationSetting).toHaveBeenCalledWith({ key: "Key1", value: "Value1" });
        expect(core.setFailed).not.toBeCalled();
        expect(core.error).not.toBeCalled();
    })

    it('changes setting in strict mode', async () => {
        const setting1 = { key: "DeletedKey", value: "DeletedValue", isReadOnly: false };
        const setting2 = { key: "Key1", value: "Value1", isReadOnly: false };
        setListConfigurationSettingsMock(setting1, setting2);

        const config = { "Key1": "New Value" };
        await configstore.syncConfig(config, configstore.clientFromConnectionString(connString), true);

        expect(AppConfigurationClient).toBeCalled();
        expect(AppConfigurationClient.prototype.listConfigurationSettings).toHaveBeenCalledTimes(1);
        expect(AppConfigurationClient.prototype.listConfigurationSettings).toHaveBeenCalledWith({ labelFilter: "\0" });
        expect(AppConfigurationClient.prototype.deleteConfigurationSetting).toHaveBeenCalledTimes(1);
        expect(AppConfigurationClient.prototype.deleteConfigurationSetting).toHaveBeenCalledWith(setting1);
        expect(AppConfigurationClient.prototype.setConfigurationSetting).toHaveBeenCalledTimes(1);
        expect(AppConfigurationClient.prototype.setConfigurationSetting).toHaveBeenCalledWith({ key: "Key1", value: "New Value" });
        expect(core.setFailed).not.toBeCalled();
        expect(core.error).not.toBeCalled();
    })

    it('adds setting with label', async () => {
        const setting1 = { key: "Key1", value: "Value1", isReadOnly: false };
        const setting2 = { key: "Key1", value: "Value2", label: "Label1", isReadOnly: false };
        const setting3 = { key: "Key2", value: "Value3", label: "Label2", isReadOnly: false };
        setListConfigurationSettingsMock(setting1, setting2, setting3);

        let config = { "Key1": "New Value" };
        await configstore.syncConfig(config, configstore.clientFromConnectionString(connString), false, "Label2");

        expect(AppConfigurationClient).toBeCalled();
        expect(AppConfigurationClient.prototype.listConfigurationSettings).not.toBeCalled();
        expect(AppConfigurationClient.prototype.deleteConfigurationSetting).not.toBeCalled();
        expect(AppConfigurationClient.prototype.setConfigurationSetting).toHaveBeenCalledTimes(1);
        expect(AppConfigurationClient.prototype.setConfigurationSetting).toHaveBeenCalledWith({ key: "Key1", value: "New Value", label: "Label2" });
        expect(core.setFailed).not.toBeCalled();
        expect(core.error).not.toBeCalled();
    })

    it('changes setting with label in strict mode', async () => {
        const setting1 = { key: "Key1", value: "Value1", isReadOnly: false };
        const setting2 = { key: "Key1", value: "Value2", label: "Label1", isReadOnly: false };
        const setting3 = { key: "Key1", value: "Value3", label: "Label2", isReadOnly: false };
        const setting4 = { key: "Key2", value: "Value4", label: "Label2", isReadOnly: false };
        setListConfigurationSettingsMock(setting1, setting2, setting3, setting4);

        let config = { "Key1": "New Value" };
        await configstore.syncConfig(config, configstore.clientFromConnectionString(connString), true, "Label2");

        expect(AppConfigurationClient).toBeCalled();
        expect(AppConfigurationClient.prototype.listConfigurationSettings).toHaveBeenCalledTimes(1);
        expect(AppConfigurationClient.prototype.listConfigurationSettings).toHaveBeenCalledWith({ labelFilter: "Label2" });
        expect(AppConfigurationClient.prototype.deleteConfigurationSetting).toHaveBeenCalledTimes(1);
        expect(AppConfigurationClient.prototype.deleteConfigurationSetting).toHaveBeenCalledWith(setting4);
        expect(AppConfigurationClient.prototype.setConfigurationSetting).toHaveBeenCalledTimes(1);
        expect(AppConfigurationClient.prototype.setConfigurationSetting).toHaveBeenCalledWith({ key: "Key1", value: "New Value", label: "Label2" });
        expect(core.setFailed).not.toBeCalled();
        expect(core.error).not.toBeCalled();
    })

    it('adds setting with prefix', async () => {
        const setting1 = { key: "Key1", value: "Value1", isReadOnly: false };
        const setting2 = { key: "prefix::Key2", value: "Value2", isReadOnly: false };
        setListConfigurationSettingsMock(setting1, setting2);

        let config = { "Key1": "New Value" };
        await configstore.syncConfig(config, configstore.clientFromConnectionString(connString), false, undefined, "prefix::");

        expect(AppConfigurationClient).toBeCalled();
        expect(AppConfigurationClient.prototype.listConfigurationSettings).not.toBeCalled();
        expect(AppConfigurationClient.prototype.deleteConfigurationSetting).not.toBeCalled();
        expect(AppConfigurationClient.prototype.setConfigurationSetting).toHaveBeenCalledTimes(1);
        expect(AppConfigurationClient.prototype.setConfigurationSetting).toHaveBeenCalledWith({ key: "prefix::Key1", value: "New Value" });
        expect(core.setFailed).not.toBeCalled();
        expect(core.error).not.toBeCalled();
    })

    it('adds setting with prefix in strict mode', async () => {
        const setting = { key: "prefix::Key2", value: "Value2", isReadOnly: false };
        setListConfigurationSettingsMock(setting);

        let config = { "Key1": "New Value" };
        await configstore.syncConfig(config, configstore.clientFromConnectionString(connString), true, undefined, "prefix::");

        expect(AppConfigurationClient).toBeCalled();
        expect(AppConfigurationClient.prototype.listConfigurationSettings).toHaveBeenCalledTimes(1);
        expect(AppConfigurationClient.prototype.listConfigurationSettings).toHaveBeenCalledWith({ keyFilter: "prefix::*", labelFilter: "\0" });
        expect(AppConfigurationClient.prototype.deleteConfigurationSetting).toHaveBeenCalledTimes(1);
        expect(AppConfigurationClient.prototype.deleteConfigurationSetting).toHaveBeenCalledWith(setting);
        expect(AppConfigurationClient.prototype.setConfigurationSetting).toHaveBeenCalledTimes(1);
        expect(AppConfigurationClient.prototype.setConfigurationSetting).toHaveBeenCalledWith({ key: "prefix::Key1", value: "New Value" });
        expect(core.setFailed).not.toBeCalled();
        expect(core.error).not.toBeCalled();
    })

    it('changes setting with prefix and label', async () => {
        const setting1 = { key: "prefix::Key1", value: "Value1", isReadOnly: false };
        const setting2 = { key: "prefix::Key1", value: "Value2", label: "Label", isReadOnly: false };
        const setting3 = { key: "prefix::Key2", value: "Value3", isReadOnly: false };
        const setting4 = { key: "prefix::Key2", value: "Value4", label: "Label", isReadOnly: false };
        setListConfigurationSettingsMock(setting1, setting2, setting3, setting4);

        let config = { "Key1": "New Value" };
        await configstore.syncConfig(config, configstore.clientFromConnectionString(connString), false, "Label", "prefix::");

        expect(AppConfigurationClient).toBeCalled();
        expect(AppConfigurationClient.prototype.listConfigurationSettings).not.toBeCalled();
        expect(AppConfigurationClient.prototype.deleteConfigurationSetting).not.toBeCalled();
        expect(AppConfigurationClient.prototype.setConfigurationSetting).toHaveBeenCalledTimes(1);
        expect(AppConfigurationClient.prototype.setConfigurationSetting).toHaveBeenCalledWith({ key: "prefix::Key1", value: "New Value", label: "Label" });
        expect(core.setFailed).not.toBeCalled();
        expect(core.error).not.toBeCalled();
    })

    it('changes setting with prefix and label in strict mode', async () => {
        const setting1 = { key: "prefix::Key1", value: "Value1", label: "Label", isReadOnly: false };
        const setting2 = { key: "prefix::Key2", value: "Value2", label: "Label", isReadOnly: false }
        setListConfigurationSettingsMock(setting1, setting2);

        let config = { "Key1": "New Value" };
        await configstore.syncConfig(config, configstore.clientFromConnectionString(connString), true, "Label", "prefix::");

        expect(AppConfigurationClient).toBeCalled();
        expect(AppConfigurationClient.prototype.listConfigurationSettings).toHaveBeenCalledTimes(1);
        expect(AppConfigurationClient.prototype.listConfigurationSettings).toHaveBeenCalledWith({ keyFilter: "prefix::*", labelFilter: "Label" });
        expect(AppConfigurationClient.prototype.deleteConfigurationSetting).toHaveBeenCalledTimes(1);
        expect(AppConfigurationClient.prototype.deleteConfigurationSetting).toHaveBeenCalledWith(setting2);
        expect(AppConfigurationClient.prototype.setConfigurationSetting).toHaveBeenCalledTimes(1);
        expect(AppConfigurationClient.prototype.setConfigurationSetting).toHaveBeenCalledWith({ key: "prefix::Key1", value: "New Value", label: "Label" });
        expect(core.setFailed).not.toBeCalled();
        expect(core.error).not.toBeCalled();
    })

    it('adds setting with tags', async () => {
        let config = { "Key1": "New Value" };
        await configstore.syncConfig(config, configstore.clientFromConnectionString(connString), false, undefined, undefined, { foo: "bar" });

        expect(AppConfigurationClient).toBeCalled();
        expect(AppConfigurationClient.prototype.listConfigurationSettings).not.toBeCalled();
        expect(AppConfigurationClient.prototype.deleteConfigurationSetting).not.toBeCalled();
        expect(AppConfigurationClient.prototype.setConfigurationSetting).toHaveBeenCalledTimes(1);
        expect(AppConfigurationClient.prototype.setConfigurationSetting).toHaveBeenCalledWith({ key: "Key1", value: "New Value", tags: { foo: "bar" } });
        expect(core.setFailed).not.toBeCalled();
        expect(core.error).not.toBeCalled();
    })

    it('change setting with tags', async () => {
        setListConfigurationSettingsMock({ key: "Key1", value: "Value1", isReadOnly: false });

        let config = { "Key1": "New Value" };
        await configstore.syncConfig(config, configstore.clientFromConnectionString(connString), false, undefined, undefined, { foo: "bar" });

        expect(AppConfigurationClient).toBeCalled();
        expect(AppConfigurationClient.prototype.listConfigurationSettings).not.toBeCalled();
        expect(AppConfigurationClient.prototype.deleteConfigurationSetting).not.toBeCalled();
        expect(AppConfigurationClient.prototype.setConfigurationSetting).toHaveBeenCalledTimes(1);
        expect(AppConfigurationClient.prototype.setConfigurationSetting).toHaveBeenCalledWith({ key: "Key1", value: "New Value", tags: { foo: "bar" } });
        expect(core.setFailed).not.toBeCalled();
        expect(core.error).not.toBeCalled();
    })

    it('fails to adds setting', async () => {
        AppConfigurationClient.prototype.setConfigurationSetting = jest.fn(() => {
            throw new RestError("<message>", undefined, 401);
        });
        
        const config = { "Key1": "Value1", "Key2": "Value2" };
        await configstore.syncConfig(config, configstore.clientFromConnectionString(connString), false);

        expect(AppConfigurationClient).toBeCalled();
        expect(AppConfigurationClient.prototype.listConfigurationSettings).not.toBeCalled();
        expect(AppConfigurationClient.prototype.deleteConfigurationSetting).not.toBeCalled();
        expect(AppConfigurationClient.prototype.setConfigurationSetting).toHaveBeenCalledTimes(2);
        expect(AppConfigurationClient.prototype.setConfigurationSetting).toHaveBeenNthCalledWith(1, { key: "Key1", value: "Value1" });
        expect(AppConfigurationClient.prototype.setConfigurationSetting).toHaveBeenNthCalledWith(2, { key: "Key2", value: "Value2" });
        expect(core.setFailed).toBeCalledWith("Configuration sync failed.");
        expect(core.error).toHaveBeenCalledTimes(2);
        expect(core.error).toHaveBeenNthCalledWith(1, "Failed to add key 'Key1' with label ''. Status code: 401 Unauthorized");
        expect(core.error).toHaveBeenNthCalledWith(2, "Failed to add key 'Key2' with label ''. Status code: 401 Unauthorized");
    })

    it('fails to delete setting in strict mode', async () => {
        AppConfigurationClient.prototype.deleteConfigurationSetting = jest.fn(() => {
            throw new RestError("<message>", undefined, 409);
        });

        AppConfigurationClient.prototype.setConfigurationSetting = jest.fn(() => {
            throw new RestError("<message>", undefined, 409);
        });

        const setting = { key: "DeletedKey", value: "DeletedValue", label: "test", isReadOnly: false};
        setListConfigurationSettingsMock(setting);

        const config = { "Key1": "Value1" };
        await configstore.syncConfig(config, configstore.clientFromConnectionString(connString), true, "test");

        expect(AppConfigurationClient).toBeCalled();
        expect(AppConfigurationClient.prototype.listConfigurationSettings).toHaveBeenCalledTimes(1);
        expect(AppConfigurationClient.prototype.listConfigurationSettings).toHaveBeenCalledWith({ labelFilter: "test" });
        expect(AppConfigurationClient.prototype.deleteConfigurationSetting).toHaveBeenCalledTimes(1);
        expect(AppConfigurationClient.prototype.deleteConfigurationSetting).toHaveBeenCalledWith(setting);
        expect(AppConfigurationClient.prototype.setConfigurationSetting).toHaveBeenCalledTimes(1);
        expect(AppConfigurationClient.prototype.setConfigurationSetting).toHaveBeenCalledWith({ key: "Key1", value: "Value1", label: "test" });
        expect(core.setFailed).toBeCalledWith("Configuration sync failed.");
        expect(core.error).toHaveBeenCalledTimes(2);
        expect(core.error).toHaveBeenNthCalledWith(1, "Failed to delete key 'DeletedKey' with label 'test'. Status code: 409 Conflict");
        expect(core.error).toHaveBeenNthCalledWith(2, "Failed to add key 'Key1' with label 'test'. Status code: 409 Conflict");
    })

    it('partially succeeded', async () => {
        AppConfigurationClient.prototype.setConfigurationSetting = jest.fn(() => {
            throw new RestError("<message>", undefined, 409);
        });

        const setting = { key: "DeletedKey", value: "DeletedValue", isReadOnly: false };
        setListConfigurationSettingsMock(setting);

        const config = { "Key1": "Value1" };
        await configstore.syncConfig(config, configstore.clientFromConnectionString(connString), true);

        expect(AppConfigurationClient).toBeCalled();
        expect(AppConfigurationClient.prototype.listConfigurationSettings).toHaveBeenCalledTimes(1);
        expect(AppConfigurationClient.prototype.listConfigurationSettings).toHaveBeenCalledWith({ labelFilter: "\0" });
        expect(AppConfigurationClient.prototype.deleteConfigurationSetting).toHaveBeenCalledTimes(1);
        expect(AppConfigurationClient.prototype.deleteConfigurationSetting).toHaveBeenCalledWith(setting);
        expect(AppConfigurationClient.prototype.setConfigurationSetting).toHaveBeenCalledTimes(1);
        expect(AppConfigurationClient.prototype.setConfigurationSetting).toHaveBeenCalledWith({ key: "Key1", value: "Value1" });
        expect(core.setFailed).toBeCalledWith("Configuration sync partially succeeded.");
        expect(core.error).toHaveBeenCalledTimes(1);
        expect(core.error).toHaveBeenNthCalledWith(1, "Failed to add key 'Key1' with label ''. Status code: 409 Conflict");
    })

    it('adds settings with different value types ', async () => {
        let config = {
            "String": "Value",
            "Number1": 0,
            "Number2": 7,
            "Boolean1": true,
            "Boolean2": false,
            "Array": [1, 2, 3],
            "Object": { "Foo": "Bar" },
            "Null": null,
            "Undefined": undefined,
        };
        await configstore.syncConfig(config, configstore.clientFromConnectionString(connString), false);

        expect(AppConfigurationClient).toBeCalled();
        expect(AppConfigurationClient.prototype.listConfigurationSettings).not.toBeCalled();
        expect(AppConfigurationClient.prototype.deleteConfigurationSetting).not.toBeCalled();
        expect(AppConfigurationClient.prototype.setConfigurationSetting).toHaveBeenCalledTimes(9);
        expect(AppConfigurationClient.prototype.setConfigurationSetting).toHaveBeenNthCalledWith(1, { key: "String", value: "Value" });
        expect(AppConfigurationClient.prototype.setConfigurationSetting).toHaveBeenNthCalledWith(2, { key: "Number1", value: "0" });
        expect(AppConfigurationClient.prototype.setConfigurationSetting).toHaveBeenNthCalledWith(3, { key: "Number2", value: "7" });
        expect(AppConfigurationClient.prototype.setConfigurationSetting).toHaveBeenNthCalledWith(4, { key: "Boolean1", value: "true" });
        expect(AppConfigurationClient.prototype.setConfigurationSetting).toHaveBeenNthCalledWith(5, { key: "Boolean2", value: "false" });
        expect(AppConfigurationClient.prototype.setConfigurationSetting).toHaveBeenNthCalledWith(6, { key: "Array", value: "[1,2,3]" });
        expect(AppConfigurationClient.prototype.setConfigurationSetting).toHaveBeenNthCalledWith(7, { key: "Object", value: "{\"Foo\":\"Bar\"}" });
        expect(AppConfigurationClient.prototype.setConfigurationSetting).toHaveBeenNthCalledWith(8, { key: "Null", value: "" });
        expect(AppConfigurationClient.prototype.setConfigurationSetting).toHaveBeenNthCalledWith(9, { key: "Undefined", value: "" });
        expect(core.setFailed).not.toBeCalled();
        expect(core.error).not.toBeCalled();
    })

    it('adds setting with content type', async () => {
        const config = { "Key1": "Value1" };
        await configstore.syncConfig(config, configstore.clientFromConnectionString(connString), false, undefined, undefined, undefined, "contentType");

        expect(AppConfigurationClient).toBeCalled();
        expect(AppConfigurationClient.prototype.listConfigurationSettings).not.toBeCalled();
        expect(AppConfigurationClient.prototype.deleteConfigurationSetting).not.toBeCalled();
        expect(AppConfigurationClient.prototype.setConfigurationSetting).toHaveBeenCalledTimes(1);
        expect(AppConfigurationClient.prototype.setConfigurationSetting).toHaveBeenCalledWith({ key: "Key1", value: "Value1", contentType: "contentType" });
        expect(core.setFailed).not.toBeCalled();
        expect(core.error).not.toBeCalled();
    })

    function setListConfigurationSettingsMock(...configurationSettings: ConfigurationSetting[]) {
        AppConfigurationClient.prototype.listConfigurationSettings = jest.fn((options?: ListConfigurationSettingsOptions) => {
            const iter = getConfigurationSettingIterator(configurationSettings);
            return {
                next() {
                    return iter.next();
                },
                [Symbol.asyncIterator]() {
                    return this;
                },
                byPage: (_: PageSettings = {}) => {
                    return getPageIterator();
                }
            };
        });
    }

    async function *getConfigurationSettingIterator(configurationSettings: ConfigurationSetting[]): AsyncIterableIterator<ConfigurationSetting> {
        for (const configurationSetting of configurationSettings) {
            yield configurationSetting;
        }
    }

    async function *getPageIterator() {
        throw new Error("Unexpected call to getPageIterator");
    }
})
