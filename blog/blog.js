(function () {
  const themeToggle = document.getElementById('themeToggle');
  const searchInput = document.getElementById('articleSearch');
  const articleCards = Array.from(document.querySelectorAll('[data-article-card]'));
  const emptySearch = document.getElementById('emptySearch');
  const copyLinkButton = document.getElementById('copyLinkButton');
  const printButton = document.getElementById('printButton');
  const topicFilters = Array.from(document.querySelectorAll('[data-topic-filter]'));

  function applyTheme(theme) {
    document.body.classList.toggle('blog-theme-dark', theme === 'dark');
    document.body.classList.toggle('blog-theme-light', theme === 'light');
  }

  try {
    const savedTheme = localStorage.getItem('sirgangulyBlogTheme');
    if (savedTheme === 'dark' || savedTheme === 'light') {
      applyTheme(savedTheme);
    }
  } catch (error) {}

  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const nextTheme = document.body.classList.contains('blog-theme-dark') ? 'light' : 'dark';
      applyTheme(nextTheme);
      try {
        localStorage.setItem('sirgangulyBlogTheme', nextTheme);
      } catch (error) {}
    });
  }

  function filterArticles(query) {
    const normalizedQuery = query.trim().toLowerCase();
    let visibleCount = 0;

    articleCards.forEach((card) => {
      const haystack = [
        card.dataset.title,
        card.dataset.category,
        card.dataset.tags,
        card.textContent
      ].join(' ').toLowerCase();

      const isVisible = !normalizedQuery || haystack.includes(normalizedQuery);
      card.hidden = !isVisible;
      if (isVisible) visibleCount += 1;
    });

    if (emptySearch) {
      emptySearch.hidden = visibleCount > 0;
    }
  }

  if (searchInput) {
    searchInput.addEventListener('input', () => filterArticles(searchInput.value));
  }

  topicFilters.forEach((filter) => {
    filter.addEventListener('click', (event) => {
      event.preventDefault();
      const topic = filter.dataset.topicFilter || '';
      if (searchInput) {
        searchInput.value = topic;
        searchInput.focus();
      }
      filterArticles(topic);
      document.getElementById('latestArticles')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  if (copyLinkButton) {
    copyLinkButton.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(window.location.href);
        copyLinkButton.innerHTML = '<i class="fas fa-check" aria-hidden="true"></i> Copied';
        setTimeout(() => {
          copyLinkButton.innerHTML = '<i class="fas fa-link" aria-hidden="true"></i> Copy link';
        }, 1800);
      } catch (error) {
        window.prompt('Copy this link:', window.location.href);
      }
    });
  }

  if (printButton) {
    printButton.addEventListener('click', () => window.print());
  }
})();
