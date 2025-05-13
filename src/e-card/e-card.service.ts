import { Injectable } from '@nestjs/common';
import { OpenAI } from 'openai';

@Injectable()
export class EcardService {
    private openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    async generateEcard(data: { eventType: string, name: string, date: string, venue: string, theme: string }) {
        const { eventType, name, date, venue, theme } = data;

        const messagePrompt = `Create a short and elegant event invitation message for a ${eventType} on ${date} at ${venue}, hosted by ${name}.`;

        const messageResult = await this.openai.chat.completions.create({
            model: 'gpt-4',
            messages: [{ role: 'user', content: messagePrompt }],
        });

        const imagePrompt = `A beautiful ${theme}-style e-card design for a ${eventType}`;
        const imageResult = await this.openai.images.generate({
            prompt: imagePrompt,
            n: 1,
            size: '512x512',
        });
        if (!imageResult || !imageResult.data) {
            return;
        }
        return {
            message: messageResult.choices[0].message.content,
            image: imageResult.data[0].url,
        };
    }
}
