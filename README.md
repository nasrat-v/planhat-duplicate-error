# planhat-duplicate-error

Reproduce the error 'externalId,email duplicated' on Planhat sandbox

# Init

Create a `.env` file at the root of the repository.
In this file add your Planhat API Token like this:

```SH
PLANHAT_API_KEY="my_token"
```

# Install

Use correct node version:

`nvm use`

Install node_modules:

`npm install`

# Start

`npm start`

# Build

`npm run build`

# VSCode

You need to install the extension [ESLint](https://open-vsx.org/vscode/item?itemName=dbaeumer.vscode-eslint) and [Prettier](https://open-vsx.org/vscode/item?itemName=esbenp.prettier-vscode) on your VSCode if you want the linter and formatter to work.
