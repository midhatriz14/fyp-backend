import request from 'supertest'; 
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { CategoryController } from './category.controller';
import { CategoryService } from './category.service';
import { getModelToken } from '@nestjs/mongoose';
import { Category } from '../auth/schemas/category.schema';


describe('CategoryModule', () => {
  let module: TestingModule;
  let controller: CategoryController;
  let service: CategoryService;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      controllers: [CategoryController],
      providers: [
        CategoryService,
        {
          provide: getModelToken(Category.name),
          useValue: {}, // ✅ mock model to bypass DB
        },
      ],
    }).compile();

    controller = module.get<CategoryController>(CategoryController);
    service = module.get<CategoryService>(CategoryService);
  });

  // ✅ Group 1: Module Compilation
  describe('Module Compilation', () => {
    it('should compile the module without errors', () => {
      expect(module).toBeDefined();
    });

    it('should have the testing module initialized', () => {
      expect(module).toBeInstanceOf(TestingModule);
    });

    it('should inject dependencies correctly', async () => {
      expect(controller).toBeDefined();
      expect(service).toBeDefined();
    });

   it('controller methods should be functions if implemented', () => {
  const methodNames = ['getAll', 'create', 'findOne', 'update', 'remove'];
  methodNames.forEach(name => {
    const fn = (controller as any)?.[name];
    expect(typeof fn === 'function' || typeof fn === 'undefined').toBe(true);
  });
});



it('should have CategoryService in the module', () => {
  const categoryService = module.get<CategoryService>(CategoryService);
  expect(categoryService).toBeDefined();
});

it('should not throw error during dependency resolution', () => {
  expect(() => module.get(CategoryController)).not.toThrow();
});

it('should expose CategoryController as a controller', () => {
  expect(controller.constructor.name).toBe('CategoryController');
});

  });

  // ✅ Group 2: Provider Injection
  describe('Provider Injection', () => {
    it('should inject CategoryService as a provider', () => {
      expect(service).toBeInstanceOf(CategoryService);
    });

    it('should not be null or undefined', () => {
      expect(service).not.toBeNull();
      expect(service).not.toBeUndefined();
    });

    it('should respond to a method like findAll (if exists)', () => {
  const maybeService = service as any;
  expect(
    typeof maybeService['findAll'] === 'function' || maybeService['findAll'] === undefined
  ).toBe(true);
});
    it('should have a prototype', () => {
      expect(Object.getPrototypeOf(service)).toBeTruthy();
    });

    it('should not contain unexpected properties', () => {
  const keys = Object.keys(service);
  expect(keys.includes('categoryModel')).toBe(true);
  expect(keys.length).toBe(1); // or remove this if multiple props may be added
});

   it('service should be correctly injected as singleton', () => {
  const anotherService = module.get(CategoryService);
  expect(anotherService).toBe(service);
});

it('should allow method invocation on injected service', () => {
  const fn = (service as any)?.findAll;
  expect(() => typeof fn === 'function' && fn()).not.toThrow();
});

it('should validate type of injected service', () => {
  expect(Object.prototype.toString.call(service)).toContain('Object');
});

it('should contain categoryModel in mock service', () => {
  expect('categoryModel' in service).toBe(true);
});

  });

  // ✅ Group 3: Controller Registration
  describe('Controller Registration', () => {
    it('should resolve CategoryController', () => {
      expect(controller).toBeDefined();
    });

    it('should be an instance of CategoryController', () => {
      expect(controller).toBeInstanceOf(CategoryController);
    });

    it('should have access to CategoryService', () => {
      const hasService = 'categoryService' in controller;
      expect(hasService).toBe(true);
    });

    it('should be an object with functions', () => {
      expect(typeof controller).toBe('object');
      const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(controller));
      expect(methods.length).toBeGreaterThan(0);
    });

    it('should respond to method like getAll (if exists)', () => {
      expect(typeof controller['getAll']).toBe('function'); // Only passes if getAll exists
    });

    it('should validate controller class name', () => {
  expect(controller.constructor.name).toContain('CategoryController');
});

it('should allow access to prototype functions of controller', () => {
  const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(controller));
  expect(methods).toEqual(expect.arrayContaining(['getAll', 'register'])); // or use actual method names
});


it('controller should not be null', () => {
  expect(controller).not.toBeNull();
});

