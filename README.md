# Estúdio de Reels IA

Aplicativo pessoal, local e em português para organizar projetos de edição de Reels com IA.

## Etapa 1 — projetos e identidade visual

Esta entrega permite:

- criar, selecionar, editar e excluir projetos independentes;
- guardar nome, descrição, fontes, referências, paleta, logo, preferências e estilo de legendas;
- visualizar uma prévia da identidade e de uma legenda;
- persistir os dados no `localStorage` do navegador;
- reservar uma área clara para os Reels que futuramente pertencerão a cada projeto.

## Etapa 2 — primeiro Reel exportável

Esta entrega adiciona:

- importação de vídeo do computador para um Reel;
- guarda do original no IndexedDB deste navegador, sem modificá-lo;
- corte por início/fim, enquadramento vertical 9:16 e modo com fundo;
- legendas manuais cronometradas;
- interface e pipeline de exportação MP4 em 1080 × 1920 (bloqueados no ambiente atual; ver abaixo);
- reprodução e download do MP4 final.

Cada Reel recebe uma cópia da paleta e do estilo de legenda do projeto quando é criado. Alterar o projeto depois não altera Reels existentes.

## Bloqueio conhecido da exportação

O FFmpeg WebAssembly usado pela primeira versão não consegue iniciar neste navegador: o worker remoto é bloqueado pela política de origem cruzada. Há um FFmpeg local no Mac capaz de fazer cortes e preservar áudio, mas ele foi compilado sem suporte a legendas embutidas. Portanto, a interface informa a falha e não produz arquivo simulado.

Antes de considerar a exportação concluída, é necessário instalar/fornecer uma distribuição local do FFmpeg com `libass` (filtro `subtitles`) e executar um servidor local para receber os arquivos. Essa mesma estrutura será necessária para a transcrição, mantendo credenciais fora do navegador.

## Próximas etapas

1. Transcrição automática, detecção de trechos e sugestões por IA.
2. Linha do tempo, revisão de legendas e aprovação de versões.
3. Mais formatos, filas de renderização e exportações em lote.

## Recursos ainda não implementados

- armazenamento em nuvem e logotipo como arquivo;
- transcrição automática, IA, timeline e exportações em lote;
- contas, sincronização entre dispositivos e colaboração.

## Como executar localmente

No diretório do projeto:

```bash
python3 -m http.server 4173
```

Depois acesse `http://localhost:4173`.

> Os dados ficam somente neste navegador. Use o botão “Carregar exemplo” para conhecer a interface e “Limpar dados locais” para apagar a base de teste.
