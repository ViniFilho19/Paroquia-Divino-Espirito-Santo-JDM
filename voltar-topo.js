(function () {
    'use strict';

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'voltar-topo';
    btn.setAttribute('aria-label', 'Voltar ao topo da página');
    btn.innerHTML = '<i class="fas fa-chevron-up" aria-hidden="true"></i>';
    document.body.appendChild(btn);

    const reduzMovimento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // aparece depois de rolar 400px
    function atualizar() {
        btn.classList.toggle('visivel', window.scrollY > 400);
    }

    btn.addEventListener('click', function () {
        window.scrollTo({ top: 0, behavior: reduzMovimento ? 'auto' : 'smooth' });
    });

    window.addEventListener('scroll', atualizar, { passive: true });
    atualizar();
})();