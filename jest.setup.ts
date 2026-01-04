import '@testing-library/jest-dom'

// Mock URL methods for JSDOM
global.URL.createObjectURL = jest.fn(() => 'blob:mock-url');
global.URL.revokeObjectURL = jest.fn();