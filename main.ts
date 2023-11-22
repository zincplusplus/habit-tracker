import { Plugin } from "obsidian";
import HabitTracker from "./HabitTracker";

export default class HabitTracker21 extends Plugin {

  async onload() {
		this.registerMarkdownCodeBlockProcessor("habittracker", async (src, el, ctx) => {
			new HabitTracker(src, el, ctx, this.app);
		});
  }
}