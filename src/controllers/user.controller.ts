import {
  Body,
  Controller,
  Delete,
  FileTypeValidator,
  Get,
  MaxFileSizeValidator,
  Param,
  ParseFilePipe,
  ParseUUIDPipe,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { CurrentUserService } from '../auth/services/current-user.service.js';
import { UpdateUserDto } from '../dto/user/update-user.dto.js';
import { UserResponseDto } from '../dto/user/user-response.dto.js';
import { UserService } from '../services/user.service.js';
import { UserModel } from '../generated/prisma/models.js';
import { StorageService } from '../storage/storage.service.js';

const MAX_PICTURE_SIZE = 5 * 1024 * 1024; // 5 MB

@ApiTags('user')
@ApiBearerAuth()
@Controller('user')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly currentUser: CurrentUserService,
    private readonly storage: StorageService,
  ) {}

  @Get('me')
  @ApiOperation({ summary: 'Get the authenticated user' })
  @ApiOkResponse({ type: UserResponseDto })
  async getMe(): Promise<UserResponseDto> {
    const { keycloakId } = await this.currentUser.getDbUser();
    return this.present(await this.userService.getOne(keycloakId));
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update the authenticated user' })
  @ApiOkResponse({ type: UserResponseDto })
  async updateMe(@Body() dto: UpdateUserDto): Promise<UserResponseDto> {
    const { keycloakId } = await this.currentUser.getDbUser();
    return this.present(await this.userService.update(keycloakId, dto));
  }

  @Post('me/picture')
  @ApiOperation({
    summary: 'Upload or replace the profile picture',
    description:
      'Multipart upload (field `file`). Images only (png/jpeg/webp/gif), ' +
      'max 5 MB. Returns the user with a fresh presigned `profilePictureUrl`.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @ApiOkResponse({ type: UserResponseDto })
  @UseInterceptors(FileInterceptor('file'))
  async uploadPicture(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: MAX_PICTURE_SIZE }),
          new FileTypeValidator({ fileType: /^image\/(png|jpe?g|webp|gif)$/ }),
        ],
      }),
    )
    file: Express.Multer.File,
  ): Promise<UserResponseDto> {
    const { keycloakId } = await this.currentUser.getDbUser();
    return this.present(await this.userService.setPicture(keycloakId, file));
  }

  @Delete('me/picture')
  @ApiOperation({ summary: 'Remove the profile picture' })
  @ApiOkResponse({ type: UserResponseDto })
  async deletePicture(): Promise<UserResponseDto> {
    const { keycloakId } = await this.currentUser.getDbUser();
    return this.present(await this.userService.clearPicture(keycloakId));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a user by keycloakId' })
  @ApiOkResponse({ type: UserResponseDto })
  async getUser(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<UserResponseDto> {
    return this.present(await this.userService.getOne(id));
  }

  /** Maps a user to its response shape, resolving the picture to a presigned URL. */
  private async present(user: UserModel): Promise<UserResponseDto> {
    return UserResponseDto.from(
      user,
      await this.storage.presign(user.profileMediaKey),
    );
  }
}
