import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Order } from 'src/auth/schemas/order.schema';
import { VendorOrder } from 'src/auth/schemas/vendor-order.schema';

@Injectable()
export class OrderService {
    constructor(
        @InjectModel(Order.name) private readonly orderModel: Model<Order>,
        @InjectModel(VendorOrder.name) private readonly vendorOrderModel: Model<VendorOrder>,
    ) { }

    // Create a new order
    async createOrder(
        organizerId: string,
        eventDate: Date,
        eventTime: string,
        services: { vendorId: string; serviceName: string; price: number }[],
        eventName: string,
        guests: number,
    ): Promise<Order> {
        // Calculate total and final amounts
        const totalAmount = services.reduce((sum, service) => sum + service.price, 0);
        const finalAmount = totalAmount; // Modify this if you want to apply discounts or other adjustments

        // Create the order document
        const order = new this.orderModel({
            organizerId: new Types.ObjectId(organizerId),
            eventDate,
            eventTime,
            eventName,
            guests,
            totalAmount,
            discount: 0, // You can modify this if needed
            finalAmount,
            status: 'pending', // Initial status
        });

        // Save the order document
        const savedOrder = await order.save();

        // Create vendor orders and push the vendorOrder _id to the order's vendorOrders field
        const vendorOrderIds: Types.ObjectId[] = [];
        for (const service of services) {
            const vendorOrder = new this.vendorOrderModel({
                orderId: savedOrder._id,
                vendorId: new Types.ObjectId(service.vendorId),
                serviceName: service.serviceName,
                price: service.price,
                status: 'pending', // Initial vendor order status
            });

            // Save each vendor order and push its _id into the vendorOrders array
            const savedVendorOrder = await vendorOrder.save();
            vendorOrderIds.push(savedVendorOrder._id);
        }

        // Update the order document with the vendorOrder IDs
        savedOrder.vendorOrders = vendorOrderIds;
        await savedOrder.save();

        return savedOrder;
    }


    // Get orders based on type (Organizer or Vendor)
    async getOrders(
        type: string,
        userId: string,
        status?: string,
        limit = 10,
        skip = 0,
    ): Promise<Order[]> {
        const query: any = {
            ...(status && { status }),  // Optional status filter
        };

        // Check type and modify query accordingly
        if (type === 'Organizer') {
            query.organizerId = userId;  // Filter orders by organizerId
        } else if (type === 'Vendor') {
            query.vendorOrders = { $elemMatch: { vendorId: userId } };  // Filter by vendorId in vendorOrders array
        }

        return this.orderModel
            .find(query)
            .skip(skip)
            .limit(limit)
            .populate('organizerId')  // Populate organizer details
            .populate({
                path: 'vendorOrders',  // Populate vendorOrders subdocument
                populate: {
                    path: 'vendorId',  // Populate vendor details inside each vendorOrder
                    model: 'User',  // Specify the 'Vendor' model to populate vendor info
                },
            })
            .exec();
    }




    // Get order stats (pending, processing, completed)
    async getOrderStats() {
        const totalOrders = await this.orderModel.countDocuments();
        const pending = await this.orderModel.countDocuments({ status: 'pending' });
        const processing = await this.orderModel.countDocuments({ status: 'processing' });
        const completed = await this.orderModel.countDocuments({ status: 'completed' });

        return {
            totalOrders,
            pending,
            processing,
            completed,
        };
    }

    // Update the status of an order to "completed"
    async completeOrder(orderId: string): Promise<Order> {
        const order = await this.orderModel.findById(orderId);

        if (!order) {
            throw new NotFoundException(`Order with ID ${orderId} not found`);
        }

        order.status = 'completed';
        return order.save();
    }

    // Update vendor order status (accepted/rejected)
    async updateVendorResponse(vendorOrderId: string, status: 'accepted' | 'rejected', message?: string) {
        const vendorOrder = await this.vendorOrderModel.findById(vendorOrderId);

        if (!vendorOrder) {
            throw new NotFoundException(`Vendor Order with ID ${vendorOrderId} not found`);
        }

        vendorOrder.status = status;
        if (message) {
            vendorOrder.message = message;
        }
        return vendorOrder.save();
    }

    // Mark a vendor order as completed
    async completeVendorOrder(vendorOrderId: string) {
        const vendorOrder = await this.vendorOrderModel.findById(vendorOrderId);

        if (!vendorOrder) {
            throw new NotFoundException(`Vendor Order with ID ${vendorOrderId} not found`);
        }

        vendorOrder.status = 'completed';
        return vendorOrder.save();
    }

    // Delete an order from the database
    async deleteOrder(orderId: string): Promise<any> {
        const order = await this.orderModel.findById(orderId);
        if (!order) {
            throw new NotFoundException(`Order with ID ${orderId} not found`);
        }

        // Delete associated vendor orders
        await this.vendorOrderModel.deleteMany({ orderId });

        return this.orderModel.deleteOne({ _id: orderId });
    }

    async confirmOrderCompletion(orderId: string) {
        return this.orderModel.findByIdAndUpdate(orderId, { status: 'completed' }, { new: true });
    }
}
