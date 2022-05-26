const { token } = require('./config.json');

module.exports = {
    app: {
        px: '!',
        gc: '?',
        token: token,
        playing: 'with your feelings',
        debug_mode: true,
        error_log_channel: '979175534363832340'
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