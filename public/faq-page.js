const filter = document.querySelector('.faq-filter');
const query = filter?.querySelector('input');
const empty = filter?.querySelector('[role="status"]');
const groups = [...document.querySelectorAll('.faq-guide-group')].map(section => ({
  section,
  questions: [...section.querySelectorAll('details')].map(card => ({
    card,
    searchText: card.textContent.toLowerCase(),
  })),
}));

if (filter && query && empty) {
  filter.hidden = false;
  query.addEventListener('input', () => {
    const terms = query.value.toLowerCase().trim().split(/\s+/).filter(Boolean);
    let matches = 0;
    for (const { section, questions } of groups) {
      let visible = false;
      for (const { card, searchText } of questions) {
        const match = terms.every(term => searchText.includes(term));
        card.hidden = !match;
        if (match) matches++;
        visible ||= match;
      }
      section.hidden = !visible;
    }
    empty.hidden = matches > 0;
  });
}
