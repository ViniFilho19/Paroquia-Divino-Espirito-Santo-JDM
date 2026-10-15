/* =========================================================
   PEDIDO DE ORAÇÃO - validação, filtro e envio
   Precisa de filtro-palavras.js carregado ANTES deste arquivo.
========================================================= */
(function () {
    'use strict';

    /* ---------- CONFIGURAÇÃO ---------- */
    const CONFIG = {
        // Endereço da função que envia o e-mail (veja api/pedido-oracao.js).
        // Se o site e a função ficam em domínios diferentes, use o endereço completo:
        // 'https://SEU-PROJETO.vercel.app/api/pedido-oracao'
        // Deixe '' para abrir o programa de e-mail da pessoa com a mensagem pronta (sem servidor).
        endpoint: '/api/pedido-oracao',

        // E-mail da paróquia (usado só no plano B, quando o servidor falha)
        emailDestino: 'contato@divinoespiritosanto.com.br',

        maxChars: 500,
        minSegundos: 4,          // tempo mínimo na página antes de enviar (barra robôs)
        intervaloMs: 60 * 1000   // intervalo mínimo entre dois envios do mesmo aparelho
    };

    /* ---------- ELEMENTOS ---------- */
    const $ = (id) => document.getElementById(id);
    const form = $('formPedido');
    const campos = { nome: $('nome'), email: $('email'), pedido: $('pedido') };
    const sigilo = $('sigilo');
    const armadilha = $('website');
    const contador = $('contador');
    const alerta = $('ppAlerta');
    const btn = $('btnEnviar');
    const sucesso = $('ppSucesso');
    const sucessoTexto = $('ppSucessoTexto');

    const abriuEm = Date.now();
    const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    const CHAVE_ULTIMO = 'pedidoOracaoUltimoEnvio';

    const MSG_FILTRO =
        'Encontramos palavras que não podemos aceitar. Reescreva com outras palavras, por favor.';

    /* ---------- FUNÇÕES DE TELA ---------- */
    function setErro(campo, mensagem) {
        const bloco = $('campo-' + campo);
        $('erro-' + campo).textContent = mensagem;
        bloco.classList.add('tem-erro');
    }

    function limparErros() {
        document.querySelectorAll('.pp-field.tem-erro').forEach((el) => el.classList.remove('tem-erro'));
    }

    function esconderAlerta() {
        alerta.hidden = true;
        alerta.textContent = '';
    }

    function mostrarAlerta(texto, linkPlanoB) {
        alerta.textContent = texto;
        if (linkPlanoB) {
            alerta.appendChild(document.createElement('br'));
            const a = document.createElement('a');
            a.href = linkPlanoB;
            a.textContent = 'Enviar pelo meu e-mail';
            alerta.appendChild(a);
        }
        alerta.hidden = false;
        alerta.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    function setEnviando(sim) {
        btn.disabled = sim;
        btn.classList.toggle('enviando', sim);
        btn.querySelector('.pp-btn-texto').textContent = sim ? 'Enviando...' : 'Enviar pedido de oração';
    }

    function mostrarSucesso(texto) {
        if (texto) sucessoTexto.textContent = texto;
        form.hidden = true;
        sucesso.hidden = false;
        sucesso.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    function atualizarContador() {
        const n = campos.pedido.value.length;
        contador.textContent = n + ' / ' + CONFIG.maxChars + ' caracteres';
        contador.classList.toggle('limite', n >= CONFIG.maxChars);
    }

    /* ---------- MENSAGEM DE E-MAIL (plano B) ---------- */
    function montarMensagem(d) {
        return [
            'Novo pedido de oração',
            '',
            'Nome: ' + d.nome,
            'E-mail: ' + d.email,
            d.sigilo ? 'Atenção: prefere que o nome não seja citado na oração.' : '',
            '',
            'Pedido:',
            d.pedido
        ].filter((linha, i, arr) => !(linha === '' && arr[i - 1] === '')).join('\n');
    }

    function linkEmail(d) {
        return 'mailto:' + CONFIG.emailDestino +
            '?subject=' + encodeURIComponent('Novo pedido de oração') +
            '&body=' + encodeURIComponent(montarMensagem(d));
    }

    /* ---------- ENVIO ---------- */
    async function enviarParaServidor(d) {
        const resp = await fetch(CONFIG.endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(d)
        });

        let corpo = {};
        try { corpo = await resp.json(); } catch (e) { /* resposta sem JSON */ }

        if (resp.status === 422) {
            const erro = new Error(corpo.erro || MSG_FILTRO);
            erro.tipo = 'filtro';
            throw erro;
        }
        if (resp.status === 429) {
            const erro = new Error('Você acabou de enviar um pedido. Aguarde um minuto para enviar outro.');
            erro.tipo = 'limite';
            throw erro;
        }
        if (!resp.ok) {
            const erro = new Error('Servidor indisponível');
            erro.tipo = 'servidor';
            throw erro;
        }
    }

    function lerUltimoEnvio() {
        try { return Number(localStorage.getItem(CHAVE_ULTIMO)) || 0; } catch (e) { return 0; }
    }

    function gravarUltimoEnvio() {
        try { localStorage.setItem(CHAVE_ULTIMO, String(Date.now())); } catch (e) { /* ignora */ }
    }

    /* ---------- SUBMIT ---------- */
    form.addEventListener('submit', async function (e) {
        e.preventDefault();
        limparErros();
        esconderAlerta();

        const dados = {
            nome: campos.nome.value.trim().replace(/\s+/g, ' '),
            email: campos.email.value.trim(),
            pedido: campos.pedido.value.trim(),
            sigilo: sigilo.checked,
            website: armadilha.value
        };

        // 1) Robô preencheu o campo escondido: finge que deu certo e descarta
        if (dados.website) {
            mostrarSucesso();
            return;
        }

        // 2) Campos obrigatórios
        const invalidos = [];
        if (dados.nome.length < 2) { setErro('nome', 'Informe seu nome.'); invalidos.push('nome'); }
        if (!EMAIL_RE.test(dados.email)) { setErro('email', 'Informe um e-mail válido, como nome@email.com.'); invalidos.push('email'); }
        if (dados.pedido.length < 10) { setErro('pedido', 'Escreva seu pedido com pelo menos 10 caracteres.'); invalidos.push('pedido'); }
        if (dados.pedido.length > CONFIG.maxChars) { setErro('pedido', 'O pedido pode ter no máximo ' + CONFIG.maxChars + ' caracteres.'); invalidos.push('pedido'); }

        // 3) Filtro de palavras e links
        if (!invalidos.includes('nome') && (!FiltroPalavras.verificar(dados.nome).ok || FiltroPalavras.temLink(dados.nome))) {
            setErro('nome', 'Use apenas o seu nome, sem palavras ofensivas ou links.');
            invalidos.push('nome');
        }
        if (!invalidos.includes('pedido')) {
            if (!FiltroPalavras.verificar(dados.pedido).ok) {
                setErro('pedido', MSG_FILTRO);
                invalidos.push('pedido');
            } else if (FiltroPalavras.temLink(dados.pedido)) {
                setErro('pedido', 'Não é possível enviar links no pedido. Escreva só a sua intenção.');
                invalidos.push('pedido');
            }
        }

        if (invalidos.length) {
            const primeiro = campos[invalidos[0]];
            primeiro.focus();
            return;
        }

        // 4) Proteções contra envio repetido
        if ((Date.now() - abriuEm) / 1000 < CONFIG.minSegundos) {
            mostrarAlerta('Aguarde alguns segundos e envie novamente.');
            return;
        }
        if (Date.now() - lerUltimoEnvio() < CONFIG.intervaloMs) {
            mostrarAlerta('Você acabou de enviar um pedido. Aguarde um minuto para enviar outro.');
            return;
        }

        // 5) Envio
        // Sem servidor configurado: abre o programa de e-mail com a mensagem pronta
        if (!CONFIG.endpoint) {
            window.location.href = linkEmail(dados);
            gravarUltimoEnvio();
            mostrarSucesso('Abrimos o seu e-mail com o pedido pronto. Clique em enviar para concluir.');
            return;
        }

        setEnviando(true);
        try {
            await enviarParaServidor(dados);
            gravarUltimoEnvio();
            mostrarSucesso();
        } catch (erro) {
            if (erro.tipo === 'filtro') {
                setErro('pedido', erro.message);
                campos.pedido.focus();
            } else if (erro.tipo === 'limite') {
                mostrarAlerta(erro.message);
            } else {
                // Falha de rede ou do servidor: oferece o plano B por e-mail
                mostrarAlerta(
                    'Não conseguimos enviar o pedido agora. Você pode enviá-lo pelo seu programa de e-mail:',
                    linkEmail(dados)
                );
            }
        } finally {
            setEnviando(false);
        }
    });

    /* ---------- OUTROS EVENTOS ---------- */
    campos.pedido.addEventListener('input', atualizarContador);

    // Limpa o erro do campo assim que a pessoa volta a digitar
    Object.keys(campos).forEach(function (nome) {
        campos[nome].addEventListener('input', function () {
            $('campo-' + nome).classList.remove('tem-erro');
        });
    });

    $('btnOutro').addEventListener('click', function () {
        form.reset();
        atualizarContador();
        sucesso.hidden = true;
        form.hidden = false;
        campos.pedido.focus();
    });

    atualizarContador();
})();
