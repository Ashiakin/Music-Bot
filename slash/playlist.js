const { SlashCommandBuilder } = require("@discordjs/builders");
const { useMainPlayer } = require("discord-player");
const { EmbedBuilder } = require("discord.js");
const { QueryType } = require('discord-player');
const Language = require("../strings.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName(Language.playlist.command)
        .setDescription(Language.playlist.description)
        .addStringOption((option) => option.setName(Language.playlist.name).setDescription(Language.playlist.option).setRequired(true)),

    run: async ({ interaction, client }) => {
        const player = useMainPlayer();
        const channel = interaction.member.voice.channel;
        if (!channel) return interaction.editReply(Language.playlist.nochannel);

        const queue = player.nodes.create(interaction.guild);
        if (!queue.connection) await queue.connect(channel);

        let embed = new EmbedBuilder();

        // Get the value of the playlist URL option from the interaction options
        let music = interaction.options.getString(Language.playlist.name, true);
        const result = await player.search(music, {
            requestedBy: interaction.user,
            searchEngine: QueryType.YOUTUBE_PLAYLIST,
        });

        const playlist = result.playlist;


        if (!result.hasTracks() && (!result.playlist || !result.playlist.tracks.length)) {
            return interaction.editReply(Language.playlist.noresult);
        } else {
            try {
                const tracks = result.tracks.length ? result.tracks : result.playlist.tracks;
                await player.play(channel, tracks, {
                    nodeOptions: {
                        metadata: interaction,
                    }
                });
                await interaction.editReply(Language.playlist.loading);
                embed
                    .setDescription(
                        `**[${tracks[0].title}](${tracks[0].url})**` +
                        Language.playlist.playlistadded +
                        `\n\n\n` +
                        Language.song.requestedby +
                        `<@${tracks[0].requestedBy.id}>`
                    )
                    .setThumbnail(tracks[0].thumbnail)
                    .setFooter({ text: Language.song.duration + `${tracks[0].duration}` });
                await interaction.editReply({
                    embeds: [embed],
                });
                await queue.addTrack(tracks);
            } catch (e) {
                return interaction.editReply(Language.system.error + e);
            }
        }
    }
}
