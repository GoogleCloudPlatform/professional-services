import('./style.css').then(module => {
  console.log(module['default'] ? 'ok' : 'error');
});