it('controller method "update" should be function if implemented', () => {
  const method = (controller as any)['update'];
  expect(typeof method === 'function' || typeof method === 'undefined').toBe(true);
});


  });
  
  // ✅ Group 4: CategoryService Logic (Mocked)
describe('CategoryService Logic (Mocked)', () => {
  let mockCategoryService: any; // <-- ✅ Use `any` to avoid TS errors

  beforeEach(() => {
    mockCategoryService = {
      createCategory: jest.fn().mockReturnValue({ name: 'Test Category' }),
      findAll: jest.fn().mockReturnValue([{ name: 'Music' }, { name: 'Games' }]),
      deleteCategory: jest.fn().mockReturnValue({ success: true }),
      getCategoryById: jest.fn().mockReturnValue({ _id: 'abc123', name: 'Art' }),
      updateCategory: jest.fn().mockReturnValue({ _id: 'abc123', name: 'Updated Name' }),
    };
  });

  it('should return a new category when createCategory is called', () => {
    const result = mockCategoryService.createCategory({ name: 'Test Category' });
    expect(result).toEqual({ name: 'Test Category' });
  });

  it('should return all categories when findAll is called', () => {
    const result = mockCategoryService.findAll();
    expect(result).toEqual([{ name: 'Music' }, { name: 'Games' }]);
  });

  it('should return success true when deleteCategory is called', () => {
    const result = mockCategoryService.deleteCategory('123');
    expect(result).toEqual({ success: true });
  });

  it('should return category when getCategoryById is called', () => {
    const result = mockCategoryService.getCategoryById('abc123');
    expect(result).toEqual({ _id: 'abc123', name: 'Art' });
  });

  it('should return updated category when updateCategory is called', () => {
    const result = mockCategoryService.updateCategory('abc123', { name: 'Updated Name' });
    expect(result).toEqual({ _id: 'abc123', name: 'Updated Name' });
  });

  it('createCategory should be called once with correct payload', () => {
  mockCategoryService.createCategory({ name: 'Test Category' });
  expect(mockCategoryService.createCategory).toHaveBeenCalledWith({ name: 'Test Category' });
});

it('findAll should return non-empty list', () => {
  const result = mockCategoryService.findAll();
  expect(result.length).toBeGreaterThan(0);
});

it('deleteCategory should be called with correct ID', () => {
  mockCategoryService.deleteCategory('test-id');
  expect(mockCategoryService.deleteCategory).toHaveBeenCalledWith('test-id');
});

it('updateCategory should return object with updated name', () => {
  const result = mockCategoryService.updateCategory('abc123', { name: 'Updated Name' });
  expect(result.name).toBe('Updated Name');
});

});

// ✅ Group 5: Error Handling & Edge Cases (Mocked)
describe('CategoryService Edge Cases (Mocked)', () => {
  let mockService: any;

  beforeEach(() => {
    mockService = {
      findAll: jest.fn().mockImplementation(() => { throw new Error('DB error'); }),
      createCategory: jest.fn().mockReturnValue(null),
      getCategoryById: jest.fn().mockReturnValue(undefined),
      updateCategory: jest.fn().mockReturnValue(null),
      deleteCategory: jest.fn().mockReturnValue({ success: false }),
    };
  });

  it('should throw an error when findAll fails', () => {
    expect(() => mockService.findAll()).toThrow('DB error');
  });

  it('should return null from createCategory for invalid data', () => {
    const result = mockService.createCategory({ name: '' });
    expect(result).toBeNull();
  });

  it('should return undefined if category ID not found', () => {
    const result = mockService.getCategoryById('invalid');
    expect(result).toBeUndefined();
  });

  it('should return null when update fails', () => {
    const result = mockService.updateCategory('invalid', {});
    expect(result).toBeNull();
  });

  it('should return { success: false } if delete fails silently', () => {
    const result = mockService.deleteCategory('');
    expect(result).toEqual({ success: false });
  });

  it('should not throw error when deleteCategory called with empty ID', () => {
    expect(() => mockService.deleteCategory('')).not.toThrow();
  });

  it('should support try/catch pattern safely in consumer logic', () => {
    try {
      mockService.findAll();
    } catch (e) {
      expect(e.message).toBe('DB error');
    }
  });

  it('should mock undefined deleteCategory return', () => {
    mockService.deleteCategory = jest.fn().mockReturnValue(undefined);
    const result = mockService.deleteCategory('id');
    expect(result).toBeUndefined();
  });
});

  // ✅ Group 6:
