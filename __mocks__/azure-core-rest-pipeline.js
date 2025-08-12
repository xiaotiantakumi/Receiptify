// Mock for @azure/core-rest-pipeline
module.exports = {
  createPipelineRequest: jest.fn((options) => ({
    url: options?.url || 'mock-url',
    method: options?.method || 'GET',
    headers: options?.headers || {},
    body: options?.body,
    timeout: options?.timeout || 30000,
    withCredentials: false,
    requestId: 'mock-request-id'
  })),
  
  createEmptyPipeline: jest.fn(() => ({
    addPolicy: jest.fn(),
    removePolicy: jest.fn(),
    sendRequest: jest.fn().mockResolvedValue({
      status: 200,
      headers: {},
      request: {},
      bodyAsText: 'mock response'
    })
  })),
  
  createPipelineFromOptions: jest.fn(() => ({
    addPolicy: jest.fn(),
    removePolicy: jest.fn(),
    sendRequest: jest.fn().mockResolvedValue({
      status: 200,
      headers: {},
      request: {},
      bodyAsText: 'mock response'
    })
  })),
  
  bearerTokenAuthenticationPolicy: jest.fn(() => ({
    name: 'bearerTokenAuthenticationPolicy',
    sendRequest: jest.fn()
  })),
  
  retryPolicy: jest.fn(() => ({
    name: 'retryPolicy',
    sendRequest: jest.fn()
  })),
  
  logPolicy: jest.fn(() => ({
    name: 'logPolicy',
    sendRequest: jest.fn()
  })),
  
  redirectPolicy: jest.fn(() => ({
    name: 'redirectPolicy',
    sendRequest: jest.fn()
  })),
  
  userAgentPolicy: jest.fn(() => ({
    name: 'userAgentPolicy',
    sendRequest: jest.fn()
  })),
  
  proxyPolicy: jest.fn(() => ({
    name: 'proxyPolicy',
    sendRequest: jest.fn()
  })),
  
  throttlingRetryPolicy: jest.fn(() => ({
    name: 'throttlingRetryPolicy',
    sendRequest: jest.fn()
  })),
  
  systemErrorRetryPolicy: jest.fn(() => ({
    name: 'systemErrorRetryPolicy',
    sendRequest: jest.fn()
  })),
  
  exponentialRetryPolicy: jest.fn(() => ({
    name: 'exponentialRetryPolicy',
    sendRequest: jest.fn()
  })),
  
  setClientRequestIdPolicy: jest.fn(() => ({
    name: 'setClientRequestIdPolicy',
    sendRequest: jest.fn()
  })),
  
  Pipeline: class MockPipeline {
    constructor() {
      this.policies = [];
    }
    
    addPolicy(policy) {
      this.policies.push(policy);
    }
    
    removePolicy(policyName) {
      this.policies = this.policies.filter(p => p.name !== policyName);
    }
    
    sendRequest(request) {
      return Promise.resolve({
        status: 200,
        headers: {},
        request,
        bodyAsText: 'mock response'
      });
    }
  }
};