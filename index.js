require('dotenv').config();

const fs = require('node:fs');
const {
  Client,
  Collection,
  GatewayIntentBits,
  Events,
  TextInputBuilder,
  TextInputStyle,
  ModalBuilder,
  ActionRowBuilder,
} = require('discord.js');
const Sentry = require('@sentry/node');
// const axios = require('axios');
// const { URLSearchParams } = require('url');

const { generateWarningEmbed, generateEmbed } = require('./tools.js');
const axios = require('axios');

Sentry.init({
  dsn: process.env.sentryDSN,

  // Set tracesSampleRate to 1.0 to capture 100%
  // of transactions for performance monitoring.
  // We recommend adjusting this value in production
  tracesSampleRate: 1.0,
});

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// Registering commands
client.commands = new Collection();
const commandFiles = fs
  .readdirSync('./commands')
  .filter((file) => file.endsWith('.js'));

for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  // Set a new item in the Collection
  // With the key as the command name and the value as the exported module
  client.commands.set(command.data.name, command);
}

// Get Client Credentials/Bearer Token to register bot command permissions
// Add this line to config.json "clientSecret": "fGiqfbyrEr2LscUCtD0U2o6RUgxfwPnH",
// const options = {
//   method: 'POST',
//   url: 'https://discord.com/api/v10/oauth2/token',
//   headers: {
//     'Content-Type': 'application/x-www-form-urlencoded',
//   },
//   data: new URLSearchParams({
//     grant_type: 'client_credentials',
//     scope: 'identify connections',
//   }),
//   auth: {
//     username: clientId,
//     password: clientSecret,
//   },
// };

// const bearerToken = axios(options)
//   .then(function (response) {
//     return response.access_token;
//   })
//   .catch(function (error) {
//     // handle error
//     console.log(error);
//     throw new Error(error);
//   });

// Ready-check
client.once('ready', async () => {
  console.log('Ready!');

  // const guild = client.guilds.cache.get(guildId);
  // await guild.commands.fetch().then((commands) =>
  //   commands.each((command) => {
  //     const prohibitedRoles = client.commands.get(command.name).prohibitedRoles;
  //     const permittedRoles = client.commands.get(command.name).permittedRoles;
  //     if (!prohibitedRoles && !permittedRoles) return;

  //     const prohibitedPermissions = prohibitedRoles
  //       ? prohibitedRoles.map((roleId) => {
  //           return {
  //             id: roleId,
  //             type: 'ROLE',
  //             permission: false,
  //           };
  //         })
  //       : [];
  //     const permittedPermissions = permittedRoles
  //       ? permittedRoles.map((roleId) => {
  //           return {
  //             id: roleId,
  //             type: 'ROLE',
  //             permission: true,
  //           };
  //         })
  //       : [];
  //     client.application.commands.permissions.set({
  //       token: bearerToken,
  //       guild: guildId,
  //       command: command.id,
  //       permissions: [...prohibitedPermissions, ...permittedPermissions],
  //     });
  //   }),
  // );
});

// Slash command handling
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isCommand()) return;

  const command = client.commands.get(interaction.commandName);

  if (!command) return;

  try {
    await command.execute(client, interaction);
  } catch (error) {
    console.error(error);
    await interaction.reply({
      content: 'There was an error while executing this command!',
      ephemeral: true,
    });
  }
});

// Verify handling
async function verify(email, discordId) {
  try {
    const requestConfig = {
      method: 'GET',
      url:
        'https://api.losaltoshacks.com/verify/discord?email=' +
        encodeURIComponent(email) +
        '&disc_username=' +
        encodeURIComponent(discordId),
      headers: {
        Authorization: 'Bearer ' + process.env.apiToken,
      },
    };
    const response = await axios(requestConfig);
    const fullName = response.data[0] + ' ' + response.data[1];
    return { status: true, response: fullName };
  } catch (error) {
    Sentry.captureException(error);
    return { status: false, response: error };
  }
}

const modal = new ModalBuilder()
  .setCustomId('verifyModal')
  .setTitle('Verify Email');

const emailInput = new TextInputBuilder()
  .setCustomId('emailInput')
  // The label is the prompt the user sees for this input
  .setLabel('Email')
  // Short means only a single line of text
  .setStyle(TextInputStyle.Short);

const firstActionRow = new ActionRowBuilder().addComponents(emailInput);

modal.addComponents(firstActionRow);

client.on(Events.InteractionCreate, async (i) => {
  if (!i.isButton()) return;
  if (i.customId !== 'verify') return;

  await i.showModal(modal);
});
client.on(Events.InteractionCreate, async (i) => {
  if (!i.isModalSubmit()) return;
  if (i.customId === 'verifyModal') {
    const email = i.fields.getTextInputValue('emailInput');
    const discordId = i.user.id;

    const verificationStatus = await verify(email, discordId);

    if (verificationStatus.status) {
      await i.member.roles
        .add(process.env.attendeeRole)
        .catch(function (error) {
          Sentry.captureException(error);
          // This is very likely because you have tried running the command as a role higher than the bot!!!
        });
      await i.member
        .setNickname(verificationStatus.response)
        .catch(function (error) {
          Sentry.captureException(error);
          // This is very likely because you have tried running the command as a role higher than the bot!!!
        });
      await i.reply({
        embeds: [
          generateEmbed(
            'Verified!',
            "You are now verified! You'll gain access to the rest of the server soon.",
          ),
        ],
        ephemeral: true,
      });
    } else {
      await i.reply({
        embeds: [
          generateWarningEmbed(
            'Error!',
            `\`${verificationStatus.response.code}: ${verificationStatus.response.response.data.detail}\`. If you think this is a mistake, contact staff with \`/staff\`, or reach out to a team member in a black LAH sweatshirt.`,
          ),
        ],
        ephemeral: true,
      });
    }
  }
});

client.login(process.env.token);
