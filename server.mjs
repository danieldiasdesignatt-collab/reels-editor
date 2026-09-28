import express from 'express';
import multer from 'multer';
import ffmpegStatic from 'ffmpeg-static';
import { spawn } from 'node:child_process';
import { mkdir, writeFile, unlink, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const runtime = process.env.DATA_DIR || path.join(root, 'work', 'runtime');
const renders = path.join(runtime, 'renders');
const ffmpeg = process.env.FFMPEG_PATH || ffmpegStatic || (existsSync(path.join(root, 'work', 'tools', 'ffmpeg', 'ffmpeg')) ? path.join(root, 'work', 'tools', 'ffmpeg', 'ffmpeg') : 'ffmpeg');
await mkdir(renders, { recursive: true });
await mkdir(path.join(runtime, 'uploads'), { recursive: true });
const app = express();
const upload = multer({ dest: path.join(runtime, 'uploads'), limits: { fileSize: 1024 * 1024 * 1024 } });
app.use(express.static(root));
app.use('/renders', express.static(renders));

app.get('/api/features', (_req, res) => res.json({
  transcription: Boolean(process.env.OPENAI_API_KEY),
}));

const safe = value => String(value || '').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 60);
app.post('/api/export', upload.single('video'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Vídeo ausente.' });
  // Quando usamos o FFmpeg do sistema (por exemplo, no Docker), o comando é
  // resolvido pelo PATH. Só validamos previamente caminhos explícitos.
  if (ffmpeg.includes(path.sep) && !existsSync(ffmpeg)) return res.status(500).json({ error: 'FFmpeg não encontrado no servidor.' });
  const id = `${Date.now()}-${safe(req.body.reelId) || 'reel'}`;
  const ass = path.join(runtime, `${id}.ass`), output = path.join(renders, `${id}.mp4`);
  try {
    await writeFile(ass, req.body.ass || '');
    const filter = String(req.body.filter || '').replaceAll('captions.ass', ass.replaceAll(':', '\\:'));
    // O plano gratuito tem pouca memória. Um único encoder evita que um render
    // vertical derrube a instância, mantendo a resolução final solicitada.
    const args = ['-y', '-ss', String(Number(req.body.start) || 0), '-i', req.file.path, '-t', String(Math.max(.1, Number(req.body.duration) || 1)), '-vf', filter, '-map', '0:v:0', '-map', '0:a?', '-c:v', 'libx264', '-threads', '1', '-preset', 'ultrafast', '-crf', '23', '-c:a', 'aac', '-movflags', '+faststart', '-shortest', output];
    const log = await new Promise((resolve, reject) => { const p = spawn(ffmpeg, args); let stderr = ''; p.stderr.on('data', d => stderr += d); p.on('error', reject); p.on('close', code => code === 0 ? resolve(stderr) : reject(new Error(stderr.slice(-1600)))); });
    res.json({ url: `/renders/${path.basename(output)}`, log });
  } catch (error) { res.status(500).json({ error: error.message || 'Falha ao renderizar.' });
  } finally { await Promise.allSettled([unlink(req.file.path), unlink(ass)]); }
});

// A chave fica exclusivamente no ambiente do Render. O navegador só recebe
// o texto e os tempos retornados pela API, nunca a credencial.
app.post('/api/transcribe', upload.single('video'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Vídeo ausente.' });
  if (!process.env.OPENAI_API_KEY) return res.status(503).json({ error: 'A transcrição automática ainda não foi configurada neste servidor.' });
  if (req.file.size > 25 * 1024 * 1024) return res.status(413).json({ error: 'Para a transcrição, envie um trecho de até 25 MB.' });
  try {
    const bytes = await readFile(req.file.path);
    const body = new FormData();
    body.append('file', new Blob([bytes], { type: req.file.mimetype || 'video/mp4' }), req.file.originalname || 'video.mp4');
    body.append('model', 'whisper-1');
    body.append('language', 'pt');
    body.append('response_format', 'verbose_json');
    body.append('timestamp_granularities[]', 'word');
    body.append('timestamp_granularities[]', 'segment');
    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST', headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` }, body,
    });
    const result = await response.json();
    if (!response.ok) {
      const message = result.error?.message || 'Falha na transcrição.';
      if (response.status === 429 && /credits|billing|quota/i.test(message)) {
        return res.status(402).json({ error: 'A conta da API está sem créditos. Adicione créditos na cobrança da OpenAI e tente novamente.' });
      }
      return res.status(response.status >= 400 && response.status < 500 ? response.status : 502).json({ error: message });
    }
    res.json({ text: result.text || '', words: result.words || [], segments: result.segments || [] });
  } catch (error) {
    res.status(502).json({ error: error.message || 'Falha ao transcrever o vídeo.' });
  } finally { await Promise.allSettled([unlink(req.file.path)]); }
});
app.listen(Number(process.env.PORT || 4173), '0.0.0.0', () => console.log('Estúdio iniciado'));
