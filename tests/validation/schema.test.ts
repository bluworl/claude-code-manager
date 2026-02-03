import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { SchemaValidator } from '../../src/validation/schema';

describe('SchemaValidator', () => {
  it('should convert Zod schema to JSON Schema', () => {
    const zodSchema = z.object({
      name: z.string(),
      age: z.number()
    });

    const jsonSchema = SchemaValidator.toJsonSchema(zodSchema);

    expect(jsonSchema.type).toBe('object');
    expect(jsonSchema.properties).toHaveProperty('name');
    expect(jsonSchema.properties).toHaveProperty('age');
  });

  it('should validate data against Zod schema', () => {
    const schema = z.object({
      name: z.string(),
      age: z.number()
    });

    const validData = { name: 'John', age: 30 };
    const result = SchemaValidator.validate(validData, schema);

    expect(result.success).toBe(true);
    expect(result.data).toEqual(validData);
  });

  it('should return error for invalid data', () => {
    const schema = z.object({
      name: z.string(),
      age: z.number()
    });

    const invalidData = { name: 'John', age: 'thirty' };
    const result = SchemaValidator.validate(invalidData, schema);

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });
});
