import { Controller, Post, Body, Patch, Param, Get, Delete, Query } from "@nestjs/common";
import { OrderService } from "./order.service";

@Controller('orders')
export class OrderController {
    constructor(private readonly orderService: OrderService) { }

    @Post()
    async placeOrder(@Body() body: {
        organizerId: string;
        eventDate: string;
        eventTime: string;
        eventName: string;
        guests: number;
        services: {
            vendorId: string;
            serviceName: string;
            price: number;
        }[];
    }) {
        try {
            console.log(body.eventName, body.services)
            // Call the service to create the order
            const order = await this.orderService.createOrder(
                body.organizerId,
                new Date(body.eventDate),
                body.eventTime,
                body.services,
                body.eventName,
                body.guests,
            );
            return order;
        } catch (error) {
            console.error('Error placing order:', error);
            throw new Error('Failed to place order');
        }
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

    // Get all orders with status filtering and userId
    @Get()
    async getOrders(
        @Query('userId') userId: string,  // Add userId parameter
        @Query('status') status?: string,
        @Query('limit') limit = 10,
        @Query('skip') skip = 0,
    ) {
        return this.orderService.getOrders(userId, status, limit, skip);  // Pass userId to service
    }


    // Get order stats (pending, processing, completed)
    @Get('stats')
    async getOrderStats() {
        return this.orderService.getOrderStats();
    }

    // Delete an order
    @Delete(':id')
    async deleteOrder(@Param('id') orderId: string) {
        return this.orderService.deleteOrder(orderId);
    }
}
