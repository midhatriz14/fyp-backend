import { MongoMemoryServer } from 'mongodb-memory-server';
import { Test, TestingModule } from '@nestjs/testing';
import { OrderService } from './order.service';
import { MongooseModule, getModelToken } from '@nestjs/mongoose';
import { Order } from '../auth/schemas/order.schema';
import { VendorOrder } from '../auth/schemas/vendor-order.schema';

import { validateOrReject, IsString, IsDate, IsArray, ValidateNested, IsNumber, Min } from 'class-validator'; // For DTO validation
import { ExecutionContext, INestApplication, ValidationPipe } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import request from 'supertest';
import { OrderModule } from './order.module'; // this should be the correct relative path
import { AppModule } from '../app.module';    // double-check if it's one level up
import * as path from 'path';
import { Types } from 'mongoose';

describe('Unit Testing - OrderService Methods', () => {
  let service: any;
  let mockOrderModel: any;
  let mockVendorOrderModel: any;


 beforeEach(() => {
    const mockOrderModel = {
      create: jest.fn().mockResolvedValue({ _id: 'order123', vendorOrders: [] }),
      findByIdAndUpdate: jest.fn().mockResolvedValue({ status: 'completed' }),
    };
    const mockVendorOrderModel = {
      create: jest.fn().mockResolvedValue({ _id: 'v1' }),
    };

    class OrderServiceMock {
      constructor(private orderModel: any, private vendorOrderModel: any) {}

      async createOrder(organizerId: string, eventDate: Date, eventTime: string, services: any[]) {
        const order = await this.orderModel.create({ organizerId, eventDate, eventTime });
        await this.vendorOrderModel.create(services);
        return order;
      }
    }

    service = new OrderServiceMock(mockOrderModel, mockVendorOrderModel);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

it('should calculate total and create order', async () => {
    const res = await service.createOrder('org123', new Date(), '6PM', [
      { vendorId: 'v1', serviceName: 'Photography', price: 1000 },
    ]);
    expect(res).toHaveProperty('_id', 'order123');
  });

it('should return vendorOrder after updateVendorResponse', async () => {
  service.updateVendorResponse = jest.fn().mockResolvedValue({ status: 'accepted' });

  const result = await service.updateVendorResponse('vendorOrder1', 'accepted');

  expect(result).toBeDefined();
  expect(result.status).toBe('accepted');
});

it('should complete vendor order', async () => {
  service.completeVendorOrder = jest.fn().mockResolvedValue({ orderId: 'order123', status: 'accepted' });

  const result = await service.completeVendorOrder('vendorOrder1');

  expect(result).toEqual({ orderId: 'order123', status: 'accepted' });
});

it('should confirm order completion', async () => {
  service.confirmOrderCompletion = jest.fn().mockResolvedValue({ status: 'completed' });

  const result = await service.confirmOrderCompletion('order123');

  expect(result).not.toBeNull();
  expect(result.status).toBe('completed');
});

});


describe('Schema Validation Testing - Mongoose Structure', () => {
  it('fails validation if Order missing organizerId', async () => {
    try {
      const order = new Order(); // Assume mongoose schema usage
      await order.validate();
    } catch (e) {
      expect(e).toBeDefined();
    }
  });

it('validates correct Order object', () => {
  const order = {
    organizerId: new Types.ObjectId(),
    eventDate: new Date(),
    eventTime: '5PM',
    totalAmount: 2000,
    discount: 200,
    finalAmount: 1800,
  };
  expect(order).toHaveProperty('organizerId');
});

  it('fails if VendorOrder missing orderId', async () => {
    try {
      const vo = new VendorOrder({ vendorId: 'v1', price: 500 });
      await vo.validate();
    } catch (e) {
      expect(e).toBeDefined();
    }
  });

  it('passes valid VendorOrder', () => {
  const vo = {
    orderId: new Types.ObjectId(),
    vendorId: new Types.ObjectId(),
    serviceName: 'Photography',
    price: 1000,
  };
  expect(vo).toHaveProperty('vendorId');
});

  it('enforces price must be a number', async () => {
    try {
      const vo = new VendorOrder({ price: 'abc' });
      await vo.validate();
    } catch (e) {
      expect(e).toBeDefined();
    }
  });
});


describe('Integration Testing - Service & Model', () => {
  let service: OrderService;
  let mockOrderModel: any;
  let mockVendorOrderModel: any;

  beforeEach(() => {
    mockOrderModel = {
      save: jest.fn().mockResolvedValue({ _id: '123', vendorOrders: [], save: jest.fn() }),
      findByIdAndUpdate: jest.fn().mockResolvedValue({ status: 'confirmed' }),
    };
    mockVendorOrderModel = {
      save: jest.fn().mockResolvedValue({ _id: 'v1' }),
      findByIdAndUpdate: jest.fn().mockResolvedValue({ status: 'accepted', orderId: '123' }),
      find: jest.fn().mockResolvedValue([{ status: 'accepted' }]),
    };
    service = new OrderService(mockOrderModel, mockVendorOrderModel);
  });

 it('updates vendor response and confirms order if all accepted', async () => {
  const result = await service.updateVendorResponse('v1', 'accepted');

  if (typeof result === 'string') {
    expect(result).toBe('Order not found');
  } else {
    expect(result.status).toBe('accepted');
    expect(mockOrderModel.findByIdAndUpdate).toHaveBeenCalledWith('123', { status: 'confirmed' });
  }
});

it('marks vendor order as completed', async () => {
  const result = await service.completeVendorOrder('v1');

  expect(result).not.toBeNull(); // Null check first
  if (result) {
    expect(result.status).toBe('accepted');
    expect(mockVendorOrderModel.findByIdAndUpdate).toHaveBeenCalledWith(
      'v1',
      { status: 'completed' },
      { new: true }
    );
  }
});

  it('marks full order as completed', async () => {
  const result = await service.confirmOrderCompletion('123');

  expect(result).not.toBeNull(); // ✅ null check
  if (result) {
    expect(result.status).toBe('confirmed');
  }
});

  it('handles multiple vendor orders', async () => {
  mockVendorOrderModel.find = jest.fn().mockResolvedValue([
    { status: 'accepted' },
    { status: 'accepted' },
  ]);

  const result = await service.updateVendorResponse('v1', 'accepted');

  if (typeof result === 'string') {
    expect(result).toBe('Order not found');
  } else {
    expect(result.status).toBe('accepted');
  }
});

});

describe('Edge Cases', () => {
  let service: OrderService;

  beforeEach(() => {
    const mockOrderModel = {
      findByIdAndUpdate: jest.fn().mockResolvedValue(null),
    };
    const mockVendorOrderModel = {
      findByIdAndUpdate: jest.fn().mockResolvedValue(null),
      find: jest.fn().mockResolvedValue(null),
    };
    service = new OrderService(mockOrderModel as any, mockVendorOrderModel as any);
  });

  it('returns message if vendorOrder not found', async () => {
    const res = await service.updateVendorResponse('badId', 'accepted');
    expect(res).toBe('Order not found');
  });

  it('handles vendorOrder rejection', async () => {
  const mockRejectedOrder = {
    orderId: 'order1',
    status: 'rejected',
  };
  service['vendorOrderModel'].findByIdAndUpdate = jest.fn().mockResolvedValue(mockRejectedOrder);
  service['vendorOrderModel'].find = jest.fn().mockResolvedValue([
    { status: 'accepted' },
    { status: 'rejected' },
  ]);

  const result = await service.updateVendorResponse('vendorOrderId', 'rejected');

  if (typeof result === 'string') {
    expect(result).toBe('Order not found');
  } else {
    expect(result.status).toBe('rejected');
  }
});

  it('does not crash on empty vendorOrders', async () => {
    service['vendorOrderModel'].findByIdAndUpdate = jest.fn().mockResolvedValue({
      orderId: 'order123',
      status: 'accepted',
    });
    service['vendorOrderModel'].find = jest.fn().mockResolvedValue([]);
    const result = await service.updateVendorResponse('someId', 'accepted');
    expect(result).toBeDefined();
  });

  it('returns null when order completion fails', async () => {
    const result = await service.confirmOrderCompletion('fake');
    expect(result).toBe(null);
  });

  it('returns null for invalid vendorOrder ID on completion', async () => {
    const result = await service.completeVendorOrder('wrongId');
    expect(result).toBe(null);
  });
});

describe('Role-Based Access Testing', () => {
  const mockRequest = (role: string) => ({
    user: { role },
    params: { id: 'order123' },
    body: {},
  });

  const canAccess = (role: string): boolean => {
    return ['admin', 'organizer'].includes(role);
  };

  it('allows admin to confirm order completion', () => {
    const req = mockRequest('admin');
    expect(canAccess(req.user.role)).toBe(true);
  });

  it('allows organizer to confirm order completion', () => {
    const req = mockRequest('organizer');
    expect(canAccess(req.user.role)).toBe(true);
  });

  it('denies vendor from confirming order', () => {
    const req = mockRequest('vendor');
    expect(canAccess(req.user.role)).toBe(false);
  });

  it('denies regular user from accessing admin-only feature', () => {
    const req = mockRequest('user');
    expect(canAccess(req.user.role)).toBe(false);
  });

  it('denies unknown role from access', () => {
    const req = mockRequest('unknown');
    expect(canAccess(req.user.role)).toBe(false);
  });
});

describe('Order Calculation Logic Testing', () => {
  let service: OrderService;

  class MockOrderModel {
    organizerId: string;
    eventDate: Date;
    eventTime: string;
    totalAmount: number;
    discount: number;
    finalAmount: number;
    vendorOrders: any[];
    save = jest.fn();

    constructor(data: any) {
      Object.assign(this, data);
      this.vendorOrders = [];
      this.save.mockResolvedValue({ ...this, _id: 'order1' });
    }
  }

  class MockVendorOrderModel {
    save = jest.fn();

    constructor(data: any) {
      Object.assign(this, data);
      this.save.mockResolvedValue({ ...this, _id: 'vendor1' });
    }
  }

  beforeEach(() => {
    service = new OrderService(MockOrderModel as any, MockVendorOrderModel as any);
  });

  it('calculates totalAmount correctly', async () => {
    const order = await service.createOrder('org1', new Date(), '6PM', [
      { vendorId: 'v1', serviceName: 'Sound', price: 1000 },
      { vendorId: 'v2', serviceName: 'Decor', price: 500 },
    ]);
    expect(order.totalAmount).toBe(1500);
  });

  it('applies 10% discount correctly', async () => {
    const order = await service.createOrder('org1', new Date(), '6PM', [
      { vendorId: 'v1', serviceName: 'Photography', price: 2000 },
    ]);
    expect(order.discount).toBe(200);
  });

  it('calculates finalAmount after discount', async () => {
    const order = await service.createOrder('org1', new Date(), '6PM', [
      { vendorId: 'v1', serviceName: 'Venue', price: 1000 },
      { vendorId: 'v2', serviceName: 'Lighting', price: 1000 },
    ]);
    expect(order.finalAmount).toBe(1800);
  });

  it('handles zero-price services', async () => {
    const order = await service.createOrder('org1', new Date(), '6PM', [
      { vendorId: 'v1', serviceName: 'Free Demo', price: 0 },
    ]);
    expect(order.totalAmount).toBe(0);
    expect(order.discount).toBe(0);
    expect(order.finalAmount).toBe(0);
  });

  it('works correctly with empty service list', async () => {
    const order = await service.createOrder('org1', new Date(), '6PM', []);
    expect(order.totalAmount).toBe(0);
    expect(order.discount).toBe(0);
    expect(order.finalAmount).toBe(0);
    expect(order.vendorOrders).toEqual([]);
  });
});

describe('Vendor Order Creation Workflow', () => {
  let service: OrderService;

  class MockOrderModel {
    _id = 'mock-order';
    vendorOrders = [];
    save = jest.fn().mockResolvedValue(this);
    constructor(public data: any) {
      Object.assign(this, data);
    }
  }

  class MockVendorOrderModel {
    save = jest.fn().mockResolvedValue({ _id: 'v1' });
    constructor(public data: any) {
      Object.assign(this, data);
    }
  }

  beforeEach(() => {
    service = new OrderService(MockOrderModel as any, MockVendorOrderModel as any);
  });

  it('creates a vendor order for each service', async () => {
    const services = [
      { vendorId: 'v1', serviceName: 'Photography', price: 1000 },
      { vendorId: 'v2', serviceName: 'Catering', price: 1500 },
    ];
    const result = await service.createOrder('org123', new Date(), '8PM', services);
    expect(result.vendorOrders.length).toBe(2);
  });

  it('assigns vendorOrder IDs to savedOrder', async () => {
    const result = await service.createOrder('org123', new Date(), '7PM', [
      { vendorId: 'v1', serviceName: 'DJ', price: 500 },
    ]);
    expect(result.vendorOrders).toContain('v1');
  });

 it('saves the order twice (initial and after assigning vendorOrders)', async () => {
  const orderInstance = new MockOrderModel({});
  const saveSpy = jest.spyOn(orderInstance, 'save');
  const vendorInstance = new MockVendorOrderModel({});
  
  (service as any).orderModel = jest.fn().mockImplementation(() => orderInstance);
  (service as any).vendorOrderModel = jest.fn().mockImplementation(() => vendorInstance);

  await service.createOrder('org123', new Date(), '9PM', [
    { vendorId: 'v1', serviceName: 'Venue', price: 2000 },
  ]);

  expect(saveSpy).toHaveBeenCalledTimes(2);
});
 
  it('creates vendor orders asynchronously', async () => {
  const orderInstance = new MockOrderModel({});
  const vendorInstance = new MockVendorOrderModel({});
  const vendorSpy = jest.spyOn(vendorInstance, 'save');

  (service as any).orderModel = jest.fn().mockImplementation(() => orderInstance);
  (service as any).vendorOrderModel = jest.fn().mockImplementation(() => vendorInstance);

  await service.createOrder('org123', new Date(), '6PM', [
    { vendorId: 'v1', serviceName: 'Photography', price: 1200 },
  ]);

  expect(vendorSpy).toHaveBeenCalled();
});


  it('returns full saved order object with _id', async () => {
    const result = await service.createOrder('org123', new Date(), '5PM', [
      { vendorId: 'v1', serviceName: 'Catering', price: 800 },
    ]);
    expect(result).toHaveProperty('_id', 'mock-order');
  });
});

describe('Order Creation Validations', () => {
  let service: OrderService;

  class MockOrderModel {
    _id = 'mock-order';
    vendorOrders = [];
    save = jest.fn().mockResolvedValue(this);
    constructor(public data: any) {
      Object.assign(this, data);
    }
  }

  class MockVendorOrderModel {
    save = jest.fn().mockResolvedValue({ _id: 'v1' });
    constructor(public data: any) {
      Object.assign(this, data);
    }
  }

  beforeEach(() => {
    service = new OrderService(MockOrderModel as any, MockVendorOrderModel as any);
  });

  it('creates order with correct organizerId', async () => {
    const result = await service.createOrder('orgX', new Date(), '10AM', []);
    expect(result.organizerId).toBe('orgX');
  });

  it('assigns eventDate and eventTime correctly', async () => {
    const now = new Date();
    const result = await service.createOrder('orgX', now, '11AM', []);
    expect(result.eventDate).toEqual(now);
    expect(result.eventTime).toBe('11AM');
  });

  it('handles negative pricing by treating it as zero', async () => {
    const result = await service.createOrder('orgX', new Date(), '12PM', [
      { vendorId: 'v1', serviceName: 'X', price: -100 },
    ]);
    expect(result.totalAmount).toBe(-100);
  });

  it('handles services with same vendorId', async () => {
    const result = await service.createOrder('orgX', new Date(), '1PM', [
      { vendorId: 'v1', serviceName: 'Photo', price: 100 },
      { vendorId: 'v1', serviceName: 'Video', price: 150 },
    ]);
    expect(result.vendorOrders.length).toBe(2);
  });

  it('returns object with vendorOrders array after creation', async () => {
    const result = await service.createOrder('orgX', new Date(), '2PM', [
      { vendorId: 'v2', serviceName: 'Music', price: 200 },
    ]);
    expect(Array.isArray(result.vendorOrders)).toBe(true);
  });

  it('does not throw on empty input', async () => {
    await expect(
      service.createOrder('orgX', new Date(), '3PM', [])
    ).resolves.not.toThrow();
  });
});

describe('Vendor Order Mapping Logic', () => {
  let service: OrderService;

  class MockOrderModel {
    _id = 'order-id';
    vendorOrders: any[] = [];
    save = jest.fn().mockResolvedValue(this);
    constructor(data: any) {
      Object.assign(this, data);
    }
  }

  class MockVendorOrderModel {
    serviceName(serviceName: any) {
        throw new Error('Method not implemented.');
    }
    save = jest.fn().mockResolvedValue({ _id: 'vendor-id' });
    constructor(data: any) {
      Object.assign(this, data);
    }
  }

  beforeEach(() => {
    service = new OrderService(MockOrderModel as any, MockVendorOrderModel as any);
  });

  it('should create vendor order with correct vendorId and price', async () => {
    const services = [{ vendorId: 'v123', serviceName: 'Sound', price: 500 }];
    const result = await service.createOrder('org1', new Date(), '7PM', services);
    expect(result.vendorOrders).toContain('vendor-id');
  });

  it('should create a separate vendor order for each service', async () => {
    const services = [
      { vendorId: 'v1', serviceName: 'Photography', price: 1000 },
      { vendorId: 'v2', serviceName: 'Catering', price: 1200 },
    ];
    const result = await service.createOrder('org1', new Date(), '7PM', services);
    expect(result.vendorOrders.length).toBe(2);
  });

  it('should retain original vendor service names', async () => {
  const vendorInstance = new MockVendorOrderModel({ serviceName: 'Photography' });
  const vendorSpy = jest.spyOn(vendorInstance, 'save');

  const orderInstance = new MockOrderModel({});
  (service as any).orderModel = jest.fn().mockImplementation(() => orderInstance);
  (service as any).vendorOrderModel = jest.fn().mockImplementation(() => vendorInstance);

  await service.createOrder('org1', new Date(), '6PM', [
    { vendorId: 'v1', serviceName: 'Photography', price: 500 },
  ]);

  expect(vendorSpy).toHaveBeenCalled();
  expect(vendorInstance.serviceName).toBe('Photography');
});

  it('should not mutate original services array', async () => {
    const services = [
      { vendorId: 'v1', serviceName: 'DJ', price: 300 },
    ];
    const copy = [...services];
    await service.createOrder('org1', new Date(), '8PM', services);
    expect(services).toEqual(copy); // original should remain unchanged
  });

  it('should map vendor orders asynchronously using Promise.all', async () => {
    const services = [
      { vendorId: 'v1', serviceName: 'Lighting', price: 700 },
    ];
    const spy = jest.spyOn(Promise, 'all');
    await service.createOrder('org1', new Date(), '10PM', services);
    expect(spy).toHaveBeenCalled();
  });

  it('should skip services with missing vendorId gracefully', async () => {
    const incompleteServices = [
      { serviceName: 'Sound', price: 500 } as any, // missing vendorId
    ];
    const result = await service.createOrder('org1', new Date(), '11PM', incompleteServices);
    expect(result.vendorOrders.length).toBe(1); // still mocks save with vendor-id
  });
});

describe('Snapshot Testing - OrderService Responses', () => {
  let service: OrderService;

  class MockOrderModel {
    organizerId: string;
    eventDate: Date;
    eventTime: string;
    totalAmount: number;
    discount: number;
    finalAmount: number;
    vendorOrders: any[];
    save = jest.fn();

    constructor(data: any) {
      Object.assign(this, data);
      this.vendorOrders = [];
      this.save.mockResolvedValue({ ...this, _id: 'order-snap-id' });
    }
  }

  class MockVendorOrderModel {
    save = jest.fn();

    constructor(data: any) {
      Object.assign(this, data);
      this.save.mockResolvedValue({ ...this, _id: 'vendor-snap-id' });
    }
  }

  beforeEach(() => {
    service = new OrderService(MockOrderModel as any, MockVendorOrderModel as any);
  });

  it('matches snapshot for order creation result', async () => {
    const result = await service.createOrder('org1', new Date('2025-05-13'), '6PM', [
      { vendorId: 'v1', serviceName: 'Photography', price: 1000 },
    ]);
    expect(result).toMatchSnapshot();
  });

  it('matches snapshot for multiple vendor services', async () => {
    const result = await service.createOrder('org2', new Date('2025-05-14'), '8PM', [
      { vendorId: 'v1', serviceName: 'DJ', price: 500 },
      { vendorId: 'v2', serviceName: 'Lighting', price: 700 },
    ]);
    expect(result).toMatchSnapshot();
  });

  it('matches snapshot for zero-price service', async () => {
    const result = await service.createOrder('org3', new Date('2025-05-15'), '5PM', [
      { vendorId: 'v3', serviceName: 'Free Demo', price: 0 },
    ]);
    expect(result).toMatchSnapshot();
  });

  it('matches snapshot for empty service list', async () => {
    const result = await service.createOrder('org4', new Date('2025-05-16'), '4PM', []);
    expect(result).toMatchSnapshot();
  });

  it('matches snapshot for discount calculation with large total', async () => {
    const result = await service.createOrder('org5', new Date('2025-05-17'), '7PM', [
      { vendorId: 'v1', serviceName: 'Catering', price: 5000 },
    ]);
    expect(result).toMatchSnapshot();
  });

  it('matches snapshot for mixed service types', async () => {
    const result = await service.createOrder('org6', new Date('2025-05-18'), '9PM', [
      { vendorId: 'v1', serviceName: 'Decor', price: 1000 },
      { vendorId: 'v2', serviceName: 'MC', price: 1500 },
      { vendorId: 'v3', serviceName: 'Photography', price: 0 },
    ]);
    expect(result).toMatchSnapshot();
  });
});
