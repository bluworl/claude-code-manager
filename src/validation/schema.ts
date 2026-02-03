import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

export class SchemaValidator {
  static toJsonSchema(schema: z.ZodType): any {
    return zodToJsonSchema(schema);
  }

  static validate<T extends z.ZodType>(
    data: unknown,
    schema: T
  ): { success: true; data: z.infer<T> } | { success: false; error: z.ZodError } {
    const result = schema.safeParse(data);

    if (result.success) {
      return { success: true, data: result.data };
    } else {
      return { success: false, error: result.error };
    }
  }
}
