import { Injectable, BadGatewayException } from '@nestjs/common';
import axios from 'axios';
import FormData from 'form-data';

@Injectable()
export class FoodImageAnalyzerService {
  private readonly aiServiceUrl =
    process.env.AI_SERVICE_URL || 'http://ai-service:8000';

  async predict(file: Express.Multer.File) {
    const form = new FormData();
    form.append('file', file.buffer, {
      filename: file.originalname,
      contentType: file.mimetype,
    });

    try {
      const { data } = await axios.post(
        `${this.aiServiceUrl}/predict`,
        form,
        { headers: form.getHeaders() },
      );
      return data;
    } catch {
      throw new BadGatewayException('Le service IA est indisponible');
    }
  }
}
