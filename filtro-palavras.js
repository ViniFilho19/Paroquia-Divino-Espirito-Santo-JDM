/* =========================================================
   FILTRO DE PALAVRAS - Paróquia Divino Espírito Santo
   Bloqueia palavrões, ofensas e termos de conotação sexual.

   Funciona em dois lugares com o MESMO arquivo:
   - no navegador:  window.FiltroPalavras
   - no servidor:   require('../filtro-palavras.js')

   O que ele pega:
   - maiúsculas/minúsculas e acentos        (PÚTA, puta)
   - letras trocadas por números/símbolos   (m3rd4, put@, f0d4)
   - letras repetidas                       (puuuuta)
   - letras separadas                       (p u t a, p.u.t.a)

   Ele compara palavras INTEIRAS (ou o começo da palavra, nos
   casos seguros). Por isso "Cássia", "análise" e "Paulo" passam.
   Termos ambíguos de propósito ficaram de fora ("seio", "rola",
   "pau", "diabo", "inferno"...), porque aparecem em textos
   religiosos e pedidos legítimos.
========================================================= */
(function (root, factory) {
    if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.FiltroPalavras = factory();
    }
})(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    /* Palavras que precisam ser IGUAIS ao termo (sem acento). */
    const EXATAS = [
        // palavrões
        'puta', 'putas', 'puto', 'putos', 'porra', 'porras', 'caralho', 'cacete',
        'merda', 'merdas', 'bosta', 'cu', 'cuzao', 'cuzoes', 'foda', 'fodas',
        'fdp', 'pqp', 'vsf', 'vtnc', 'tnc', 'krl', 'crl', 'pnc',
        // ofensas
        'idiota', 'idiotas', 'imbecil', 'imbecis', 'babaca', 'babacas',
        'otario', 'otaria', 'otarios', 'cretino', 'cretina', 'retardado', 'retardada',
        'vagabundo', 'vagabunda', 'arrombado', 'arrombada', 'viado', 'viada',
        'viadinho', 'sapatao', 'vadia', 'vadias',
        // conotação sexual
        'sexo', 'sexos', 'sexual', 'sexuais', 'sexy', 'sex', 'transar', 'transa',
        'transei', 'transou', 'transando', 'trepada', 'tesao', 'tesuda', 'tesudo',
        'safado', 'safada', 'safados', 'safadas', 'punheta', 'siririca', 'boquete',
        'penis', 'vagina', 'piroca', 'buceta', 'xoxota', 'orgia', 'orgias',
        'anal', 'erotico', 'erotica', 'erotismo', 'nude', 'nudes',
        // inglês
        'shit', 'shitty', 'bullshit', 'bitch', 'bitches', 'dick', 'pussy',
        'cunt', 'asshole', 'whore', 'slut'
    ];

    /* Começos de palavra: pega "putaria", "merdinha", "fodido"... */
    const PREFIXOS = [
        'puta', 'putin', 'merd', 'fod', 'caralh', 'cacet', 'bucet', 'xoxot',
        'piroc', 'punhet', 'porn', 'masturb', 'orgasm', 'ejacul', 'fuck'
    ];

    const LEET = { '0': 'o', '1': 'i', '3': 'e', '4': 'a', '5': 's', '7': 't', '@': 'a', '$': 's' };

    const normalizar = (s) =>
        String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    const colapsar = (s) => s.replace(/(.)\1+/g, '$1');

    const SET_EXATAS = new Set(EXATAS.map((w) => colapsar(normalizar(w))));
    const LISTA_PREFIXOS = PREFIXOS.map((w) => colapsar(normalizar(w)));
    const LISTA_LONGAS = Array.from(SET_EXATAS).filter((w) => w.length >= 4);

    /* Quebra o texto em palavras e junta letras soltas ("p u t a"). */
    function tokenizar(texto) {
        const limpo = normalizar(texto).replace(/[^a-z0-9@$]+/g, ' ').trim();
        if (!limpo) return [];

        const saida = [];
        let corrida = [];

        const descarregar = () => {
            if (corrida.length >= 3) saida.push({ t: corrida.join(''), junto: true });
            else corrida.forEach((c) => saida.push({ t: c, junto: false }));
            corrida = [];
        };

        limpo.split(/\s+/).forEach((t) => {
            if (t.length === 1) {
                corrida.push(t);
            } else {
                descarregar();
                saida.push({ t, junto: false });
            }
        });
        descarregar();
        return saida;
    }

    /* Troca números/símbolos por letras, só em palavras que têm letra. */
    function destrocar(t) {
        if (t.length < 2 || !/[a-z]/.test(t)) return t;
        return t.replace(/[013457@$]/g, (c) => LEET[c]);
    }

    /**
     * Verifica um texto.
     * @returns {{ok: boolean}}  ok = false quando achou algo bloqueado.
     */
    function verificar(texto) {
        const itens = tokenizar(texto || '');

        for (const item of itens) {
            const t = colapsar(destrocar(item.t));

            if (SET_EXATAS.has(t)) return { ok: false };
            if (LISTA_PREFIXOS.some((p) => t.startsWith(p))) return { ok: false };

            // letras separadas: aceita a palavra proibida dentro da sequência
            if (item.junto && LISTA_LONGAS.some((w) => t.includes(w))) return { ok: false };
        }
        return { ok: true };
    }

    /** Bloqueia links (evita spam). */
    function temLink(texto) {
        return /(https?:\/\/|www\.|\b[a-z0-9-]+\.(com|net|org|br|io|me|xyz|link|ly)\b)/i.test(texto || '');
    }

    return { verificar, temLink };
});
