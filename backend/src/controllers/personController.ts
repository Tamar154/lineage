import type { RequestHandler } from "express";

const createPerson: RequestHandler = (req, res) => {};
const getPersons: RequestHandler = (req, res) => {};

const getPersonById: RequestHandler = (req, res) => {};
const updatePerson: RequestHandler = (req, res) => {};
const deletePerson: RequestHandler = (req, res) => {};

export { createPerson, getPersons, getPersonById, updatePerson, deletePerson };
