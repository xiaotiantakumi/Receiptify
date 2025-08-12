// Mock for @azure/storage-blob
module.exports = {
  BlobServiceClient: class MockBlobServiceClient {
    static fromConnectionString() {
      return new MockBlobServiceClient();
    }
    
    getContainerClient() {
      return {
        createIfNotExists: jest.fn(),
        generateSasUrl: jest.fn(() => 'mock-sas-url'),
        getBlobClient: jest.fn(() => ({
          url: 'mock-blob-url',
          generateSasUrl: jest.fn(() => 'mock-blob-sas-url'),
        })),
      };
    }
  },
  
  StorageSharedKeyCredential: class MockStorageSharedKeyCredential {
    constructor(accountName, accountKey) {
      this.accountName = accountName;
      this.accountKey = accountKey;
    }
  },
  
  BlobSASPermissions: {
    parse: jest.fn(() => ({ write: true, read: true })),
  },
  
  generateBlobSASQueryParameters: jest.fn(() => ({
    toString: () => 'mock-sas-params',
  })),
};