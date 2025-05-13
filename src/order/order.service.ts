import { Model } from "mongoose";
import { VendorOrder } from "../auth/schemas/vendor-order.schema";
import { Order } from "../auth/schemas/order.schema";
import { Injectable } from "@nestjs/common";
import { InjectModel } from '@nestjs/mongoose';

@Injectable()
export class OrderService {
    constructor(
        @InjectModel(Order.name) private orderModel: Model<Order>,
        @InjectModel(VendorOrder.name) private vendorOrderModel: Model<VendorOrder>,
    ) { }

    async createOrder(
        organizerId: string,
        eventDate: Date,
        eventTime: string,
        services: {
            vendorId: string;
            serviceName: string;
            price: number;
        }[],
        eventName: string,
        guests: number,
    ) {
        const totalAmount = services.reduce((sum, s) => sum + s.price, 0);
        const discount = totalAmount * 0.1; // Apply a 10% discount
        const finalAmount = totalAmount - discount;

        // Create the main order
        const order = new this.orderModel({
            organizerId,
            eventDate,
            eventTime,
            totalAmount,
            discount,
            finalAmount,
            eventName,
            guests
        });

        const savedOrder = await order.save();

        // Create vendor orders for each service
        const vendorOrders = await Promise.all(
            services.map(async (service) => {
                const vendorOrder = new this.vendorOrderModel({
                    orderId: savedOrder._id,
                    vendorId: service.vendorId,
                    serviceName: service.serviceName,
                    price: service.price,
                });
                return vendorOrder.save();
            })
        );

        savedOrder.vendorOrders = vendorOrders.map((vo) => vo._id);
        await savedOrder.save();

        return savedOrder;
    }

    async updateVendorResponse(vendorOrderId: string, status: 'accepted' | 'rejected', message?: string) {
        const vendorOrder = await this.vendorOrderModel.findByIdAndUpdate(
            vendorOrderId,
            {
                status,
                message,
                confirmationTime: new Date(),
            },
            { new: true },
        );

        if (!vendorOrder) {
            return "Order not found";
        }

        const vendorOrders = await this.vendorOrderModel.find({ orderId: vendorOrder.orderId });
        const allAccepted = vendorOrders.every((vo) => vo.status === 'accepted');

        if (allAccepted) {
            await this.orderModel.findByIdAndUpdate(vendorOrder.orderId, { status: 'confirmed' });
        }

        return vendorOrder;
    }

    async completeVendorOrder(vendorOrderId: string) {
        return this.vendorOrderModel.findByIdAndUpdate(vendorOrderId, { status: 'completed' }, { new: true });
    }

    async confirmOrderCompletion(orderId: string) {
        return this.orderModel.findByIdAndUpdate(orderId, { status: 'completed' }, { new: true });
    }
}
