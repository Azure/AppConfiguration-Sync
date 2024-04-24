import * as configfile from '../src/configfile'

import { ArgumentError, ParseError } from '../src/errors';

jest.mock('@actions/core');

describe('loadConfigFiles', () => {

    it('throw when no config files are found', async () => {
        const promise = configfile.loadConfigFiles(__dirname, "missing.json", configfile.ConfigFormat.JSON, "."); 

        await (expect(promise)).rejects.toThrow(ArgumentError);
    })

    it('throw when config format is invalid', async () => {
        const promise = configfile.loadConfigFiles(__dirname, "appsettings.json", -1 as configfile.ConfigFormat, ".");

        await (expect(promise)).rejects.toThrow(ParseError);
    })

    it('loads JSON with separator .', async () => {
        const config = await configfile.loadConfigFiles(__dirname, "appsettings.json", configfile.ConfigFormat.JSON, ".");

        expect(config).toEqual({
            "Key1": "Value 1",
            "Outer.Key2": "Value 2",
            "Outer.Inner.Key3": "Value 3",
            "Outer.Inner.Key4": "Value 4"
        });
    })

    it('loads JSON with separator -', async () => {
        const config = await configfile.loadConfigFiles(__dirname, "appsettings.json", configfile.ConfigFormat.JSON, "-");

        expect(config).toEqual({
            "Key1": "Value 1",
            "Outer-Key2": "Value 2",
            "Outer-Inner-Key3": "Value 3",
            "Outer-Inner-Key4": "Value 4"
        });
    })

    it('throw when JSON is invalid', async () => {
        const promise = configfile.loadConfigFiles(__dirname, "invalid.json", configfile.ConfigFormat.JSON, ".");

        await (expect(promise)).rejects.toThrow(ParseError);
    })

    it('loads YAML', async () => {
        const config = await configfile.loadConfigFiles(__dirname, "config.yaml", configfile.ConfigFormat.YAML, ":");

        expect(config).toEqual({
            "Array:0:A": "1",
            "Array:0:B": "2",
            "Array:1:C": "3",
            "Array:1:D": "4",
            "Key1": "Value 1",
            "Outer:Key2": "Value 2",
            "Outer:Inner:Key3": "Value 3",
            "Outer:Inner:Key4": "Value 4"
        });
    })

    it('throw when YAML is invalid', async () => {
        const promise = configfile.loadConfigFiles(__dirname, "invalid.yaml", configfile.ConfigFormat.YAML, ".");

        await (expect(promise)).rejects.toThrow(ParseError);
    })

    it('loads .properties', async () => {
        const config = await configfile.loadConfigFiles(__dirname, "config.properties", configfile.ConfigFormat.Properties, ".");

        expect(config).toEqual({
            "Key1": "Value 1",
            "Key2": "Value 2",
            "A-B": "Value 3"
        });
    })

    it('loads multiple files', async () => {
        const config = await configfile.loadConfigFiles(__dirname, "{appsettings.json,appsettings2.json}", configfile.ConfigFormat.JSON, ".");

        expect(config).toEqual({
            "Key1": "New Value",
            "Outer.Key2": "Value 2",
            "Outer.Inner.Key3": "Value 3",
            "Outer.Inner.Key4": "Value 4",
            "Key1_2": "Value 1",
            "Outer_2.Key2_2": "Value 2",
            "Outer_2.Inner_2.Key3_2": "Value 3",
            "Outer_2.Inner_2.Key4_2": "Value 4"
        });
    })

    it('loads with a max depth', async () => {
        const config = await configfile.loadConfigFiles(__dirname, "appsettings.json", configfile.ConfigFormat.JSON, ".", 2);

        expect(config).toEqual({
            "Key1": "Value 1",
            "Outer.Key2": "Value 2",
            "Outer.Inner": {
                "Key3": "Value 3",
                "Key4": "Value 4"
            }
        });
    })
})
