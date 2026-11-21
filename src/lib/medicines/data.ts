import raw from "../../../data/medicines.json";
import type { MedicinesFile } from "./match";

/** The ingredient list. `npm run ingest` replaces data/medicines.json with the full register. */
export const medicines = raw as unknown as MedicinesFile;
