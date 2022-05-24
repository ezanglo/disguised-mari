const { token } = require('./config.json');

module.exports = {
    app: {
        px: '!',
        gc: '?',
        token: token,
        playing: 'with your feelings'
    },

    opt: {
        DJ: {
            enabled: true,
            roleName: 'DJ',
            commands: ['back', 'clear', 'filter', 'loop', 'pause', 'resume', 'seek', 'shuffle', 'purge', 'volume']
        },
        maxVol: 100,
        loopMessage: false,
        discordPlayer: {
            ytdlOptions: {
                quality: 'highestaudio',
                highWaterMark: 1 << 25
            }
        }
    }
};