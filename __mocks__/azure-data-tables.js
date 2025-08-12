// Mock for @azure/data-tables
module.exports = {
  TableServiceClient: class MockTableServiceClient {
    static fromConnectionString() {
      return new MockTableServiceClient();
    }
    
    getTableClient(tableName) {
      return {
        createTable: jest.fn().mockResolvedValue({}),
        createEntity: jest.fn().mockResolvedValue({}),
        updateEntity: jest.fn().mockResolvedValue({}),
        upsertEntity: jest.fn().mockResolvedValue({}),
        getEntity: jest.fn().mockResolvedValue({
          partitionKey: 'mock-partition',
          rowKey: 'mock-row',
          data: 'mock-data'
        }),
        listEntities: jest.fn().mockReturnValue({
          [Symbol.asyncIterator]: async function* () {
            yield {
              partitionKey: 'mock-partition',
              rowKey: 'mock-row',
              data: 'mock-data'
            };
          }
        }),
        deleteEntity: jest.fn().mockResolvedValue({})
      };
    }
  },
  
  AzureNamedKeyCredential: class MockAzureNamedKeyCredential {
    constructor(name, key) {
      this.name = name;
      this.key = key;
    }
  },
  
  odata: jest.fn((template, ...values) => template),
  
  TableClient: class MockTableClient {
    constructor(url, credential) {
      this.url = url;
      this.credential = credential;
    }
    
    createTable() {
      return Promise.resolve({});
    }
    
    createEntity(entity) {
      return Promise.resolve({});
    }
    
    updateEntity(entity, mode) {
      return Promise.resolve({});
    }
    
    upsertEntity(entity, mode) {
      return Promise.resolve({});
    }
    
    getEntity(partitionKey, rowKey) {
      return Promise.resolve({
        partitionKey,
        rowKey,
        data: 'mock-data'
      });
    }
    
    listEntities(options) {
      return {
        [Symbol.asyncIterator]: async function* () {
          yield {
            partitionKey: 'mock-partition',
            rowKey: 'mock-row',
            data: 'mock-data'
          };
        }
      };
    }
    
    deleteEntity(partitionKey, rowKey) {
      return Promise.resolve({});
    }
  }
};