import { Controller, Post, Body, Patch, Param } from "@nestjs/common";
import { OrderService } from "./order.service";

@Controller('orders')
export class OrderController {
    constructor(private readonly orderService: OrderService) { }

    @Post()
    async placeOrder(@Body() body: {
        organizerId: string;
        eventDate: string;
        eventTime: string;
        services: {
            vendorId: string;
            serviceName: string;
            price: number;
        }[];
    }) {
        return this.orderService.createOrder(
            body.organizerId,
            new Date(body.eventDate),
            body.eventTime,
            body.services
        );
    }

    @Patch('vendor-response/:id')
    async respondToOrder(
        @Param('id') vendorOrderId: string,
        @Body() body: { status: 'accepted' | 'rejected'; message?: string },
    ) {
        return this.orderService.updateVendorResponse(vendorOrderId, body.status, body.message);
    }

    @Patch('complete-vendor/:id')
    async completeVendor(@Param('id') vendorOrderId: string) {
        return this.orderService.completeVendorOrder(vendorOrderId);
    }

    @Patch('complete-order/:id')
    async completeOrder(@Param('id') orderId: string) {
        return this.orderService.confirmOrderCompletion(orderId);
    }
}
