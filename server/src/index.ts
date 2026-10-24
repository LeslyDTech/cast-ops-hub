import { config } from "./config.js";
import { createApp } from "./app.js";

createApp().listen(config.PORT, () => {
  console.log(`Cast Ops Hub API listening on http://localhost:${config.PORT}`);
});
