import type { RequestHandler } from "express";
import type { CreatePersonInput } from "../validators/personValidators.js";
import { prisma } from "../config/db.js";

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

  res.status(201).json({ status: "success", data: person });
};

const getPersons: RequestHandler = async (req, res) => {
  const persons = await prisma.person.findMany({
    where: {
      treeId: req.tree.id,
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

  res.json({ status: "success", data: person });
};
const updatePerson: RequestHandler = async (req, res) => {};
const deletePerson: RequestHandler = async (req, res) => {};

export { createPerson, getPersons, getPersonById, updatePerson, deletePerson };
