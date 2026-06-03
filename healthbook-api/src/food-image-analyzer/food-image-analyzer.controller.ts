import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { FoodImageAnalyzerService } from './food-image-analyzer.service.js';

@Controller()
@UseGuards(JwtAuthGuard)
export class FoodImageAnalyzerController {
  constructor(private readonly foodImageAnalyzerService: FoodImageAnalyzerService) {}

  @Post('analyze')
  @UseInterceptors(FileInterceptor('image'))
  async analyze(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Champ "image" manquant dans le formulaire');
    }
    return this.foodImageAnalyzerService.predict(file);
  }
}
