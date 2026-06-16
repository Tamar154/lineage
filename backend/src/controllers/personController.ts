import type { RequestHandler } from "express";
import type { CreatePersonInput } from "../validators/personValidators.js";
import { prisma } from "../config/db.js";
import AppError from "../utils/AppError.js";
import type { PersonResponse } from "../types/person.js";

type PersonParams = {
  id: string;
};

const createPerson: RequestHandler<
  Record<string, never>,
  PersonResponse,
  CreatePersonInput
> = async (req, res) => {
  const {
    firstName,
    lastName,
    gender,
    birthDate,
    deathDate,
    birthPlace,
    biography,
  } = req.body;

  const person = await prisma.person.create({
    data: {
      firstName,
      lastName: lastName ?? null,
      gender: gender ?? null,
      birthDate: birthDate ?? null,
      deathDate: deathDate ?? null,
      birthPlace: birthPlace ?? null,
      biography: biography ?? null,
      treeId: req.tree.id,
    },
  });

  res.status(201).json({
    status: "success",
    data: {
      id: person.id,
      firstName: person.firstName,
      lastName: person.lastName,
      gender: person.gender,
      birthDate: person.birthDate,
      deathDate: person.deathDate,
      birthPlace: person.birthPlace,
      biography: person.biography,
    },
  });
};

const getPersons: RequestHandler = async (req, res) => {
  const persons = await prisma.person.findMany({
    where: {
      treeId: req.tree.id,
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      gender: true,
      birthDate: true,
      deathDate: true,
      birthPlace: true,
      biography: true,
    },
  });

  res.json({ status: "success", data: persons });
};

const getPersonById: RequestHandler<PersonParams> = async (req, res) => {
  const person = await prisma.person.findFirst({
    where: {
      id: req.params.id,
      treeId: req.tree.id,
    },
  });

  if (!person) throw new AppError("Person not found", 404);

  res.json({
    status: "success",
    data: {
      id: person.id,
      firstName: person.firstName,
      lastName: person.lastName,
      gender: person.gender,
      birthDate: person.birthDate,
      deathDate: person.deathDate,
      birthPlace: person.birthPlace,
      biography: person.biography,
    },
  });
};

const updatePerson: RequestHandler<
  PersonParams,
  PersonResponse,
  CreatePersonInput
> = async (req, res) => {
  const existingPerson = await prisma.person.findFirst({
    where: {
      id: req.params.id,
      treeId: req.tree.id,
    },
  });

  if (!existingPerson) throw new AppError("Person not found", 404);

  const {
    firstName,
    lastName,
    gender,
    birthDate,
    deathDate,
    birthPlace,
    biography,
  } = req.body;

  const person = await prisma.person.update({
    where: {
      id: req.params.id,
    },
    data: {
      firstName,
      lastName: lastName ?? null,
      gender: gender ?? null,
      birthDate: birthDate ?? null,
      deathDate: deathDate ?? null,
      birthPlace: birthPlace ?? null,
      biography: biography ?? null,
    },
  });

  res.json({
    status: "success",
    data: {
      id: person.id,
      firstName: person.firstName,
      lastName: person.lastName,
      gender: person.gender,
      birthDate: person.birthDate,
      deathDate: person.deathDate,
      birthPlace: person.birthPlace,
      biography: person.biography,
    },
  });
};

const deletePerson: RequestHandler<PersonParams> = async (req, res) => {
  const existingPerson = await prisma.person.findFirst({
    where: {
      id: req.params.id,
      treeId: req.tree.id,
    },
  });

  if (!existingPerson) throw new AppError("Person not found", 404);

  await prisma.person.delete({
    where: {
      id: req.params.id,
      treeId: req.tree.id,
    },
  });

  res.status(204).send();
};

export { createPerson, getPersons, getPersonById, updatePerson, deletePerson };
