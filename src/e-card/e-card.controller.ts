import { Body, Controller, Post } from '@nestjs/common';
import { EcardService } from './e-card.service';

@Controller('ecard')
export class EcardController {
    constructor(private readonly ecardService: EcardService) { }

    @Post('generate')
    async generateEcard(@Body() body: { eventType: string, name: string, date: string, venue: string, theme: string }) {
        return this.ecardService.generateEcard(body);
    }
}
