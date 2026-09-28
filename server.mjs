import express from 'express';
import multer from 'multer';
import { spawn } from 'node:child_process';
import { mkdir, writeFile, unlink } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const runtime = process.env.DATA_DIR || path.join(root, 'work', 'runtime');
const renders = path.join(runtime, 'renders');
const ffmpeg = process.env.FFMPEG_PATH || (existsSync(path.join(root, 'work', 'tools', 'ffmpeg', 'ffmpeg')) ? path.join(root, 'work', 'tools', 'ffmpeg', 'ffmpeg') : 'ffmpeg');
await mkdir(renders, { recursive: true });
await mkdir(path.join(runtime, 'uploads'), { recursive: true });
const app = express();
const upload = multer({ dest: path.join(runtime, 'uploads'), limits: { fileSize: 1024 * 1024 * 1024 } });
app.use(express.static(root));
app.use('/renders', express.static(renders));

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
    const args = ['-y', '-ss', String(Number(req.body.start) || 0), '-i', req.file.path, '-t', String(Math.max(.1, Number(req.body.duration) || 1)), '-vf', filter, '-map', '0:v:0', '-map', '0:a?', '-c:v', 'libx264', '-preset', 'medium', '-crf', '21', '-c:a', 'aac', '-movflags', '+faststart', '-shortest', output];
    const log = await new Promise((resolve, reject) => { const p = spawn(ffmpeg, args); let stderr = ''; p.stderr.on('data', d => stderr += d); p.on('error', reject); p.on('close', code => code === 0 ? resolve(stderr) : reject(new Error(stderr.slice(-1600)))); });
    res.json({ url: `/renders/${path.basename(output)}`, log });
  } catch (error) { res.status(500).json({ error: error.message || 'Falha ao renderizar.' });
  } finally { await Promise.allSettled([unlink(req.file.path), unlink(ass)]); }
});
app.listen(Number(process.env.PORT || 4173), '0.0.0.0', () => console.log('Estúdio iniciado'));
