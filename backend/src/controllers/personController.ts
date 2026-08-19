import type { RequestHandler } from "express";
import type {
  CreatePersonInput,
  UpdatePersonInput,
} from "../validators/personValidators.js";
import { validatePersonDates } from "../validators/personValidators.js";
import { prisma } from "../config/db.js";
import AppError from "../utils/AppError.js";
import type { ApiSuccess } from "../dtos/apiSuccess.js";
import { personSelect, toPersonDto, type PersonDto } from "../dtos/personDto.js";

type PersonParams = { personId: string };

const createPerson: RequestHandler<
  Record<string, never>,
  ApiSuccess<PersonDto>,
  CreatePersonInput
> = async (req, res) => {
  const person = await prisma.person.create({
    data: {
      treeId: req.tree.id,
      firstName: req.body.firstName,
      lastName: req.body.lastName ?? null,
      gender: req.body.gender ?? "UNKNOWN",
      birthDate: req.body.birthDate ?? null,
      birthDatePrecision: req.body.birthDatePrecision ?? null,
      deathDate: req.body.deathDate ?? null,
      deathDatePrecision: req.body.deathDatePrecision ?? null,
      birthPlace: req.body.birthPlace ?? null,
      biography: req.body.biography ?? null,
    },
    select: personSelect,
  });

  res.status(201).json({ data: toPersonDto(person) });
};

const updatePerson: RequestHandler<
  PersonParams,
  ApiSuccess<PersonDto>,
  UpdatePersonInput
> = async (req, res) => {
  const existing = await prisma.person.findFirst({
    where: { id: req.params.personId, treeId: req.tree.id },
  });
  if (!existing) throw new AppError("Person not found", 404);

  const mergedDates = {
    birthDate:
      req.body.birthDate !== undefined ? req.body.birthDate : existing.birthDate,
    birthDatePrecision:
      req.body.birthDatePrecision !== undefined
        ? req.body.birthDatePrecision
        : existing.birthDatePrecision,
    deathDate:
      req.body.deathDate !== undefined ? req.body.deathDate : existing.deathDate,
    deathDatePrecision:
      req.body.deathDatePrecision !== undefined
        ? req.body.deathDatePrecision
        : existing.deathDatePrecision,
  };

  const dateErrors = validatePersonDates(mergedDates);
  if (dateErrors.length) throw new AppError(dateErrors.join("; "), 400);

  const data = Object.fromEntries(
    Object.entries(req.body).filter(([, value]) => value !== undefined),
  );

  const person = await prisma.person.update({
    where: { id: existing.id },
    data,
    select: personSelect,
  });
  res.json({ data: toPersonDto(person) });
};

const deletePerson: RequestHandler<PersonParams> = async (req, res) => {
  const existing = await prisma.person.findFirst({
    where: { id: req.params.personId, treeId: req.tree.id },
  });
  if (!existing) throw new AppError("Person not found", 404);
  await prisma.person.delete({ where: { id: existing.id } });
  res.status(204).send();
};

export { createPerson, updatePerson, deletePerson };
