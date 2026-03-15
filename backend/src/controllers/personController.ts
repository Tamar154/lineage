import type { RequestHandler } from "express";
import type { CreatePersonInput } from "../validators/personValidators.js";
import { prisma } from "../config/db.js";

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

const getPersons: RequestHandler = (req, res) => {};

const getPersonById: RequestHandler = (req, res) => {};
const updatePerson: RequestHandler = (req, res) => {};
const deletePerson: RequestHandler = (req, res) => {};

export { createPerson, getPersons, getPersonById, updatePerson, deletePerson };
