# Los Altos Hacks Discord Bot

### Features

- Get staff assistance
- Answer frequently answered questions
- Verify attendee emails

### Changes

- Integrates new Discord slash commands, embeds, modeals, and buttons
- Upgrades from the depreciated [request](https://www.npmjs.com/package/request) module to [axios](https://github.com/axios/axios)

### Installation

First, clone this repository. Then create `.env` with the following contents:

```bash
token=
clientId=
guildId=
staffChannelId=
attendeeRole=
apiToken=
sentryDSN=
```

Next, install the dependencies:

```bash
npm install
```

Finally, start the Discord bot:

```bash
node index.js
```

or simply

```bash
node .
```
