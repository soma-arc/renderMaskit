import Renderer from './renderer.js';

window.addEventListener('load', async () => {
    const renderer = new Renderer(1024, 1024);
    renderer.render();
});

