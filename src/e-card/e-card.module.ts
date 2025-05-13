import { Module } from '@nestjs/common';
import { EcardController } from './e-card.controller';
import { EcardService } from './e-card.service';

@Module({
    controllers: [EcardController],
    providers: [EcardService],
})
export class EcardModule { }
