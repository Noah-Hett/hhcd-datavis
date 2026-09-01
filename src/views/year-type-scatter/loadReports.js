import { reports as catalogue } from "../../data/index.js";

export const reports = catalogue.map((report) => ({
  ...report,
  methods: report.methodsPrimary ?? [],
}));
