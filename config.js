module.exports = {
    app: {
        px: '!',
        gc: process.env.ENVIRONMENT == 'dev' ? '??' : '?',
        token: process.env.BOT_TOKEN,
        playing: 'https://disguised-mari.web.app/',
        debug_mode: true,
        error_log_channel: '979175534363832340',
        interaction_timeout: 15000,
        maintenance: false
    },

    opt: {
    }
};