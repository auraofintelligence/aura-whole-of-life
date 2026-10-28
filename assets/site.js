/* Optional enhancements. Reading and navigation work without JavaScript. */
(() => {
  'use strict';
  const menu = document.querySelector('.site-menu');
  if (menu) {
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && menu.open) {
        menu.open = false;
        menu.querySelector('summary').focus();
      }
    });
    document.addEventListener('click', event => {
      if (!menu.contains(event.target)) menu.open = false;
    });
  }
  const search = document.querySelector('#page-search');
  if (search) {
    const tools = document.querySelector('.search-tools');
    const items = [...document.querySelectorAll('[data-page-search]')];
    const status = document.querySelector('#search-status');
    const update = () => {
      const words = search.value.toLowerCase().trim().split(/\s+/).filter(Boolean);
      let visible = 0;
      for (const item of items) {
        item.hidden = !words.every(word => item.dataset.pageSearch.toLowerCase().includes(word));
        if (!item.hidden) visible++;
      }
      status.textContent = `${visible} of ${items.length} pages`;
      document.querySelector('#no-results').hidden = visible !== 0;
    };
    tools.hidden = false;
    search.addEventListener('input', update);
    update();
  }
})();
