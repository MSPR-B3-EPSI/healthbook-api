import { Test, TestingModule } from '@nestjs/testing';
import { BadGatewayException, BadRequestException } from '@nestjs/common';
import axios from 'axios';
import { FoodImageAnalyzerService } from './food-image-analyzer.service.js';
import { FoodImageAnalyzerController } from './food-image-analyzer.controller.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';

jest.mock('axios');

const mockFile = {
  buffer: Buffer.from('fake-image'),
  originalname: 'pizza.jpg',
  mimetype: 'image/jpeg',
} as Express.Multer.File;

describe('FoodImageAnalyzerService', () => {
  let service: FoodImageAnalyzerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FoodImageAnalyzerService],
    }).compile();

    service = module.get(FoodImageAnalyzerService);
    jest.clearAllMocks();
  });

  it('appelle AI_SERVICE_URL/predict avec le fichier image', async () => {
    jest.mocked(axios.post).mockResolvedValueOnce({
      data: { predictions: [{ label: 'pizza', score: 0.95 }] },
    });

    const result = await service.predict(mockFile);

    expect(axios.post).toHaveBeenCalledWith(
      expect.stringContaining('/predict'),
      expect.any(Object),
      expect.any(Object),
    );
    expect(result).toEqual({ predictions: [{ label: 'pizza', score: 0.95 }] });
  });

  it('utilise http://ai-service:8000 par défaut si AI_SERVICE_URL non défini', async () => {
    delete process.env.AI_SERVICE_URL;
    jest.mocked(axios.post).mockResolvedValueOnce({ data: {} });

    await service.predict(mockFile);

    expect(axios.post).toHaveBeenCalledWith(
      'http://ai-service:8000/predict',
      expect.any(Object),
      expect.any(Object),
    );
  });

  it('lève BadGatewayException si le service IA est indisponible', async () => {
    jest.mocked(axios.post).mockRejectedValueOnce(new Error('ECONNREFUSED'));

    await expect(service.predict(mockFile)).rejects.toThrow(BadGatewayException);
  });
});

describe('FoodImageAnalyzerController', () => {
  let controller: FoodImageAnalyzerController;
  let service: jest.Mocked<FoodImageAnalyzerService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FoodImageAnalyzerController],
      providers: [
        {
          provide: FoodImageAnalyzerService,
          useValue: { predict: jest.fn() },
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get(FoodImageAnalyzerController);
    service = module.get(FoodImageAnalyzerService);
  });

  it('retourne 400 si aucun fichier n\'est envoyé', async () => {
    await expect(
      controller.analyze(undefined as unknown as Express.Multer.File),
    ).rejects.toThrow(BadRequestException);
  });

  it('délègue à FoodImageAnalyzerService.predict quand un fichier est fourni', async () => {
    const mockResult = { predictions: [{ label: 'sushi', score: 0.88 }] };
    service.predict.mockResolvedValueOnce(mockResult);

    const result = await controller.analyze(mockFile);

    expect(service.predict).toHaveBeenCalledWith(mockFile);
    expect(result).toEqual(mockResult);
  });
});
