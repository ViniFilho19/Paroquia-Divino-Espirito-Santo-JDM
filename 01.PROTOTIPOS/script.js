
    
    // ========== MENU ==========
    function alertReflexao(titulo) {
        alert(`📖 ${titulo}\n\nQue esta reflexão toque seu coração. Acesse em breve para ler o conteúdo completo. Deus abençoe!`);
    }

    const menuToggle = document.getElementById('menuToggle');
    const navMenu = document.getElementById('navMenu');
    const overlay = document.getElementById('overlay');

    function toggleMenu() {
        menuToggle.classList.toggle('active');
        navMenu.classList.toggle('active');
        overlay.classList.toggle('active');
        document.body.style.overflow = navMenu.classList.contains('active') ? 'hidden' : '';
    }

    menuToggle.addEventListener('click', toggleMenu);
    overlay.addEventListener('click', toggleMenu);

    const comunidadesToggle = document.getElementById('comunidadesToggle');
    const comunidadesSubmenu = document.getElementById('comunidadesSubmenu');

    if (comunidadesToggle) {
        comunidadesToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            comunidadesToggle.classList.toggle('open');
            comunidadesSubmenu.classList.toggle('open');
        });
    }

    document.querySelectorAll('.nav-menu a').forEach(link => {
        link.addEventListener('click', () => {
            if (navMenu.classList.contains('active') && !link.closest('.menu-item-with-submenu')) {
                toggleMenu();
            }
        });
    });

    const linkPalavra = document.querySelector('.nav-menu a[href="#"]');
    if (linkPalavra && linkPalavra.innerText === 'A Palavra') {
        linkPalavra.addEventListener('click', (e) => {
            e.preventDefault();
            const sectionPalavra = document.getElementById('a-palavra');
            if (sectionPalavra) {
                sectionPalavra.scrollIntoView({ behavior: 'smooth' });
            }
            if (navMenu.classList.contains('active')) {
                toggleMenu();
            }
        });
    }

    document.querySelectorAll('.btn-primary, .btn-outline-light, .btn-dourado, .btn-whatsapp-nav, .btn-whatsapp-footer, .sacramento-badge, .pastoral-card').forEach(btn => {
        btn.addEventListener('click', (e) => {
            if(btn.classList.contains('sacramento-badge')) {
                e.preventDefault();
                const nomeSacramento = btn.innerText.trim();
                alert(`📖 ${nomeSacramento}\n\nPara mais informações sobre este sacramento, entre em contato com a secretaria paroquial.`);
            } else if(btn.classList.contains('pastoral-card')) {
                e.preventDefault();
                const pastoralNome = btn.querySelector('h3')?.innerText || 'Pastoral';
                alert(`🙏 ${pastoralNome}\n\nParticipe! Entre em contato com a coordenação da pastoral.`);
            } else if(btn.getAttribute('href') === '#' || btn.getAttribute('href') === '#') {
                e.preventDefault();
                alert('Funcionalidade disponível em breve. Obrigado!');
            }
        });
    });
