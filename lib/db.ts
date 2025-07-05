import Dexie, { Table } from "dexie";
import { Meal, Ingredient, Liquid, Symptom, Stool } from "./types";

export class HealthTrackerDB extends Dexie {
  meals!: Table<Meal, string>;
  liquids!: Table<Liquid, string>;
  symptoms!: Table<Symptom, string>;
  stools!: Table<Stool, string>;

  constructor() {
    super("HealthTrackerDB");
    this.version(1).stores({
      meals: "++id, date",
      liquids: "++id, date, type",
      symptoms: "++id, date",
      stools: "++id, date",
    });
  }
}

export const db = new HealthTrackerDB();
