import '@testing-library/jest-dom';

// Mock HTMLMediaElement methods not implemented by jsdom
window.HTMLMediaElement.prototype.load = () => {};
window.HTMLMediaElement.prototype.play = () => Promise.resolve();
window.HTMLMediaElement.prototype.pause = () => {};
