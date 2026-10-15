class MobileNavbar {
  constructor(mobileMenu, navList, navLinks) {
    this.mobileMenu = document.querySelector(mobileMenu);
    this.navList = document.querySelector(navList);
    this.navLinks = document.querySelectorAll(navLinks);
    this.activeClass = "active";

    this.handleClick = this.handleClick.bind(this);
    this.handleLinkClick = this.handleLinkClick.bind(this);
    this.handleResize = this.handleResize.bind(this);
  }

  animateLinks() {
    this.navLinks.forEach((link, index) => {
      link.style.animation
        ? (link.style.animation = "")
        : (link.style.animation = `navLinkFade 0.5s ease forwards ${
            index / 7 + 0.3
          }s`);
    });
  }

  handleClick() {
    this.navList.classList.toggle(this.activeClass);
    this.mobileMenu.classList.toggle(this.activeClass);
    this.animateLinks();
  }

  // NOVO: fecha o menu quando o usuário toca em um link
  handleLinkClick(event) {
    if (event.target.closest("a") && this.navList.classList.contains(this.activeClass)) {
      this.handleClick();
    }
  }

  // NOVO: se a tela crescer com o menu aberto, limpa o estado
  handleResize() {
    if (window.innerWidth > 999 && this.navList.classList.contains(this.activeClass)) {
      this.navList.classList.remove(this.activeClass);
      this.mobileMenu.classList.remove(this.activeClass);
      this.navLinks.forEach((link) => (link.style.animation = ""));
    }
  }

  addClickEvent() {
    this.mobileMenu.addEventListener("click", this.handleClick);
    this.navList.addEventListener("click", this.handleLinkClick);
    window.addEventListener("resize", this.handleResize);
  }

  init() {
    if (this.mobileMenu) {
      this.addClickEvent();
    }
    return this;
  }
}

const mobileNavbar = new MobileNavbar(
  ".mobile-menu",
  ".nav-list",
  ".nav-list > li",   // só os <li> diretos (não os ícones aninhados)
);
mobileNavbar.init();