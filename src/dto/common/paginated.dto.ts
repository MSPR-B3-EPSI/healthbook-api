import { Type, applyDecorators } from '@nestjs/common';
import {
  ApiExtraModels,
  ApiOkResponse,
  ApiProperty,
  getSchemaPath,
} from '@nestjs/swagger';

/**
 * Generic envelope for any paginated list endpoint.
 *
 * `data` is intentionally left without an `@ApiProperty` here: Swagger cannot
 * resolve the generic `T`, so the concrete item type is wired up per-endpoint
 * via the `ApiPaginatedResponse(Model)` decorator below.
 */
export class PaginatedDto<T> {
  data: T[];

  @ApiProperty({ description: 'Total number of items across all pages' })
  total: number;

  @ApiProperty({ description: 'Current page (1-based)' })
  page: number;

  @ApiProperty({ description: 'Items per page' })
  limit: number;
}

/**
 * Documents a `PaginatedDto<Model>` response for Swagger by composing the
 * envelope schema with the concrete item schema for `data`.
 */
export function ApiPaginatedResponse<TModel extends Type>(model: TModel) {
  return applyDecorators(
    ApiExtraModels(PaginatedDto, model),
    ApiOkResponse({
      schema: {
        allOf: [
          { $ref: getSchemaPath(PaginatedDto) },
          {
            properties: {
              data: {
                type: 'array',
                items: { $ref: getSchemaPath(model) },
              },
            },
          },
        ],
      },
    }),
  );
}
