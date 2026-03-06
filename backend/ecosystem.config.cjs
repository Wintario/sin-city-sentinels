module.exports = {
  apps: [{
    name: 'rabbits-backend',
    script: './bootstrap.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '500M',
    env: {
      NODE_ENV: 'production',
      PORT: '3000',
      CORS_ORIGIN: 'https://wickedrabbits.ru,https://www.wickedrabbits.ru',
      FORCE_COLOR: 'false'
    }
  }]
};
