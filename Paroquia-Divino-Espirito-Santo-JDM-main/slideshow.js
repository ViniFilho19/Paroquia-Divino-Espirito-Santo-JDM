/* =========================================================
   SLIDESHOW - Paróquia e comunidades
   - troca automática a cada 6 segundos
   - para ao passar o mouse, ao focar com o teclado e quando a aba fica oculta
   - setas, pontos, botão de pausa, teclado (← →) e deslizar no celular
   - respeita "reduzir movimento" do aparelho (não troca sozinho)
========================================================= */
(function () {
    'use strict';

    const raiz = document.querySelector('.sl');
    if (!raiz) return;

    const slides = Array.from(raiz.querySelectorAll('.sl-slide'));
    const trilho = raiz.querySelector('.sl-track');
    const caixaPontos = raiz.querySelector('.sl-dots');
    const btnAnterior = raiz.querySelector('.sl-prev');
    const btnProximo = raiz.querySelector('.sl-next');
    const btnPausa = raiz.querySelector('.sl-pausa');

    const total = slides.length;
    if (total < 2) return;

    const INTERVALO = 6000;
    const reduzMovimento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let atual = 0;
    let timer = null;
    let pausadoPeloUsuario = reduzMovimento;  // com "reduzir movimento", começa parado
    let pausadoTemporario = false;            // mouse em cima, foco, aba oculta

    /* ---------- Pontos ---------- */
    const pontos = slides.map(function (_, i) {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'sl-dot';
        b.setAttribute('aria-label', 'Ir para o slide ' + (i + 1) + ' de ' + total);
        b.addEventListener('click', function () { ir(i, true); });
        caixaPontos.appendChild(b);
        return b;
    });

    /* ---------- Troca de slide ---------- */
    function ir(indice, manual) {
        atual = (indice + total) % total;

        slides.forEach(function (slide, i) {
            const ativo = i === atual;
            slide.classList.toggle('is-active', ativo);
            slide.setAttribute('aria-hidden', ativo ? 'false' : 'true');
            slide.inert = !ativo;   // links do slide escondido saem da navegação por Tab
        });

        pontos.forEach(function (ponto, i) {
            const ativo = i === atual;
            ponto.classList.toggle('is-active', ativo);
            if (ativo) ponto.setAttribute('aria-current', 'true');
            else ponto.removeAttribute('aria-current');
        });

        // depois de um clique, o tempo recomeça para a pessoa ler com calma
        if (manual) reiniciar();
    }

    /* ---------- Automático ---------- */
    function parar() {
        if (timer) {
            clearInterval(timer);
            timer = null;
        }
    }

    function iniciar() {
        parar();
        if (pausadoPeloUsuario || pausadoTemporario) return;
        timer = setInterval(function () { ir(atual + 1, false); }, INTERVALO);
    }

    function reiniciar() {
        iniciar();
    }

    function atualizarBotaoPausa() {
        if (!btnPausa) return;
        const icone = btnPausa.querySelector('i');
        if (pausadoPeloUsuario) {
            icone.className = 'fas fa-play';
            btnPausa.setAttribute('aria-label', 'Iniciar a troca automática dos slides');
        } else {
            icone.className = 'fas fa-pause';
            btnPausa.setAttribute('aria-label', 'Pausar a troca automática dos slides');
        }
        // leitores de tela só anunciam a troca quando ela é manual
        trilho.setAttribute('aria-live', pausadoPeloUsuario ? 'polite' : 'off');
    }

    /* ---------- Eventos ---------- */
    btnAnterior.addEventListener('click', function () { ir(atual - 1, true); });
    btnProximo.addEventListener('click', function () { ir(atual + 1, true); });

    if (btnPausa) {
        btnPausa.addEventListener('click', function () {
            pausadoPeloUsuario = !pausadoPeloUsuario;
            atualizarBotaoPausa();
            iniciar();
        });
    }

    // pausa enquanto o mouse está em cima ou o foco está dentro do slideshow
    raiz.addEventListener('mouseenter', function () { pausadoTemporario = true; parar(); });
    raiz.addEventListener('mouseleave', function () { pausadoTemporario = false; iniciar(); });
    raiz.addEventListener('focusin', function () { pausadoTemporario = true; parar(); });
    raiz.addEventListener('focusout', function () { pausadoTemporario = false; iniciar(); });

    // não troca slides com a aba em segundo plano
    document.addEventListener('visibilitychange', function () {
        pausadoTemporario = document.hidden;
        if (document.hidden) parar(); else iniciar();
    });

    // teclado: setas esquerda e direita quando o foco está no slideshow
    raiz.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowLeft') { ir(atual - 1, true); }
        else if (e.key === 'ArrowRight') { ir(atual + 1, true); }
    });

    // deslizar o dedo no celular
    let toqueX = 0;
    let toqueY = 0;

    raiz.addEventListener('touchstart', function (e) {
        toqueX = e.changedTouches[0].clientX;
        toqueY = e.changedTouches[0].clientY;
    }, { passive: true });

    raiz.addEventListener('touchend', function (e) {
        const dx = e.changedTouches[0].clientX - toqueX;
        const dy = e.changedTouches[0].clientY - toqueY;
        if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
            ir(dx < 0 ? atual + 1 : atual - 1, true);
        }
    }, { passive: true });

    /* ---------- Começo ---------- */
    atualizarBotaoPausa();
    ir(0, false);
    iniciar();
})();