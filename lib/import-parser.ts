import { z } from "zod";
import { CourseSchema, ComponentsArraySchema } from "./validations";
import { Result } from "./transactions";

export const ImportCourseSchema = CourseSchema.extend({
  components: ComponentsArraySchema,
});

export const ImportDataSchema = z.object({
  courses: z.array(ImportCourseSchema),
});

export type ImportData = z.infer<typeof ImportDataSchema>;

/**
 * Parses and validates a JSON string into an ImportData object.
 * Returns descriptive validation errors if the data is invalid.
 */
export function parseImportData(jsonString: string): Result<ImportData> {
  try {
    const data = JSON.parse(jsonString);
    const result = ImportDataSchema.safeParse(data);
    
    if (!result.success) {
      // Format detailed error messages
      const errors = result.error.errors.map(err => {
        const path = err.path.join('.');
        return `${path ? path + ': ' : ''}${err.message}`;
      }).join(', ');
      
      return { success: false, error: `Validation Error: ${errors}` };
    }
    
    return { success: true, data: result.data };
  } catch (error) {
    return { success: false, error: "Invalid JSON format: Ensure the file contains valid JSON data." };
  }
}