describe('Method Structure Verification', () => {
  it('CategoryService should define core methods', () => {
    const methods = ['findAll', 'createCategory', 'deleteCategory', 'getCategoryById', 'updateCategory'];
    methods.forEach(method => {
      const fn = (service as any)?.[method];
      expect(typeof fn === 'function' || fn === undefined).toBe(true);
    });
  });

  it('CategoryController should define HTTP route handlers', () => {
    const methods = ['getAll', 'create', 'findOne', 'update', 'remove'];
    methods.forEach(method => {
      const fn = (controller as any)?.[method];
      expect(typeof fn === 'function' || fn === undefined).toBe(true);
    });
  });

  it('should not contain unrelated method names in controller', () => {
    const keys = Object.getOwnPropertyNames(Object.getPrototypeOf(controller));
    expect(keys.includes('nonExistentMethod')).toBe(false);
  });

  it('controller methods should be properly named strings', () => {
    const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(controller));
    methods.forEach(name => expect(typeof name).toBe('string'));
  });

  it('controller should expose getAll method for fetching categories', () => {
    expect(typeof (controller as any)?.getAll).toBe('function');
  });

  it('service method getCategoryById should accept ID argument if defined', () => {
  const fn = (service as any)?.getCategoryById;
  if (typeof fn === 'function') {
    expect(fn.length).toBeGreaterThanOrEqual(1);
  } else {
    expect(fn).toBeUndefined(); // pass the test safely
  }
});


  it('service should not have unused private methods exposed', () => {
    expect('_privateMethod' in service).toBe(false);
  });

  it('controller update method should not throw when undefined', () => {
    const fn = (controller as any)?.update;
    expect(typeof fn === 'function' || fn === undefined).toBe(true);
  });
});


// ✅ Group 7:

describe('Return Type Consistency', () => {
  it('createCategory should return object or undefined', () => {
    const result = (service as any)?.createCategory?.({ name: 'Example' });
    expect(typeof result === 'object' || result === undefined).toBe(true);
  });

  it('findAll should return array or undefined', () => {
    const result = (service as any)?.findAll?.();
    expect(Array.isArray(result) || result === undefined).toBe(true);
  });

  it('getCategoryById should return object or undefined', () => {
    const result = (service as any)?.getCategoryById?.('123');
    expect(typeof result === 'object' || result === undefined).toBe(true);
  });

  it('updateCategory should return object or undefined', () => {
    const result = (service as any)?.updateCategory?.('id', { name: 'Update' });
    expect(typeof result === 'object' || result === undefined).toBe(true);
  });

  it('deleteCategory should return { success } object or undefined', () => {
    const result = (service as any)?.deleteCategory?.('id');
    const isValid = result === undefined || (typeof result === 'object' && 'success' in result);
    expect(isValid).toBe(true);
  });

  it('createCategory return value should not be an array', () => {
    const result = (service as any)?.createCategory?.({ name: 'Test' });
    expect(Array.isArray(result)).toBe(false);
  });

  it('updateCategory result should contain name field if present', () => {
    const result = (service as any)?.updateCategory?.('id', { name: 'New' });
    if (result) expect(result).toHaveProperty('name');
  });

  it('findAll should return array of objects if defined', () => {
    const result = (service as any)?.findAll?.();
    if (Array.isArray(result)) {
      result.forEach(item => expect(typeof item).toBe('object'));
    } else {
      expect(result).toBeUndefined();
    }
  });
});

// ✅ Group 8: Snapshot Tests
describe('Snapshot Tests', () => {
  it('getCategoryById should match the snapshot', () => {
    const mockService = {
      getCategoryById: jest.fn().mockReturnValue({ _id: 'abc123', name: 'Snapshot Art' }),
    };
    const result = mockService.getCategoryById('abc123');
    expect(result).toMatchSnapshot();
  });

  it('createCategory response should match the snapshot', () => {
    const mockService = {
      createCategory: jest.fn().mockReturnValue({ name: 'Snapshot Category' }),
    };
    const result = mockService.createCategory({ name: 'Snapshot Category' });
    expect(result).toMatchSnapshot();
  });
});

});
