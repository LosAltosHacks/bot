const { REST, Routes } = require('discord.js');
require('dotenv').config();

const rest = new REST({ version: '10' }).setToken(process.env.token);

rest.get(Routes.applicationCommands(process.env.clientId)).then((data) => {
  for (const command of data) {
    const deleteURL = `${Routes.applicationCommands(process.env.clientId)}/${
      command.id
    }`;
    rest.delete(deleteURL);
  }
});
