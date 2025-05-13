import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../app.module';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

describe('OrderController (E2E)', () => {
  let app: INestApplication;
  let mongoServer: MongoMemoryServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    process.env.MONGODB_URI = uri;

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
    await app.close();
  });

  const createdVendorOrderIds: string[] = [];
  const createdOrderIds: string[] = [];

  // ✅ 1–6: Create valid orders and store IDs
  const futureDates = [
    '2025-06-11', '2025-06-12', '2025-06-13',
    '2025-06-14', '2025-06-15', '2025-06-16'
  ];

  futureDates.forEach((date, idx) => {
    it(`POST /orders → should create order ${idx + 1}`, async () => {
      const res = await request(app.getHttpServer())
        .post('/orders')
        .send({
          organizerId: `user${idx}`,
          eventDate: date,
          eventTime: '7:00PM',
          services: [
            { vendorId: `v00${idx}`, serviceName: 'DJ', price: 5000 + idx * 1000 }
          ]
        })
        .expect(201);

      expect(res.body._id || res.body.id).toBeTruthy();
      createdOrderIds.push(res.body._id || res.body.id);
      if (res.body.services && res.body.services[0]?._id) {
        createdVendorOrderIds.push(res.body.services[0]._id);
      } else {
        createdVendorOrderIds.push(`v00${idx}`); // fallback if service doesn't return ID
      }
    });
  });

  
  // ✅ 7–8: Complete full orders using createdOrderIds
  [0, 1].forEach((i) => {
    it(`PATCH /complete-order → order ${i + 1} completed`, async () => {
      const res = await request(app.getHttpServer())
        .patch(`/orders/complete-order/${createdOrderIds[i]}`)
        .expect(200);

      expect(res.body).toBeDefined();
    });
  });

   
});
