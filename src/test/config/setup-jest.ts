import '@testing-library/jest-dom';

document.execCommand = jest.fn();
HTMLElement.prototype.scrollTo = jest.fn();