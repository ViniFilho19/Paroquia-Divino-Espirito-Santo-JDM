/* =========================================================
   API: /api/pedido-oracao
   Recebe o pedido do site, confere tudo de novo no servidor
   (o filtro do navegador pode ser burlado) e envia para o
   WhatsApp da paróquia usando o CallMeBot.

   Pensada para a Vercel (pasta /api na raiz do projeto).
   Variáveis de ambiente (Settings > Environment Variables):
     CALLMEBOT_PHONE    ex: +5571999999999  (número que RECEBE os pedidos)
     CALLMEBOT_APIKEY   chave que o CallMeBot envia no WhatsApp
     ALLOWED_ORIGIN     (opcional) site que pode chamar a API, ex:
                        https://www.suaparoquia.com.br
                        (separe vários por vírgula)
========================================================= */
const Filtro = require('../filtro-palavras.js');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const INTERVALO_MS = 30 * 1000;

// Controle simples por IP. Em serverless a memória é reiniciada de vez em
// quando, então isto é um freio básico, não uma proteção completa.
const ultimosEnvios = new Map();

function limpar(valor, max) {
    return String(valor || '')
        .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '') // caracteres de controle
        .trim()
        .slice(0, max);
}

function montarMensagem(d) {
    const data = new Date().toLocaleString('pt-BR', {
        timeZone: 'America/Bahia',
        dateStyle: 'short',
        timeStyle: 'short'
    });
    return [
        '🙏 *Novo pedido de oração*',
        '',
        '*Nome:* ' + d.nome,
        '*E-mail:* ' + d.email,
        d.sigilo ? '🔒 _Prefere que o nome não seja citado na oração_' : null,
        '',
        '*Pedido:*',
        d.pedido,
        '',
        '_Enviado pelo site em ' + data + '_'
    ].filter((linha) => linha !== null).join('\n');
}

function liberarCors(req, res) {
    const permitidas = (process.env.ALLOWED_ORIGIN || '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
    const origem = req.headers.origin;

    if (origem && permitidas.includes(origem)) {
        res.setHeader('Access-Control-Allow-Origin', origem);
        res.setHeader('Vary', 'Origin');
        res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    }
}

module.exports = async function handler(req, res) {
    liberarCors(req, res);

    if (req.method === 'OPTIONS') return res.status(204).end();
    if (req.method !== 'POST') return res.status(405).json({ erro: 'Método não permitido.' });

    const corpo = req.body && typeof req.body === 'object' ? req.body : {};

    // Robô preencheu o campo escondido: responde "ok" e descarta
    if (corpo.website) return res.status(200).json({ ok: true });

    const dados = {
        nome: limpar(corpo.nome, 80),
        email: limpar(corpo.email, 120),
        pedido: limpar(corpo.pedido, 500),
        sigilo: corpo.sigilo === true
    };

    // Validação
    if (dados.nome.length < 2 || !EMAIL_RE.test(dados.email) || dados.pedido.length < 10) {
        return res.status(400).json({ erro: 'Preencha todos os campos corretamente.' });
    }

    // Filtro de palavras e links (de novo, agora no servidor)
    if (
        !Filtro.verificar(dados.nome).ok ||
        !Filtro.verificar(dados.pedido).ok ||
        Filtro.temLink(dados.nome) ||
        Filtro.temLink(dados.pedido)
    ) {
        return res.status(422).json({
            erro: 'Encontramos palavras ou links que não podemos aceitar. Reescreva seu pedido, por favor.'
        });
    }

    // Freio por IP
    const ip = String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '').split(',')[0].trim();
    const agora = Date.now();
    if (ip && agora - (ultimosEnvios.get(ip) || 0) < INTERVALO_MS) {
        return res.status(429).json({ erro: 'Aguarde um pouco para enviar outro pedido.' });
    }

    const phone = process.env.CALLMEBOT_PHONE;
    const apikey = process.env.CALLMEBOT_APIKEY;
    if (!phone || !apikey) {
        console.error('Faltam CALLMEBOT_PHONE e/ou CALLMEBOT_APIKEY nas variáveis de ambiente.');
        return res.status(500).json({ erro: 'Envio não configurado.' });
    }

    try {
        const url =
            'https://api.callmebot.com/whatsapp.php' +
            '?phone=' + encodeURIComponent(phone) +
            '&text=' + encodeURIComponent(montarMensagem(dados)) +
            '&apikey=' + encodeURIComponent(apikey);

        const resposta = await fetch(url);
        if (!resposta.ok) {
            console.error('CallMeBot respondeu', resposta.status, await resposta.text());
            return res.status(502).json({ erro: 'Não foi possível enviar agora.' });
        }

        if (ip) ultimosEnvios.set(ip, agora);
        return res.status(200).json({ ok: true });
    } catch (erro) {
        console.error('Falha ao chamar o CallMeBot:', erro);
        return res.status(502).json({ erro: 'Não foi possível enviar agora.' });
    }
};
