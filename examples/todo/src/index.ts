import express from 'express';

const app = express();

app.use(express.json());

app.get('/', (_req, res) => {
    res.json({
        name: 'Phestus Todo',
        version: '0.1.0',
    });
});

app.get('/health', (_req, res) => {
    res.json({
        status: 'ok',
    });
});

const port = 3000;

app.listen(port, () => {
    console.log(`Todo server listening on http://localhost:${port}`);
});