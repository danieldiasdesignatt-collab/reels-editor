# Estúdio de Reels IA

Editor pessoal em português para transformar um vídeo em Reel vertical, publicado no Render.

## O que funciona hoje

- Projetos independentes, com identidade visual, referências e preferências de edição.
- Importação de vídeo pelo navegador sem alterar o arquivo original.
- Corte por tempo, enquadramento vertical 9:16, ajuste de foco e modo com fundo.
- Legendas manuais com estilo, cor e posição copiados da identidade do projeto no momento da criação do Reel.
- Abertura com texto animado e zoom suave opcional. Os dois são mostrados na prévia e incluídos no MP4.
- Exportação real em MP4 1080 × 1920, com FFmpeg, áudio e legendas embutidas.
- Reprodução e download do resultado.

## Publicação

O app é servido por Node/Express e o processamento é feito pelo FFmpeg do servidor:

- URL: `https://reels-editor-daniel.onrender.com`
- Hospedagem: Render (serviço web gratuito)
- Código: `https://github.com/danieldiasdesignatt-collab/reels-editor`

## Limites conhecidos e próximos passos

Os projetos e vídeos enviados ainda são guardados no navegador (localStorage e IndexedDB). Isto preserva os dados no mesmo navegador, mas não sincroniza entre dispositivos. O MP4 gerado fica disponível no servidor enquanto a instância gratuita estiver ativa; não deve ser usado como arquivo permanente.

Para o produto ficar pessoal, privado e permanente, faltam:

1. Login e isolamento dos dados por usuário.
2. Banco de dados para projetos, estilos, referências e decisões de edição.
3. Armazenamento de objetos para originais, logos e MP4s (um disco persistente do Render ou S3/R2 equivalente).
4. Fila de renderização para vídeos maiores.
5. Transcrição automática e sugestões de edição por IA. Esta etapa requer configurar um provedor de IA no servidor e revisar os custos antes do primeiro uso pago.

Não há transcrição automática, detecção semântica de melhores trechos nem geração de motion graphics por IA nesta versão. Esses recursos não são simulados.

## Desenvolvimento local

```bash
npm install
npm start
```

O servidor usa `PORT` e, opcionalmente, `DATA_DIR`. Para renderizar, `ffmpeg-static` fornece um binário compatível quando não há `FFMPEG_PATH` configurado.
