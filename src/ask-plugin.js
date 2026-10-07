const ASK_URL =
  process.env.ASK_URL || 'http://192.168.0.249:44269/v1/chat/completions';
const ASK_MODEL = process.env.ASK_MODEL || 'qwen36-35b';
const LEVELS = {
  1: {tokens: 200, how: '한두 문장으로만'},
  2: {tokens: 400, how: '짧게'},
  3: {tokens: 800, how: '핵심과 이유를 포함해'},
  4: {tokens: 1400, how: '자세히, 글의 예가 있으면 그 예로'},
  5: {tokens: 2200, how: '충분히, 필요한 계산과 단계를 풀어서'},
};

function asText(text) {
  return String(text)
    .replace(/```[a-z]*\n?/gi, '')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/__(.+?)__/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/^\s*[-*]\s+/gm, '');
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > 80_000) {
        reject(new Error('too big'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString() || '{}'));
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

async function ask(req, res) {
  try {
    const body = await readBody(req);
    const question = String(body.question || '').trim().slice(0, 2000);
    const page = String(body.page || '').slice(0, 12_000);
    const selection = String(body.selection || '').trim().slice(0, 2000);
    const level = LEVELS[Number(body.level)] || LEVELS[3];
    if (!question) {
      res.status(400).json({error: '질문이 없습니다'});
      return;
    }
    const upstream = await fetch(ASK_URL, {
      method: 'POST',
      headers: {'content-type': 'application/json'},
      signal: AbortSignal.timeout(60_000),
      body: JSON.stringify({
        model: ASK_MODEL,
        temperature: 0.3,
        max_tokens: level.tokens,
        chat_template_kwargs: {enable_thinking: false},
        messages: [
          {
            role: 'system',
            content:
              `보고 있는 글을 바탕으로 질문에 ${level.how} 답한다. 선택한 부분이 있으면 그 부분을 중심으로 답한다. 글에 없으면 일반 지식으로 답하고, 글에 없다고 한 줄 밝힌다. 한국어. 마크다운 기호 없이 평범한 문장으로 쓴다.`,
          },
          {
            role: 'user',
            content: selection
              ? `글:\n${page}\n\n선택한 부분:\n${selection}\n\n질문: ${question}`
              : `글:\n${page}\n\n질문: ${question}`,
          },
        ],
      }),
    });
    const data = await upstream.json();
    const answer =
      data.choices?.[0]?.message?.content ||
      data.error?.message ||
      '답이 비었습니다';
    res.status(upstream.ok ? 200 : 502).json({answer: asText(answer)});
  } catch (err) {
    res.status(502).json({error: String(err.message || err)});
  }
}

module.exports = function askPlugin() {
  return {
    name: 'papers-ask',
    configureWebpack(_config, isServer) {
      if (isServer) return {};
      return {
        devServer: {
          // ponytail: replaces Docusaurus source-map middleware. Restore if the error overlay is needed.
          setupMiddlewares(middlewares, devServer) {
            middlewares.unshift((req, res, next) => {
              if (req.method !== 'POST' || req.path !== '/api/ask') return next();
              ask(req, res);
            });
            return middlewares;
          },
        },
      };
    },
  };
};
