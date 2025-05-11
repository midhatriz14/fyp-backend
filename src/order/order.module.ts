import { MongooseModule } from "@nestjs/mongoose";
import { Order, OrderSchema } from "../auth/schemas/order.schema";
import { VendorOrder, VendorOrderSchema } from "../auth/schemas/vendor-order.schema";
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { Module } from '@nestjs/common';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Order.name, schema: OrderSchema },
            { name: VendorOrder.name, schema: VendorOrderSchema },
        ]),
    ],
    controllers: [OrderController],
    providers: [OrderService],
})
export class OrderModule { }
