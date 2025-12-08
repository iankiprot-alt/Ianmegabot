export default {
    // OPENAI API KEY
    OPENAI_API_KEY: process.env.OPENAI_API_KEY || "YOUR_OPENAI_KEY_HAPA",

    // Delay before marking chat inactive (default 5 mins)
    INACTIVITY_TIMEOUT: parseInt(process.env.INACTIVITY_TIMEOUT) || 5 * 60 * 1000,

    // Emojis that identify the “target contacts”
    TARGET_EMOJIS: (process.env.TARGET_EMOJIS || "❤️,💖").split(","),

    // Cron schedule for auto-messaging (default: 9:00 AM daily)
    CRON_SCHEDULE: process.env.CRON_SCHEDULE || "0 9 * * *",

    // Message to auto-send
    CRON_MESSAGE: process.env.CRON_MESSAGE || "Good morning sweetheart ❤️",

    // For deployments (Heroku, Render, etc.)
    PORT: process.env.PORT || 8080
};
