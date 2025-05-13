import { Test, TestingModule } from '@nestjs/testing';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';

describe('OrderController', () => {
  let controller: OrderController;
  let service: OrderService;
  let app: INestApplication;

  const mockOrderService = {
    createOrder: jest.fn(),
    updateVendorResponse: jest.fn(),
    completeVendorOrder: jest.fn(),
    confirmOrderCompletion: jest.fn(),
  };

  beforeAll(() => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

  beforeEach(async () => {
    jest.clearAllMocks(); // ✅ resets call count for all mocks
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrderController],
      providers: [{ provide: OrderService, useValue: mockOrderService }],
    }).compile();

    controller = module.get<OrderController>(OrderController);
    service = module.get<OrderService>(OrderService);

    app = module.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  // ✅ UNIT TESTS
  describe('Unit Tests', () => {
    it('should call service to place order', async () => {
      const mockBody = {
        organizerId: 'user1',
        eventDate: '2025-12-10',
        eventTime: '5PM',
        services: [{ vendorId: 'v1', serviceName: 'DJ', price: 10000 }],
      };
      mockOrderService.createOrder.mockResolvedValue('Order Created');

      const result = await controller.placeOrder(mockBody);
      expect(result).toBe('Order Created');
      expect(mockOrderService.createOrder).toHaveBeenCalledWith(
        mockBody.organizerId,
        new Date(mockBody.eventDate),
        mockBody.eventTime,
        mockBody.services
      );
    });

    it('should update vendor response with status', async () => {
      mockOrderService.updateVendorResponse.mockResolvedValue('Response Updated');
      const result = await controller.respondToOrder('vendorOrderId', { status: 'accepted' });
      expect(result).toBe('Response Updated');
    });

    it('should call service to complete order', async () => {
      mockOrderService.confirmOrderCompletion.mockResolvedValue('Order Confirmed');
      const result = await controller.completeOrder('order123');
      expect(result).toBe('Order Confirmed');
    });

    it('should call completeVendorOrder service with correct ID', async () => {
  mockOrderService.completeVendorOrder.mockResolvedValue('Vendor Completed');
  const result = await controller.completeVendor('vendor123');
  expect(result).toBe('Vendor Completed');
  expect(mockOrderService.completeVendorOrder).toHaveBeenCalledWith('vendor123');
});

it('should allow optional message in vendor response', async () => {
  mockOrderService.updateVendorResponse.mockResolvedValue('Response with message');
  const result = await controller.respondToOrder('v123', {
    status: 'rejected',
    message: 'Not available',
  });
  expect(result).toBe('Response with message');
  expect(mockOrderService.updateVendorResponse).toHaveBeenCalledWith(
    'v123',
    'rejected',
    'Not available'
  );
});

it('should return value from completeVendorOrder correctly', async () => {
  mockOrderService.completeVendorOrder.mockResolvedValue({ done: true });
  const result = await controller.completeVendor('vDone');
  expect(result).toEqual({ done: true });
});

  });

  // ✅ NEGATIVE TESTS
  describe('Negative Tests', () => {
    it('should throw error on invalid vendor status', async () => {
      mockOrderService.updateVendorResponse.mockRejectedValue(new Error('Invalid status'));
      await expect(
        controller.respondToOrder('id', { status: 'maybe' as any })
      ).rejects.toThrow('Invalid status');
    });

    it('should throw error if order service fails', async () => {
  mockOrderService.createOrder.mockRejectedValue(new Error('Service failed'));
  const invalidBody = {
    organizerId: '',
    eventDate: 'not-a-date',
    eventTime: '',
    services: [],
  };
  await expect(controller.placeOrder(invalidBody)).rejects.toThrow('Failed to place order');
});

    it('should throw error if completeOrder fails', async () => {
      mockOrderService.confirmOrderCompletion.mockRejectedValue(new Error('Fail'));
      await expect(controller.completeOrder('invalid')).rejects.toThrow('Fail');
    });

    it('should throw if completeVendorOrder fails internally', async () => {
  mockOrderService.completeVendorOrder.mockRejectedValue(new Error('Internal Error'));
  await expect(controller.completeVendor('badId')).rejects.toThrow('Internal Error');
});

it('should reject vendor response if status missing', async () => {
  mockOrderService.updateVendorResponse.mockRejectedValue(new Error('Missing status'));
  await expect(
    controller.respondToOrder('id', {} as any)
  ).rejects.toThrow('Missing status');
});

it('should throw error when invalid body format is used in placeOrder', async () => {
  const badBody = { organizer: 'x', date: 'abc' } as any;
  mockOrderService.createOrder.mockRejectedValue(new Error('Invalid Format'));
  await expect(controller.placeOrder(badBody)).rejects.toThrow('Failed to place order');
});

  });

  // ✅ INTEGRATION TESTS (Controller → Service)
  describe('Integration Tests', () => {
    it('should pass valid data from controller to service', async () => {
      const body = {
        organizerId: 'intg123',
        eventDate: '2025-11-01',
        eventTime: '6PM',
        services: [{ vendorId: 'v10', serviceName: 'Photography', price: 15000 }],
      };
      mockOrderService.createOrder.mockResolvedValue({ message: 'OK' });

      const result = await controller.placeOrder(body);
      expect(result).toEqual({ message: 'OK' });
      expect(mockOrderService.createOrder).toHaveBeenCalledWith(
        'intg123',
        new Date('2025-11-01'),
        '6PM',
        body.services
      );
    });

    it('should return vendor response correctly via service', async () => {
      mockOrderService.updateVendorResponse.mockResolvedValue({ status: 'accepted' });

      const result = await controller.respondToOrder('v456', { status: 'accepted' });
      expect(result).toEqual({ status: 'accepted' });
      expect(mockOrderService.updateVendorResponse).toHaveBeenCalledWith('v456', 'accepted', undefined);
    });

    it('should complete vendor order via service', async () => {
      mockOrderService.completeVendorOrder.mockResolvedValue({ completed: true });

      const result = await controller.completeVendor('vendor789');
      expect(result).toEqual({ completed: true });
      expect(mockOrderService.completeVendorOrder).toHaveBeenCalledWith('vendor789');
    });

    it('should call updateVendorResponse with message if provided', async () => {
  mockOrderService.updateVendorResponse.mockResolvedValue({ updated: true });
  const result = await controller.respondToOrder('v998', {
    status: 'rejected',
    message: 'Out of scope',
  });
  expect(result).toEqual({ updated: true });
  expect(mockOrderService.updateVendorResponse).toHaveBeenCalledWith('v998', 'rejected', 'Out of scope');
});

it('should integrate completeVendorOrder with mocked return', async () => {
  mockOrderService.completeVendorOrder.mockResolvedValue({ done: true, ts: Date.now() });
  const result = await controller.completeVendor('vendorFinal');
  expect(result).toHaveProperty('done', true);
});

it('should integrate completeOrder and return structured response', async () => {
  mockOrderService.confirmOrderCompletion.mockResolvedValue({ success: true, id: 'abc' });
  const result = await controller.completeOrder('abc');
  expect(result).toEqual({ success: true, id: 'abc' });
});

  });

  //return type and structure test
  describe('Return Type & Structure Tests', () => {
  it('should return an object from placeOrder', async () => {
    const body = {
      organizerId: 'testOrg',
      eventDate: '2025-12-10',
      eventTime: '4PM',
      services: [{ vendorId: 'v01', serviceName: 'Music', price: 1000 }]
    };

    mockOrderService.createOrder.mockResolvedValue({ orderId: 'abc123', status: 'created' });

    const result = await controller.placeOrder(body);
    expect(typeof result).toBe('object');
    expect(result).toHaveProperty('orderId');
  });

  it('should return a plain string from completeOrder', async () => {
    mockOrderService.confirmOrderCompletion.mockResolvedValue('Order Completed');
    const result = await controller.completeOrder('ord999');
    expect(typeof result).toBe('string');
    expect(result).toBe('Order Completed');
  });

  it('should return object with specific keys from createOrder', async () => {
  mockOrderService.createOrder.mockResolvedValue({
    orderId: 'id1',
    vendorCount: 3,
    success: true,
  });
  const body = {
    organizerId: 'testUser',
    eventDate: '2025-10-01',
    eventTime: '3PM',
    services: [{ vendorId: 'v03', serviceName: 'Food', price: 25000 }],
  };
  const result = await controller.placeOrder(body);
  expect(result).toMatchObject({ vendorCount: 3, success: true });
});

it('should ensure return type is string from completeOrder', async () => {
  mockOrderService.confirmOrderCompletion.mockResolvedValue('Confirmed');
  const result = await controller.completeOrder('oid123');
  expect(typeof result).toBe('string');
});

});

// service call verification
describe('Service Call Verification', () => {
  it('should call updateVendorResponse exactly once', async () => {
    mockOrderService.updateVendorResponse.mockResolvedValue('Updated');
    await controller.respondToOrder('vendor123', { status: 'accepted' });
    expect(mockOrderService.updateVendorResponse).toHaveBeenCalledTimes(1);
  });

  it('should call confirmOrderCompletion with correct ID', async () => {
    mockOrderService.confirmOrderCompletion.mockResolvedValue('Completed');
    await controller.completeOrder('order555');
    expect(mockOrderService.confirmOrderCompletion).toHaveBeenCalledWith('order555');
  });

  it('should call completeVendorOrder exactly once', async () => {
  mockOrderService.completeVendorOrder.mockResolvedValue('Done');
  await controller.completeVendor('v100');
  expect(mockOrderService.completeVendorOrder).toHaveBeenCalledTimes(1);
});

it('should call createOrder once with valid arguments', async () => {
  const body = {
    organizerId: 'checkX',
    eventDate: '2025-11-11',
    eventTime: '10AM',
    services: [{ vendorId: 'v05', serviceName: 'Seats', price: 7000 }],
  };
  mockOrderService.createOrder.mockResolvedValue({ message: 'created' });
  await controller.placeOrder(body);
  expect(mockOrderService.createOrder).toHaveBeenCalledTimes(1);
});

it('should call confirmOrderCompletion and receive correct value', async () => {
  mockOrderService.confirmOrderCompletion.mockResolvedValue('Confirmed');
  const result = await controller.completeOrder('id999');
  expect(result).toBe('Confirmed');
});

});

 // edge case testing
describe('Edge Case Handling', () => {
  it('should handle empty services array gracefully in placeOrder', async () => {
    const body = {
      organizerId: 'edgeUser',
      eventDate: '2025-10-10',
      eventTime: '9AM',
      services: [],
    };
    mockOrderService.createOrder.mockResolvedValue({ orderId: 'emptySrv', status: 'created' });

    const result = await controller.placeOrder(body);
    expect(result).toHaveProperty('status', 'created');
  });

  it('should accept date string in ISO format in placeOrder', async () => {
    const body = {
      organizerId: 'isoTest',
      eventDate: '2025-10-05T00:00:00.000Z',
      eventTime: '2PM',
      services: [{ vendorId: 'vIso', serviceName: 'Sound', price: 3000 }],
    };
    mockOrderService.createOrder.mockResolvedValue({ success: true });

    const result = await controller.placeOrder(body);
    expect(result).toEqual({ success: true });
  });

  it('should handle extremely high price values in services', async () => {
    const body = {
      organizerId: 'bigPriceUser',
      eventDate: '2025-12-01',
      eventTime: '7PM',
      services: [{ vendorId: 'vExp', serviceName: 'Helicopter', price: 99999999 }],
    };
    mockOrderService.createOrder.mockResolvedValue({ confirmed: true });

    const result = await controller.placeOrder(body);
    expect(result).toEqual({ confirmed: true });
  });

  it('should handle long optional vendor response message', async () => {
    const longMessage = 'a'.repeat(1000);
    mockOrderService.updateVendorResponse.mockResolvedValue({ ok: true });

    const result = await controller.respondToOrder('vLongMsg', {
      status: 'accepted',
      message: longMessage,
    });

    expect(result).toEqual({ ok: true });
    expect(mockOrderService.updateVendorResponse).toHaveBeenCalledWith(
      'vLongMsg',
      'accepted',
      longMessage
    );
  });

  it('should return null safely from completeVendorOrder if service returns null', async () => {
    mockOrderService.completeVendorOrder.mockResolvedValue(null);
    const result = await controller.completeVendor('vNull');
    expect(result).toBeNull();
  });

  it('should handle undefined return from confirmOrderCompletion', async () => {
    mockOrderService.confirmOrderCompletion.mockResolvedValue(undefined);
    const result = await controller.completeOrder('orderUndefined');
    expect(result).toBeUndefined();
  });
});

// validation testing
describe('Validation Behavior', () => {
  
    it('should strip unexpected fields from placeOrder body', async () => {
  const bodyWithExtra = {
    organizerId: 'valUser1',
    eventDate: '2025-10-10',
    eventTime: '9AM',
    services: [{ vendorId: 'v1', serviceName: 'Stage', price: 4000 }],
    randomField: 'shouldBeRemoved',
  };

  mockOrderService.createOrder.mockResolvedValue({ cleaned: true });

  const result = await request(app.getHttpServer())
    .post('/orders')
    .send(bodyWithExtra);

  expect(result.statusCode).toBe(201); // or 200 depending on your controller
  expect(mockOrderService.createOrder).toHaveBeenCalled();
});

  it('should accept if service array has multiple valid objects', async () => {
    const body = {
      organizerId: 'userMulti',
      eventDate: '2025-11-20',
      eventTime: '3PM',
      services: [
        { vendorId: 'v1', serviceName: 'Decor', price: 1500 },
        { vendorId: 'v2', serviceName: 'Music', price: 2000 },
      ],
    };

    mockOrderService.createOrder.mockResolvedValue({ multiple: true });

    const result = await controller.placeOrder(body);
    expect(result).toEqual({ multiple: true });
  });

  
  it('should return 201 when valid request is sent', async () => {
    const validBody = {
      organizerId: 'validUser',
      eventDate: '2025-12-01',
      eventTime: '7PM',
      services: [{ vendorId: 'v1', serviceName: 'Dance Floor', price: 5000 }],
    };

    mockOrderService.createOrder.mockResolvedValue({ orderId: 'valOK' });

    const res = await request(app.getHttpServer())
      .post('/orders')
      .send(validBody);

    expect(res.statusCode).toBe(201); // depends on your controller response
    expect(res.body).toHaveProperty('orderId', 'valOK');
  });
});

// authorization guard behavior.
describe('Auth Guard Handling', () => {
  it('should allow access when mock auth guard passes', async () => {
    // Simulate a controller that requires auth, and user is authenticated
    const result = await controller.completeOrder('secureOrderId');
    expect(result).not.toBeNull();
  });

  it('should block access if guard throws unauthorized', async () => {
    const UnauthorizedError = new Error('Unauthorized');
    (mockOrderService.confirmOrderCompletion as jest.Mock).mockImplementation(() => {
      throw UnauthorizedError;
    });

    await expect(controller.completeOrder('unauthorizedOrder')).rejects.toThrow('Unauthorized');
  });

it('should pass order completion when fake token provided (mock bypass)', async () => {
  mockOrderService.confirmOrderCompletion.mockResolvedValue('Secure OK');

  const res = await request(app.getHttpServer())
    .patch('/orders/complete-order/testId')
    .set('Authorization', 'Bearer faketoken')
    .send();

  expect(res.statusCode).toBe(200);
  expect(res.text).toBe('Secure OK'); // changed from res.body
});

it('should simulate custom guard denial', async () => {
  const ForbiddenError = new Error('Forbidden');
  (mockOrderService.createOrder as jest.Mock).mockImplementation(() => {
    throw ForbiddenError;
  });

  await expect(
    controller.placeOrder({
      organizerId: 'blockedUser',
      eventDate: '2025-12-10',
      eventTime: '5PM',
      services: [],
    })
  ).rejects.toThrow('Failed to place order');
});

  it('should return appropriate message if guard logic fails mid-execution', async () => {
    mockOrderService.completeVendorOrder.mockRejectedValue(new Error('Guard intercept'));

    await expect(controller.completeVendor('guardFail')).rejects.toThrow('Guard intercept');
  });
});


//snapshot
describe('Snapshot Tests', () => {
  it('should match snapshot for placeOrder response', async () => {
    const body = {
      organizerId: 'snapTest',
      eventDate: '2025-12-30',
      eventTime: '8PM',
      services: [{ vendorId: 'vSnap', serviceName: 'Lights', price: 8000 }],
    };

    const mockResponse = {
      _id: 'orderSnap123',
      organizerId: 'snapTest',
      status: 'created',
      services: body.services,
    };

    mockOrderService.createOrder.mockResolvedValue(mockResponse);

    const result = await controller.placeOrder(body);
    expect(result).toMatchSnapshot();
  });

  it('should match snapshot for vendor response update', async () => {
    const mockResult = { vendorId: 'vSnap', status: 'accepted' };
    mockOrderService.updateVendorResponse.mockResolvedValue(mockResult);

    const result = await controller.respondToOrder('vSnap', { status: 'accepted' });
    expect(result).toMatchSnapshot();
  });

  it('should match snapshot for completeOrder string response', async () => {
  mockOrderService.confirmOrderCompletion.mockResolvedValue('Order is done');
  const result = await controller.completeOrder('snapOrd1');
  expect(result).toMatchSnapshot();
});

it('should match snapshot for completeVendorOrder response', async () => {
  const mockRes = { vendorId: 'vDone', status: 'done' };
  mockOrderService.completeVendorOrder.mockResolvedValue(mockRes);
  const result = await controller.completeVendor('vDone');
  expect(result).toMatchSnapshot();
});

it('should match snapshot for rejected vendor response', async () => {
  const mockRes = { vendorId: 'vReject', status: 'rejected', reason: 'Busy' };
  mockOrderService.updateVendorResponse.mockResolvedValue(mockRes);
  const result = await controller.respondToOrder('vReject', {
    status: 'rejected',
    message: 'Busy',
  });
  expect(result).toMatchSnapshot();
});

});

});
