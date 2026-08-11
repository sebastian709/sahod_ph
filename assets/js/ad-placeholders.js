function createAdvertisementPlaceholder(className) {
  const placeholder = document.createElement('div');
  placeholder.className = `ad-slot ${className}`;
  placeholder.setAttribute('aria-label', 'Advertisement');
  placeholder.textContent = 'Advertisement';
  return placeholder;
}

const siteHeader = document.querySelector('.site-header');
const siteFooter = document.querySelector('footer');

if (siteHeader) {
  siteHeader.insertAdjacentElement('afterend', createAdvertisementPlaceholder('ad-slot--below-header'));
}

if (siteFooter) {
  siteFooter.insertAdjacentElement('beforebegin', createAdvertisementPlaceholder('ad-slot--bottom'));
}
