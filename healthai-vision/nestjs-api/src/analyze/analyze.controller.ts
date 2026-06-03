import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AnalyzeService } from './analyze.service';

@Controller()
export class AnalyzeController {
  constructor(private readonly analyzeService: AnalyzeService) {}

  @Post('analyze')
  @UseInterceptors(FileInterceptor('image'))
  async analyze(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Champ "image" manquant dans le formulaire');
    }
    return this.analyzeService.predict(file);
  }
}
