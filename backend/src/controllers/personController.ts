import type { RequestHandler } from "express";
import type { CreatePersonInput } from "../validators/personValidators.js";
import { prisma } from "../config/db.js";
import AppError from "../utils/AppError.js";

type PersonParams = {
  id: string;
};

const createPerson: RequestHandler<{}, {}, CreatePersonInput> = async (
  req,
  res,
) => {
  const { firstName, lastName, birthDate, deathDate, bio } = req.body;

  const person = await prisma.person.create({
    data: {
      firstName,
      lastName,
      birthDate: birthDate ?? null,
      deathDate: deathDate ?? null,
      bio: bio ?? null,
      treeId: req.tree.id,
    },
  });

  res.status(201).json({
    status: "success",
    data: {
      id: person.id,
      firstName: person.firstName,
      lastName: person.lastName,
      birthDate: person.birthDate,
      deathDate: person.deathDate,
      bio: person.bio,
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
      birthDate: true,
      deathDate: true,
      bio: true,
    },
  });

  res.json({ status: "success", data: persons });
};

const getPersonById: RequestHandler<PersonParams> = async (req, res) => {
  const person = await prisma.person.findFirst({
    where: {
      id: req.params.id,
      treeId: req.tree!.id,
    },
  });

  if (!person) throw new AppError("Person not found", 404);

  res.json({
    status: "success",
    data: {
      id: person.id,
      firstName: person.firstName,
      lastName: person.lastName,
      birthDate: person.birthDate,
      deathDate: person.deathDate,
      bio: person.bio,
    },
  });
};

const updatePerson: RequestHandler<PersonParams> = async (req, res) => {
  const existingPerson = await prisma.person.findFirst({
    where: {
      id: req.params.id,
      treeId: req.tree!.id,
    },
  });

  if (!existingPerson) throw new AppError("Person not found", 404);

  const { firstName, lastName, birthDate, deathDate, bio } = req.body;

  const person = await prisma.person.update({
    where: {
      id: req.params.id,
    },
    data: {
      firstName: firstName ?? existingPerson.firstName,
      lastName: lastName ?? existingPerson.lastName,
      birthDate: birthDate ?? existingPerson.birthDate,
      deathDate: deathDate ?? existingPerson.deathDate,
      bio: bio ?? existingPerson.bio,
    },
  });

  res.json({
    status: "success",
    data: {
      id: person.id,
      firstName: person.firstName,
      lastName: person.lastName,
      birthDate: person.birthDate,
      deathDate: person.deathDate,
      bio: person.bio,
    },
  });
};

const deletePerson: RequestHandler<PersonParams> = async (req, res) => {
  const existingPerson = await prisma.person.findFirst({
    where: {
      id: req.params.id,
      treeId: req.tree!.id,
    },
  });

  if (!existingPerson) throw new AppError("Person not found", 404);

  await prisma.person.delete({
    where: {
      id: req.params.id,
      treeId: req.tree!.id,
    },
  });

  res.status(204).send();
};

export { createPerson, getPersons, getPersonById, updatePerson, deletePerson };
