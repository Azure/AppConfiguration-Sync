# Azure App Configuration Sync

This action syncs configuration files in the repository to an App Configuration instance. This enables scenarios where the App Configuration instance is automatically updated when changes are made through GitHub workflows.

JSON, YAML, and .properties files are supported. For the full list of action inputs, see [Inputs](./action.yml).

To start using this GitHub action, go to your repository and click the "Actions" tab. This GitHub action will be available from the marketplace under the name "Azure App Configuration Sync". See the usage section below for an example of how to set up the action yml file. For a more in-depth view of GitHub workflows and actions click [here](https://help.github.com/en/actions/automating-your-workflow-with-github-actions).

## Connection string

The connection string for the App Configuration instance should be stored as a [secret](https://help.github.com/en/articles/virtual-environments-for-github-actions#creating-and-using-secrets-encrypted-variables) in the GitHub repository.  The secret should be used in the workflow.

## Usage example

The following example updates the App Configuration instance each time a change is made to `appsettings.json` in the `master` branch.

```yaml
# File: .github/workflows/syncConfiguration.yml

on:
  push:
    branches:
      - 'master'
    paths:
      - 'appsettings.json'

jobs:
  syncconfig:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v1
      - uses: azure/appconfiguration-sync@v1
        with:
          configurationFile: 'appsettings.json'
          format: 'json'
          # Replace <ConnectionString> with the name of the secret in your repository
          connectionString: ${{ secrets.<ConnectionString> }}
          separator: ':'
          strict: false
```

## Building

First make sure that you have Node.js 12.x or higher. Then run `npm install` to install dependencies.

To build the project, run `npm run build`. The build output is placed at `lib\index.js` and should be included in your pull request.

Before submitting a pull request, ensure that lint and tests pass by running `npm run lint` and `npm run test`.

# Contributing

This project welcomes contributions and suggestions. Most contributions require you to agree to a
Contributor License Agreement (CLA) declaring that you have the right to, and actually do, grant us
the rights to use your contribution. For details, visit https://cla.opensource.microsoft.com.

When you submit a pull request, a CLA bot will automatically determine whether you need to provide
a CLA and decorate the PR appropriately (e.g., status check, comment). Simply follow the instructions
provided by the bot. You will only need to do this once across all repos using our CLA.

This project has adopted the [Microsoft Open Source Code of Conduct](https://opensource.microsoft.com/codeofconduct/).
For more information see the [Code of Conduct FAQ](https://opensource.microsoft.com/codeofconduct/faq/) or
contact [opencode@microsoft.com](mailto:opencode@microsoft.com) with any additional questions or comments.
