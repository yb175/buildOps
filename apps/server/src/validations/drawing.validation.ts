import { Discipline } from "@prisma/client";

const VALID_DISCIPLINES = Object.values(Discipline);

/**
 * Validates whether a value is a valid Discipline enum member.
 */
export const validateDiscipline = (value: any): value is Discipline => {
  return VALID_DISCIPLINES.includes(value);
};
