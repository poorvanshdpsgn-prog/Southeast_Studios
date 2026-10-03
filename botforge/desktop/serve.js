const path = require('path');
const { createStaticServer } = require('./server');
const PORT = 4173;
const server = createStaticServer(path.resolve(__dirname, '../..'), PORT);
server.once('error', error => {
    console.error(error.code === 'EADDRINUSE' ? `Port ${PORT} is already in use.` : error.message);
    process.exitCode = 1;
});
server.listen(PORT, 'localhost', () => console.log(`BotForge is available at http://localhost:${PORT}/pages/index.html`));
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.close(() => process.exit(0)));
