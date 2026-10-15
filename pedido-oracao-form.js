/* =========================================================
   PEDIDO DE ORAÇÃO - script da página (roda no NAVEGADOR)
   Precisa vir DEPOIS do filtro-palavras.js no HTML.

   O que faz:
   - contador de caracteres
   - valida nome, e-mail e pedido
   - aplica o filtro de palavras e de links
   - bloqueia robôs (campo escondido + tempo mínimo)
   - envia pelo FormSubmit (que mostra a verificação "não sou um
     robô") e, na volta, mostra o pop-up de "Pedido enviado"

   O endereço de envio é o action do <form> no HTML.
========================================================= */
(function () {
    'use strict';

    const form = document.getElementById('formPedido');
    if (!form) return;

    const MAX_CHARS = 500;
    const MIN_SEGUNDOS = 4;                       // robôs preenchem rápido demais
    const TELEFONE = '(71) 3333-4444';
    const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

    const campos = {
        nome:   { input: document.getElementById('nome'),   box: document.getElementById('campo-nome'),   erro: document.getElementById('erro-nome') },
        email:  { input: document.getElementById('email'),  box: document.getElementById('campo-email'),  erro: document.getElementById('erro-email') },
        pedido: { input: document.getElementById('pedido'), box: document.getElementById('campo-pedido'), erro: document.getElementById('erro-pedido') }
    };

    const sigilo = document.getElementById('sigilo');
    const armadilha = document.getElementById('website');
    const contador = document.getElementById('contador');
    const alerta = document.getElementById('ppAlerta');
    const btn = document.getElementById('btnEnviar');
    const sucesso = document.getElementById('ppSucesso');
    const btnOutro = document.getElementById('btnOutro');
    const cabecalho = document.querySelector('.pp-card-head');

    let abriuEm = Date.now();

    /* ---------- Mensagens de erro ---------- */
    function mostrarErro(nome, msg) {
        const c = campos[nome];
        c.erro.textContent = msg;
        c.box.classList.add('tem-erro');
    }

    function limparErros() {
        Object.keys(campos).forEach(function (nome) {
            campos[nome].erro.textContent = '';
            campos[nome].box.classList.remove('tem-erro');
        });
        alerta.hidden = true;
        alerta.textContent = '';
    }

    function mostrarAlerta(msg, comTelefone) {
        alerta.textContent = msg;
        if (comTelefone) {
            alerta.appendChild(document.createElement('br'));
            const a = document.createElement('a');
            a.href = 'tel:+557133334444';
            a.textContent = 'Ligar para a secretaria: ' + TELEFONE;
            alerta.appendChild(a);
        }
        alerta.hidden = false;
        alerta.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    /* ---------- Contador ---------- */
    function atualizarContador() {
        const n = campos.pedido.input.value.length;
        contador.textContent = n + ' / ' + MAX_CHARS + ' caracteres';
        contador.classList.toggle('limite', n >= MAX_CHARS);
    }
    campos.pedido.input.addEventListener('input', atualizarContador);
    atualizarContador();

    // some o erro assim que a pessoa volta a digitar no campo
    Object.keys(campos).forEach(function (nome) {
        campos[nome].input.addEventListener('input', function () {
            campos[nome].erro.textContent = '';
            campos[nome].box.classList.remove('tem-erro');
        });
    });

    /* ---------- Validação ---------- */
    function validar() {
        const filtro = window.FiltroPalavras;
        let ok = true;
        let primeiroErro = null;

        function falha(nome, msg) {
            mostrarErro(nome, msg);
            ok = false;
            if (!primeiroErro) primeiroErro = campos[nome].input;
        }

        const nome = campos.nome.input.value.trim();
        const email = campos.email.input.value.trim();
        const pedido = campos.pedido.input.value.trim();

        if (nome.length < 2) {
            falha('nome', 'Informe o seu nome.');
        } else if (filtro && (!filtro.verificar(nome).ok || filtro.temLink(nome))) {
            falha('nome', 'Não podemos aceitar esse nome. Use apenas o seu nome.');
        }

        if (!EMAIL_RE.test(email)) {
            falha('email', 'Informe um e-mail válido, por exemplo: nome@email.com');
        }

        if (pedido.length < 10) {
            falha('pedido', 'Escreva um pouco mais sobre a sua intenção (mínimo de 10 letras).');
        } else if (filtro && (!filtro.verificar(pedido).ok || filtro.temLink(pedido))) {
            falha('pedido', 'Encontramos palavras ou links que não podemos aceitar. Reescreva seu pedido, por favor.');
        }

        if (primeiroErro) primeiroErro.focus();
        return ok;
    }

    /* ---------- Envio ---------- */
    function enviando(sim) {
        btn.disabled = sim;
        btn.classList.toggle('enviando', sim);
        btn.querySelector('.pp-btn-texto').textContent = sim ? 'Enviando...' : 'Enviar pedido de oração';
    }

    /* ---------- Pop-up de confirmação ---------- */
    let popup = null;
    let focoAnterior = null;

    function criarPopup() {
        popup = document.createElement('div');
        popup.className = 'pp-popup';
        popup.hidden = true;
        popup.innerHTML =
            '<div class="pp-popup-caixa" role="dialog" aria-modal="true" aria-labelledby="ppPopupTitulo" aria-describedby="ppPopupTexto">' +
                '<span class="h-icon po-icon"><i class="fas fa-check" aria-hidden="true"></i></span>' +
                '<h3 id="ppPopupTitulo">Pedido enviado!</h3>' +
                '<p id="ppPopupTexto">Recebemos a sua intenção e ela será colocada em oração. Que Deus abençoe você e sua família.</p>' +
                '<button type="button" class="btn-primary pp-popup-fechar">Fechar</button>' +
            '</div>';
        document.body.appendChild(popup);

        popup.querySelector('.pp-popup-fechar').addEventListener('click', fecharPopup);

        // clicar fora da caixa também fecha
        popup.addEventListener('click', function (e) {
            if (e.target === popup) fecharPopup();
        });

        // Esc fecha
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && !popup.hidden) fecharPopup();
        });
    }

    function abrirPopup() {
        if (!popup) criarPopup();
        focoAnterior = document.activeElement;
        popup.hidden = false;
        document.body.style.overflow = 'hidden';      // trava a rolagem do fundo
        popup.querySelector('.pp-popup-fechar').focus();
    }

    function fecharPopup() {
        popup.hidden = true;
        document.body.style.overflow = '';
        if (focoAnterior && focoAnterior.focus) focoAnterior.focus();
    }

    function mostrarSucesso() {
        form.hidden = true;
        if (cabecalho) cabecalho.hidden = true;
        sucesso.hidden = false;
        abrirPopup();
    }

    form.addEventListener('submit', async function (e) {
        e.preventDefault();        // não deixa o navegador enviar sem passar pelo filtro
        limparErros();

        // robô preencheu o campo escondido: finge que deu certo e descarta
        if (armadilha.value) {
            mostrarSucesso();
            return;
        }

        // o filtro precisa ter carregado, senão nada é verificado
        if (!window.FiltroPalavras) {
            console.error('filtro-palavras.js não carregou. Confira o caminho do <script> no HTML.');
            mostrarAlerta('Não foi possível verificar o texto agora. Atualize a página e tente de novo.', true);
            return;
        }

        if ((Date.now() - abriuEm) / 1000 < MIN_SEGUNDOS) {
            mostrarAlerta('Calma, só mais alguns segundinhos e você já pode enviar.', false);
            return;
        }

        if (!validar()) return;

        // Tudo certo com o filtro: envia o formulário de verdade para o FormSubmit.
        // Ele mostra a verificação "não sou um robô" e, depois dela, manda a pessoa
        // de volta para esta página com ?enviado=1 (veja o campo _next no HTML).
        enviando(true);
        form.submit();
    });

    /* ---------- Volta do FormSubmit: mostra o pop-up ---------- */
    try {
        const params = new URLSearchParams(window.location.search);
        if (params.get('enviado') === '1') {
            // limpa o ?enviado=1 do endereço, para o pop-up não reaparecer ao atualizar
            window.history.replaceState({}, '', window.location.pathname);
            mostrarSucesso();
        }
    } catch (e) { /* navegador antigo: segue sem o pop-up */ }

    /* ---------- "Fazer outro pedido" ---------- */
    if (btnOutro) {
        btnOutro.addEventListener('click', function () {
            form.reset();
            atualizarContador();
            limparErros();
            sucesso.hidden = true;
            form.hidden = false;
            if (cabecalho) cabecalho.hidden = false;
            abriuEm = Date.now();
            campos.nome.input.focus();
        });
    }
})();